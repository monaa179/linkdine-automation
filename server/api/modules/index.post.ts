import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireAuth(event)

    const body = await readBody(event)
    const { name, script } = body

    if (!name || !script) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Name and script are required'
        })
    }

    const module = await prisma.module.create({
        data: {
            name,
            script
        },
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

    return module
})
