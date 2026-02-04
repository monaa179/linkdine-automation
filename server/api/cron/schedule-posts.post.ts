import { requireCronAuth } from '../../utils/webhook'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireCronAuth(event)

    const now = new Date()
    const currentHour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // 1. Get posts scheduled for NOW or in the past that haven't been published
    const postsToPublish = await prisma.post.findMany({
        where: {
            status: 'scheduled',
            scheduledAt: { lte: now }
        },
        include: { account: true }
    })

    const publishedResults = []

    for (const post of postsToPublish) {
        const makePublishWebhookUrl = process.env.MAKE_PUBLISH_WEBHOOK_URL
        if (makePublishWebhookUrl) {
            try {
                await $fetch(makePublishWebhookUrl, {
                    method: 'POST',
                    body: {
                        postId: post.id,
                        imageUrl: `${process.env.APP_URL || 'http://localhost:3000'}${post.imageUrl}`,
                        caption: post.editedCaption || post.aiCaption,
                        makeConnection: (post.account as any).makeConnection,
                        webhookSecret: process.env.MAKE_WEBHOOK_SECRET
                    }
                })

                // Update post status to published
                await prisma.post.update({
                    where: { id: post.id },
                    data: {
                        status: 'published',
                        publishedAt: new Date()
                    }
                })
                publishedResults.push(post.id)
            } catch (err: any) {
                console.error(`Error triggering publish for post ${post.id}:`, err)
            }
        }
    }

    return {
        publishedCount: publishedResults.length,
        publishedIds: publishedResults
    }
})
