import { prisma } from '../../utils/prisma'
import { requireCronAuth } from '../../utils/webhook'

export default defineEventHandler(async (event) => {
    requireCronAuth(event)

    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const currentHour = now.getHours().toString().padStart(2, '0')
    const currentMinute = now.getMinutes().toString().padStart(2, '0')
    const currentTime = `${currentHour}:${currentMinute}`

    // Find accounts that should post now
    const accounts = await prisma.linkedInAccount.findMany({
        where: {
            postingDay: currentDay as any,
            postingHour: currentTime,
            tokenExpiresAt: {
                gt: now // Token must be valid
            }
        },
        include: {
            posts: {
                where: {
                    status: 'scheduled',
                    scheduledAt: {
                        lte: now
                    }
                },
                orderBy: { scheduledAt: 'asc' },
                take: 1
            }
        }
    })

    const scheduled: number[] = []
    const errors: { accountId: number; error: string }[] = []

    for (const account of accounts) {
        try {
            // Check if there's a post ready to publish
            if (account.posts.length > 0) {
                const post = account.posts[0]

                // Mark as ready for publishing (Make.com will pick this up)
                await prisma.post.update({
                    where: { id: post.id },
                    data: {
                        status: 'scheduled' // Keep scheduled, Make.com will mark as published
                    }
                })

                scheduled.push(post.id)
            }
        } catch (error) {
            errors.push({
                accountId: account.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }

    return {
        success: true,
        processedAccounts: accounts.length,
        scheduledPosts: scheduled,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: now.toISOString()
    }
})
