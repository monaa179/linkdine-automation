import { createHmac } from 'crypto'
import type { H3Event } from 'h3'

export function verifyWebhookSecret(event: H3Event): boolean {
    const secret = process.env.MAKE_WEBHOOK_SECRET
    if (!secret) {
        throw new Error('MAKE_WEBHOOK_SECRET is not defined')
    }

    const providedSecret = getHeader(event, 'x-webhook-secret')
    return providedSecret === secret
}

export function verifyCronSecret(event: H3Event): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) {
        throw new Error('CRON_SECRET is not defined')
    }

    const providedSecret = getHeader(event, 'x-cron-secret')
    return providedSecret === secret
}

export function requireWebhookAuth(event: H3Event): void {
    if (!verifyWebhookSecret(event)) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid webhook secret'
        })
    }
}

export function requireCronAuth(event: H3Event): void {
    if (!verifyCronSecret(event)) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid cron secret'
        })
    }
}
