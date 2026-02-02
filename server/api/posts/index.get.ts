import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const auth = requireAuth(event)
    const query = getQuery(event)

    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const status = query.status as string | undefined
    const linkedinAccountId = query.linkedinAccountId ? parseInt(query.linkedinAccountId as string) : undefined

    // Build where clause
    const where: Record<string, unknown> = {
        linkedinAccount: {
            userId: auth.userId
        }
    }

    if (status) {
        const validStatuses = ['draft', 'scheduled', 'published']
        if (validStatuses.includes(status)) {
            where.status = status
        }
    }

    if (linkedinAccountId && !isNaN(linkedinAccountId)) {
        where.linkedinAccountId = linkedinAccountId
    }

    // Get total count
    const total = await prisma.post.count({ where })

    // Get posts
    const posts = await prisma.post.findMany({
        where,
        include: {
            linkedinAccount: {
                select: {
                    id: true,
                    name: true,
                    type: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
    })

    return {
        posts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
})
