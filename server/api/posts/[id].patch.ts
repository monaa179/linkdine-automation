import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const auth = requireAuth(event)
    const id = parseInt(getRouterParam(event, 'id') || '')

    if (isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid post ID'
        })
    }

    // Verify ownership
    const post = await prisma.post.findFirst({
        where: {
            id,
            linkedinAccount: {
                userId: auth.userId
            }
        }
    })

    if (!post) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Post not found'
        })
    }

    const body = await readBody(event)
    const updateData: Record<string, unknown> = {}

    if (body.imageUrl !== undefined) {
        updateData.imageUrl = body.imageUrl
    }

    if (body.imageDescription !== undefined) {
        updateData.imageDescription = body.imageDescription || null
    }

    if (body.aiCaption !== undefined) {
        updateData.aiCaption = body.aiCaption
    }

    if (body.editedCaption !== undefined) {
        updateData.editedCaption = body.editedCaption || null
    }

    if (body.status !== undefined) {
        const validStatuses = ['draft', 'scheduled', 'published']
        if (!validStatuses.includes(body.status)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid status'
            })
        }
        updateData.status = body.status
    }

    if (body.scheduledAt !== undefined) {
        updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    }

    if (body.publishedAt !== undefined) {
        updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null
    }

    const updated = await prisma.post.update({
        where: { id },
        data: updateData,
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

    return { post: updated }
})
