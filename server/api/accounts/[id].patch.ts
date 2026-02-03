import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const id = parseInt(event.context.params?.id || '')

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
    }

    const body = await readBody(event)

    // Ensure account belongs to user
    const existingAccount = await prisma.account.findFirst({
        where: { id }
    })

    if (!existingAccount) {
        throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }

    const account = await prisma.account.update({
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

    return account
})
