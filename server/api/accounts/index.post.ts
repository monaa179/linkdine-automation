import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const body = await readBody(event)

    const {
        name,
        makeConnection,
        contextPrompt,
        postingFrequency,
        postingPeriod,
        postingDay,
        postingHour
    } = body

    if (!name || !makeConnection || !contextPrompt) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Name, makeConnection, and contextPrompt are required'
        })
    }

    const account = await prisma.account.create({
        data: {
            userId: user.userId,
            name,
            makeConnection,
            contextPrompt,
            postingFrequency: postingFrequency || 1,
            postingPeriod: postingPeriod || 'week',
            postingDay,
            postingHour: postingHour || '09:00'
        }
    })

    return account
})
