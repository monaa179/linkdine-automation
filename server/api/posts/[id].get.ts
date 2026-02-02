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

    const post = await prisma.post.findFirst({
        where: {
            id,
            linkedinAccount: {
                userId: auth.userId
            }
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

    if (!post) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Post not found'
        })
    }

    return { post }
})
