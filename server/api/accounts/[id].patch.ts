import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'
import { getNextAvailableSlots } from '../../utils/scheduler'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const id = parseInt(event.context.params?.id || '')

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
    }

    const body = await readBody(event)

    // Ensure account belongs to user
    const existingAccount = await (prisma as any).account.findFirst({
        where: { id }
    })

    if (!existingAccount) {
        throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }

    const account = await (prisma as any).account.update({
        where: { id },
        data: {
            name: body.name,
            makeConnection: body.makeConnection,
            contextPrompt: body.contextPrompt,
            postingFrequency: body.postingFrequency,
            postingPeriod: body.postingPeriod,
            postingDay: body.postingDay,
            postingHour: body.postingHour
        }
    })

    // Recalculate future posts (scheduled and drafts with captions)
    // We do this on every save to ensure consistency and allow "fixing" unscheduled posts
    const postsToSchedule = await (prisma as any).post.findMany({
        where: {
            accountId: id,
            OR: [
                { status: 'scheduled' },
                {
                    status: 'draft',
                    aiCaption: { not: null }
                }
            ]
        },
        orderBy: [
            { scheduledAt: 'asc' },
            { createdAt: 'asc' }
        ]
    })

    if (postsToSchedule.length > 0) {
        const newSlots = await getNextAvailableSlots(id, postsToSchedule.length, new Date())
        for (let i = 0; i < postsToSchedule.length; i++) {
            await (prisma as any).post.update({
                where: { id: postsToSchedule[i].id },
                data: {
                    scheduledAt: newSlots[i],
                    status: 'scheduled' // Ensure they are now scheduled
                }
            })
        }
    }
    return account
})
