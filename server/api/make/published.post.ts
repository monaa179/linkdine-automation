import { requireWebhookAuth } from '../../utils/webhook'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireWebhookAuth(event)

    const body = await readBody(event)
    const { postId } = body

    if (!postId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'postId is required'
        })
    }

    try {
        const post = await prisma.post.update({
            where: { id: parseInt(postId) },
            data: {
                status: 'published',
                publishedAt: new Date()
            }
        })
        return post
    } catch (error) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Post not found'
        })
    }
})
