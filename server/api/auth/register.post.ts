import { hashPassword, generateToken } from '../../utils/auth'
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        throw createError({
            statusCode: 409,
            statusMessage: 'User already exists'
        })
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash
        }
    })

    const token = generateToken({ userId: user.id, email: user.email })

    // Set cookie
    setCookie(event, 'auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return {
        id: user.id,
        email: user.email
    }
})
