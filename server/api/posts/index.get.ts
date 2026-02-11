import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)

    const query = getQuery(event)
    const accountId = query.accountId ? parseInt(query.accountId as string) : undefined

    const posts = await prisma.post.findMany({
        where: {
            accountId: accountId
        },
        include: {
            account: true,
            modules: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return posts
})
