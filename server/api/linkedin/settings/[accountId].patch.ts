import { prisma } from '../../../utils/prisma'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const auth = requireAuth(event)
    const accountId = parseInt(getRouterParam(event, 'accountId') || '')

    if (isNaN(accountId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid account ID'
        })
    }

    // Verify ownership
    const account = await prisma.linkedInAccount.findFirst({
        where: {
            id: accountId,
            userId: auth.userId
        }
    })

    if (!account) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Account not found'
        })
    }

    const body = await readBody(event)

    // Validate posting settings
    const updateData: Record<string, unknown> = {}

    if (body.contextPrompt !== undefined) {
        updateData.contextPrompt = body.contextPrompt
    }

    if (body.postingFrequency !== undefined) {
        const freq = parseInt(body.postingFrequency)
        if (isNaN(freq) || freq < 1 || freq > 7) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Posting frequency must be between 1 and 7'
            })
        }
        updateData.postingFrequency = freq
    }

    if (body.postingPeriod !== undefined) {
        if (!['week'].includes(body.postingPeriod)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid posting period'
            })
        }
        updateData.postingPeriod = body.postingPeriod
    }

    if (body.postingDay !== undefined) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        if (!validDays.includes(body.postingDay)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid posting day'
            })
        }
        updateData.postingDay = body.postingDay
    }

    if (body.postingHour !== undefined) {
        // Validate time format HH:MM
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
        if (!timeRegex.test(body.postingHour)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid posting hour format (use HH:MM)'
            })
        }
        updateData.postingHour = body.postingHour
    }

    if (body.type !== undefined) {
        if (!['personal', 'company'].includes(body.type)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid account type'
            })
        }
        updateData.type = body.type
    }

    if (body.linkedinPageId !== undefined) {
        updateData.linkedinPageId = body.linkedinPageId || null
    }

    // Update account
    const updated = await prisma.linkedInAccount.update({
        where: { id: accountId },
        data: updateData,
        select: {
            id: true,
            name: true,
            type: true,
            contextPrompt: true,
            postingFrequency: true,
            postingPeriod: true,
            postingDay: true,
            postingHour: true,
            linkedinPageId: true
        }
    })

    return { account: updated }
})
