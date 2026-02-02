import { prisma } from '../../utils/prisma'
import { hashPassword, generateToken } from '../../utils/auth'

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

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid email format'
        })
    }

    // Password strength validation
    if (password.length < 8) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Password must be at least 8 characters'
        })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Email already registered'
        })
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash
        },
        select: {
            id: true,
            email: true,
            createdAt: true
        }
    })

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
        user,
        token
    }
})
