import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireAuth(event)

    const id = parseInt(event.context.params!.id)

    const module = await prisma.module.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            script: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true
                }
            }
        }
    })

    if (!module) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Module not found'
        })
    }

    return module
})
