import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const id = parseInt(event.context.params?.id || '')

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
    }

    // 1. Get post and check access
    const post = await (prisma as any).post.findFirst({
        where: { id },
        include: { account: true }
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // 2. Trigger Make.com webhook
    const makePublishWebhookUrl = process.env.MAKE_PUBLISH_WEBHOOK_URL
    if (!makePublishWebhookUrl) {
        throw createError({ statusCode: 500, statusMessage: 'MAKE_PUBLISH_WEBHOOK_URL not configured' })
    }

    try {
        await $fetch(makePublishWebhookUrl, {
            method: 'POST',
            body: {
                postId: post.id,
                accountName: post.account.name,
                imageUrl: `${process.env.APP_URL || 'http://localhost:3000'}${post.imageUrl}`,
                caption: post.editedCaption || post.aiCaption,
                makeConnection: (post.account as any).makeConnection,
                webhookSecret: process.env.MAKE_WEBHOOK_SECRET
            }
        })

        // 3. Update post status
        const updatedPost = await (prisma as any).post.update({
            where: { id: post.id },
            data: {
                status: 'published',
                publishedAt: new Date()
            }
        })

        return updatedPost
    } catch (err: any) {
        console.error(`Error manually publishing post ${post.id}:`, err)
        throw createError({ statusCode: 500, statusMessage: 'Failed to publish to LinkedIn via Make.com' })
    }
})
