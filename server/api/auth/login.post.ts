import { prisma } from '../../utils/prisma'
import { verifyPassword, generateToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    // Validation
    if (!body.email || !body.password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email and password are required'
        })
    }

    const email = body.email.toLowerCase().trim()
    const password = body.password

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials'
        })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials'
        })
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email })

    // Set cookie
    setCookie(event, 'auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return {
        user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt
        },
        token
    }
})
