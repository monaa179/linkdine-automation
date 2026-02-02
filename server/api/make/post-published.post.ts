import { prisma } from '../../utils/prisma'
import { requireWebhookAuth } from '../../utils/webhook'

export default defineEventHandler(async (event) => {
    requireWebhookAuth(event)

    const body = await readBody(event)

    // Validation
    if (!body.postId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'postId is required'
        })
    }

    const postId = parseInt(body.postId)
    if (isNaN(postId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid postId'
        })
    }

    // Find the post
    const post = await prisma.post.findUnique({
        where: { id: postId }
    })

    if (!post) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Post not found'
        })
    }

    // Update post status to published
    const updated = await prisma.post.update({
        where: { id: postId },
        data: {
            status: 'published',
            publishedAt: new Date()
        },
        include: {
            linkedinAccount: {
                select: {
                    id: true,
                    name: true,
                    type: true
                }
            }
        }
    })

    return {
        success: true,
        post: updated
    }
})
