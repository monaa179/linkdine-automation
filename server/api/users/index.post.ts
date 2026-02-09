import { requireAdmin, hashPassword } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireAdmin(event)

    const body = await readBody(event)
    const { email, password, role } = body

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

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: role || 'user'
        },
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true
        }
    })

    return user
})
