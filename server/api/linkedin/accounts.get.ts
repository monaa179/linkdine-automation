import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const auth = requireAuth(event)

    const accounts = await prisma.linkedInAccount.findMany({
        where: { userId: auth.userId },
        select: {
            id: true,
            name: true,
            type: true,
            linkedinAccountId: true,
            linkedinPageId: true,
            tokenExpiresAt: true,
            contextPrompt: true,
            postingFrequency: true,
            postingPeriod: true,
            postingDay: true,
            postingHour: true,
            createdAt: true,
            _count: {
                select: { posts: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return {
        accounts: accounts.map(account => ({
            ...account,
            isTokenExpired: new Date() > account.tokenExpiresAt,
            postsCount: account._count.posts
        }))
    }
})
