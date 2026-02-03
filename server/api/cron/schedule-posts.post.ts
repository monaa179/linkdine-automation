import { requireCronAuth } from '../../utils/webhook'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireCronAuth(event)

    const now = new Date()
    const currentHour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // 1. Loop over all accounts
    const accounts = await prisma.account.findMany({
        include: {
            posts: {
                where: { status: 'scheduled' },
                orderBy: { scheduledAt: 'desc' },
                take: 1
            }
        }
    })

    const scheduledPosts = []

    for (const account of accounts) {
        // Simple logic: If it's the right time and day (if specified), or if it's just the right time for daily/weekly/monthly
        // For simplicity in this first version, we check if a post needs to be scheduled now.

        // Check if there are any drafts to schedule
        const oldestDraft = await prisma.post.findFirst({
            where: {
                accountId: account.id,
                status: 'draft'
            },
            orderBy: { createdAt: 'asc' }
        })

        if (!oldestDraft) continue

        // Check if we should schedule a new post based on frequency
        // Logic: Find the most recently scheduled/published post to see if enough time has passed.
        const lastPost = await prisma.post.findFirst({
            where: {
                accountId: account.id,
                status: { in: ['scheduled', 'published'] }
            },
            orderBy: { scheduledAt: 'desc' }
        })

        let shouldSchedule = false
        let nextScheduleAt = new Date()

        if (!lastPost) {
            shouldSchedule = true
        } else {
            const lastScheduledAt = lastPost.scheduledAt || lastPost.createdAt
            const diffMs = now.getTime() - lastScheduledAt.getTime()

            if (account.postingPeriod === 'day') {
                const interval = (24 / account.postingFrequency) * 60 * 60 * 1000
                if (diffMs >= interval) shouldSchedule = true
            } else if (account.postingPeriod === 'week') {
                const interval = (7 / account.postingFrequency) * 24 * 60 * 60 * 1000
                if (diffMs >= interval) shouldSchedule = true
            } else if (account.postingPeriod === 'month') {
                const interval = (30 / account.postingFrequency) * 24 * 60 * 60 * 1000
                if (diffMs >= interval) shouldSchedule = true
            }
        }

        if (shouldSchedule) {
            // Set scheduledAt based on account settings
            const [hour, minute] = account.postingHour.split(':').map(Number)
            nextScheduleAt.setHours(hour, minute, 0, 0)

            // If it's already past that hour today, schedule for tomorrow (or next available slot)
            if (nextScheduleAt < now) {
                nextScheduleAt.setDate(nextScheduleAt.getDate() + 1)
            }

            // Update post
            const scheduledPost = await prisma.post.update({
                where: { id: oldestDraft.id },
                data: {
                    status: 'scheduled',
                    scheduledAt: nextScheduleAt
                }
            })
            scheduledPosts.push(scheduledPost)
        }
    }

    // 2. Trigger publishing for posts scheduled for NOW
    const postsToPublish = await prisma.post.findMany({
        where: {
            status: 'scheduled',
            scheduledAt: { lte: now }
        },
        include: { account: true }
    })

    for (const post of postsToPublish) {
        const makePublishWebhookUrl = process.env.MAKE_PUBLISH_WEBHOOK_URL
        if (makePublishWebhookUrl) {
            $fetch(makePublishWebhookUrl, {
                method: 'POST',
                body: {
                    postId: post.id,
                    imageUrl: `${process.env.APP_URL || 'http://localhost:3000'}${post.imageUrl}`,
                    caption: post.editedCaption || post.aiCaption,
                    makeConnection: post.account.makeConnection,
                    webhookSecret: process.env.MAKE_WEBHOOK_SECRET
                }
            }).catch(err => console.error(`Error triggering publish for post ${post.id}:`, err))
        }
    }

    return {
        scheduled: scheduledPosts.length,
        published: postsToPublish.length
    }
})
