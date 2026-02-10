import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'
import { triggerMakeWebhook } from '../../../utils/make'

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

    // 2. Trigger Make.com webhook via utility
    const makePublishWebhookUrl = process.env.MAKE_PUBLISH_WEBHOOK_URL
    if (!makePublishWebhookUrl) {
        throw createError({ statusCode: 500, statusMessage: 'MAKE_PUBLISH_WEBHOOK_URL not configured' })
    }

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')

    const payload = {
        postId: post.id,
        accountName: post.account.name,
        imageUrl: `${appUrl}${post.imageUrl}`,
        caption: post.aiCaption,
        makeConnection: (post.account as any).makeConnection,
        webhookSecret: process.env.MAKE_WEBHOOK_SECRET
    }

    await triggerMakeWebhook(makePublishWebhookUrl, payload)

    // 3. Update post status
    const updatedPost = await (prisma as any).post.update({
        where: { id: post.id },
        data: {
            status: 'published',
            publishedAt: new Date()
        }
    })

    return updatedPost
})
