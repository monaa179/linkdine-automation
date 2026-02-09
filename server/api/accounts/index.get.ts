import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)

    const accounts = await prisma.account.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    posts: {
                        where: { status: 'published' }
                    }
                }
            },
            posts: {
                orderBy: { createdAt: 'desc' },
                take: 50 // Fetch enough to filter in memory for complex criteria if needed, or use multiple queries
            }
        }
    })

    // Enrich accounts with specific stats that are harder to do in a single Prisma include
    const enrichedAccounts = await Promise.all(accounts.map(async (account) => {
        const lastPublished = await prisma.post.findFirst({
            where: { accountId: account.id, status: 'published' },
            orderBy: { publishedAt: 'desc' }
        })

        const lastScheduled = await prisma.post.findFirst({
            where: { accountId: account.id, status: 'scheduled' },
            orderBy: { scheduledAt: 'desc' }
        })

        const galleryCount = await prisma.post.count({
            where: {
                accountId: account.id,
                aiCaption: null,
                editedCaption: null
            }
        })

        return {
            ...account,
            stats: {
                publishedCount: account._count.posts,
                lastPublished,
                lastScheduled,
                galleryCount
            }
        }
    }))

    return enrichedAccounts
})
