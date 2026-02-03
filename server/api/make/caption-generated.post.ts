import { requireWebhookAuth } from '../../utils/webhook'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireWebhookAuth(event)

    const body = await readBody(event)
    console.log('Webhook Received Body:', body)
    const { postId, aiCaption } = body

    if (!postId || !aiCaption) {
        throw createError({
            statusCode: 400,
            statusMessage: 'postId and aiCaption are required'
        })
    }

    const idStr = String(postId)
    const id = parseInt(idStr)

    console.log('Webhook Debug - Original postId:', postId, 'Type:', typeof postId)
    console.log('Webhook Debug - Parsed ID:', id)

    if (isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid postId format'
        })
    }

    const post = await prisma.post.findUnique({
        where: { id }
    })

    if (!post) {
        throw createError({
            statusCode: 404,
            statusMessage: `Post with ID ${id} not found`
        })
    }

    try {
        const updatedPost = await prisma.post.update({
            where: { id },
            data: { aiCaption }
        })
        return updatedPost
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update post',
            data: error.message
        })
    }
})
