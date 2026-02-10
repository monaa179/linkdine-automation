import { getUserFromEvent } from '../../utils/auth'
import { verifyCronSecret } from '../../utils/webhook'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    // Allow either a regular user OR a valid cron call from Make
    const user = getUserFromEvent(event)
    const isCron = verifyCronSecret(event)

    if (!user && !isCron) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const id = parseInt(event.context.params?.id || '')

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
    }

    const body = await readBody(event)

    // Ensure post belongs to user
    const post = await prisma.post.findFirst({
        where: {
            id
        }
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found or access denied' })
    }

    const updatedPost = await prisma.post.update({
        where: { id },
        data: {
            aiCaption: body.aiCaption,
            status: body.status,
            scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined
        }
    })

    return updatedPost
})
