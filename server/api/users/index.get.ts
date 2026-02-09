import { requireAdmin } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireAdmin(event)

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return users
})
