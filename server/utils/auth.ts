import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

const SALT_ROUNDS = 12

interface JwtPayload {
    userId: number
    email: string
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

export function generateToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET is not defined')
    }
    return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET is not defined')
    }
    return jwt.verify(token, secret) as JwtPayload
}

export function getTokenFromEvent(event: H3Event): string | null {
    // Try Authorization header first
    const authHeader = getHeader(event, 'authorization')
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7)
    }

    // Fallback to cookie
    const token = getCookie(event, 'auth_token')
    return token || null
}

export function getUserFromEvent(event: H3Event): JwtPayload | null {
    const token = getTokenFromEvent(event)
    if (!token) return null

    try {
        return verifyToken(token)
    } catch {
        return null
    }
}

export function requireAuth(event: H3Event): JwtPayload {
    const user = getUserFromEvent(event)
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }
    return user
}
