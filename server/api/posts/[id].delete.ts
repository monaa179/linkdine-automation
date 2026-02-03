import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const id = parseInt(event.context.params?.id || '')

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
    }

    // Ensure post belongs to user
    const post = await prisma.post.findFirst({
        where: {
            id
        }
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found or access denied' })
    }

    await prisma.post.delete({
        where: { id }
    })

    return { message: 'Post deleted' }
})
