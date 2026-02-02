import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const auth = requireAuth(event)

    const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
            id: true,
            email: true,
            createdAt: true,
            linkedinAccounts: {
                select: {
                    id: true,
                    name: true,
                    type: true
                }
            }
        }
    })

    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
        })
    }

    return { user }
})
