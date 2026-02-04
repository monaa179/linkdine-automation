import { verifyCronSecret } from '../../utils/webhook'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    if (!verifyCronSecret(event)) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid cron secret' })
    }

    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const posts = await (prisma as any).post.findMany({
        where: {
            status: 'scheduled',
            scheduledAt: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            account: {
                include: { user: true }
            }
        },
        orderBy: { scheduledAt: 'asc' }
    })

    const appUrl = process.env.APP_URL || 'http://localhost:3000'

    return {
        count: posts.length,
        date: startOfDay.toISOString().split('T')[0],
        posts: posts.map((p: any) => ({
            id: p.id,
            userEmail: p.account.user.email,
            accountName: p.account.name,
            imageUrl: p.imageUrl.startsWith('http') ? p.imageUrl : `${appUrl}${p.imageUrl}`,
            caption: p.editedCaption || p.aiCaption,
            scheduledAt: p.scheduledAt,
            makeConnection: p.account.makeConnection
        }))
    }
})
