import { verifyPassword, generateToken } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { email, password } = body

    if (!email || !password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email and password are required'
        })
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials'
        })
    }

    const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
    })

    // Set cookie
    setCookie(event, 'auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return {
        id: user.id,
        email: user.email,
        role: user.role
    }
})
