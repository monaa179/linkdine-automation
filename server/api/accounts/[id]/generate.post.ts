import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)

    const id = parseInt(event.context.params?.id || '')
    if (isNaN(id)) {
        throw createError({ statusCode: 400, message: 'Invalid Account ID' })
    }

    // 1. Get the account and its context prompt
    const account = await prisma.account.findFirst({
        where: {
            id
        }
    })

    if (!account) {
        throw createError({ statusCode: 404, message: 'Account not found' })
    }

    const webhookUrl = process.env.MAKE_GENERATE_CAPTION_WEBHOOK_URL
    if (!webhookUrl) {
        throw createError({ statusCode: 500, message: 'Make.com webhook URL not configured' })
    }

    // 2. Send the request to Make.com
    try {
        const response = await $fetch(webhookUrl, {
            method: 'POST',
            body: {
                accountId: account.id,
                accountName: account.name,
                contextPrompt: account.contextPrompt,
                makeConnection: account.makeConnection,
                timestamp: new Date().toISOString()
            }
        })

        return {
            success: true,
            message: 'Génération lancée avec succès via Make.com',
            makeResponse: response
        }
    } catch (error: any) {
        console.error('Failed to trigger Make.com webhook', error)
        throw createError({
            statusCode: 502,
            message: 'Erreur lors de la communication avec Make.com',
            data: error.message
        })
    }
})
