import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    // Require authentication to initiate OAuth
    requireAuth(event)

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI

    if (!clientId || !redirectUri) {
        throw createError({
            statusCode: 500,
            statusMessage: 'LinkedIn OAuth not configured'
        })
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in cookie for validation
    setCookie(event, 'linkedin_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10 // 10 minutes
    })

    // LinkedIn OAuth scopes
    const scopes = [
        'openid',
        'profile',
        'email',
        'w_member_social'
    ].join(' ')

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('scope', scopes)

    return sendRedirect(event, authUrl.toString())
})
