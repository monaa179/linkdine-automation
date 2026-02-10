import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireAuth(event)

    const modules = await prisma.module.findMany({
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
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return modules
})
