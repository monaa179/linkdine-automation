import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const auth = requireAuth(event)
    const query = getQuery(event)

    const { code, state, error } = query as {
        code?: string
        state?: string
        error?: string
    }

    // Handle OAuth errors
    if (error) {
        return sendRedirect(event, '/linkedin/error?message=' + encodeURIComponent(error))
    }

    if (!code || !state) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing authorization code or state'
        })
    }

    // Validate state
    const savedState = getCookie(event, 'linkedin_oauth_state')
    if (state !== savedState) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid state parameter'
        })
    }

    // Clear the state cookie
    deleteCookie(event, 'linkedin_oauth_state')

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
        throw createError({
            statusCode: 500,
            statusMessage: 'LinkedIn OAuth not configured'
        })
    }

    // Exchange code for access token
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
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret
        }).toString()
    })

    // Get user profile from LinkedIn
    const profileResponse = await $fetch<{
        sub: string
        name: string
        email: string
    }>('https://api.linkedin.com/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`
        }
    })

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

    // Check if account already exists
    const existingAccount = await prisma.linkedInAccount.findFirst({
        where: {
            userId: auth.userId,
            linkedinAccountId: profileResponse.sub
        }
    })

    if (existingAccount) {
        // Update existing account
        await prisma.linkedInAccount.update({
            where: { id: existingAccount.id },
            data: {
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                tokenExpiresAt,
                name: profileResponse.name
            }
        })
    } else {
        // Create new account
        await prisma.linkedInAccount.create({
            data: {
                userId: auth.userId,
                name: profileResponse.name,
                type: 'personal',
                linkedinAccountId: profileResponse.sub,
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                tokenExpiresAt,
                contextPrompt: ''
            }
        })
    }

    // Redirect to success page
    return sendRedirect(event, '/linkedin/success')
})
