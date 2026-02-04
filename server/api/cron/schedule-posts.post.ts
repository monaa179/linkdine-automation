import { requireCronAuth } from '../../utils/webhook'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireCronAuth(event)

    const now = new Date()
    const currentHour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // 1. Get posts scheduled for NOW or in the past that haven't been published
    const postsToPublish = await (prisma as any).post.findMany({
        where: {
            status: 'scheduled',
            scheduledAt: { lte: now }
        },
        include: {
            account: {
                include: { user: true }
            }
        },
        orderBy: { scheduledAt: 'asc' }
    })

    if (postsToPublish.length === 0) {
        return { message: 'No posts to publish', count: 0 }
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const makePublishWebhookUrl = process.env.MAKE_PUBLISH_WEBHOOK_URL

    if (!makePublishWebhookUrl) {
        throw createError({ statusCode: 500, statusMessage: 'MAKE_PUBLISH_WEBHOOK_URL not configured' })
    }

    const payload = {
        timestamp: now.toISOString(),
        webhookSecret: process.env.MAKE_WEBHOOK_SECRET,
        posts: postsToPublish.map((post: any) => ({
            id: post.id,
            userEmail: post.account.user.email,
            accountId: post.linkedinAccountId,
            accountName: post.account.name,
            imageUrl: post.imageUrl.startsWith('http') ? post.imageUrl : `${appUrl}${post.imageUrl}`,
            caption: post.editedCaption || post.aiCaption,
            makeConnection: post.account.makeConnection,
            scheduledAt: post.scheduledAt
        }))
    }

    try {
        await $fetch(makePublishWebhookUrl, {
            method: 'POST',
            body: payload
        })

        return {
            message: 'Posts pushed to Make.com',
            count: postsToPublish.length
        }
    } catch (err: any) {
        console.error('Error pushing posts to Make.com:', err)
        throw createError({ statusCode: 500, statusMessage: 'Failed to push posts to Make.com' })
    }
})
