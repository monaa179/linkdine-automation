import { prisma } from '../../utils/prisma'
import { requireCronAuth } from '../../utils/webhook'

export default defineEventHandler(async (event) => {
    requireCronAuth(event)

    const now = new Date()
    // Refresh tokens that expire in the next 24 hours
    const refreshThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find accounts with expiring tokens
    const accounts = await prisma.linkedInAccount.findMany({
        where: {
            tokenExpiresAt: {
                lte: refreshThreshold
            },
            refreshToken: {
                not: null
            }
        }
    })

    const refreshed: number[] = []
    const errors: { accountId: number; error: string }[] = []

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        throw createError({
            statusCode: 500,
            statusMessage: 'LinkedIn OAuth not configured'
        })
    }

    for (const account of accounts) {
        if (!account.refreshToken) continue

        try {
            // Refresh the token
            const tokenResponse = await $fetch<{
                access_token: string
                expires_in: number
                refresh_token?: string
                refresh_token_expires_in?: number
            }>('https://www.linkedin.com/oauth/v2/accessToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: account.refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret
                }).toString()
            })

            // Calculate new expiration
            const tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

            // Update account with new tokens
            await prisma.linkedInAccount.update({
                where: { id: account.id },
                data: {
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token || account.refreshToken,
                    tokenExpiresAt
                }
            })

            refreshed.push(account.id)
        } catch (error) {
            errors.push({
                accountId: account.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }

    return {
        success: true,
        processedAccounts: accounts.length,
        refreshedTokens: refreshed,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: now.toISOString()
    }
})
