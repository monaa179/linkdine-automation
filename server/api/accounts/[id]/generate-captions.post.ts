import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const id = parseInt(event.context.params?.id || '')

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid account ID' })
    }

    // Verify account ownership
    const account = await (prisma as any).account.findUnique({
        where: { id },
        include: { posts: { where: { aiCaption: null } } }
    })

    if (!account) {
        throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }

    const postsToProcess = account.posts

    if (postsToProcess.length === 0) {
        return { message: 'No images to process in gallery' }
    }

    const makeWebhookUrl = process.env.MAKE_GENERATE_CAPTION_WEBHOOK_URL
    if (!makeWebhookUrl) {
        throw createError({ statusCode: 500, statusMessage: 'Make.com webhook URL not configured' })
    }

    console.log(`[Webhook Trigger] Sending to Make: ${makeWebhookUrl}`)
    const payload = {
        accountId: account.id,
        accountName: account.name,
        contextPrompt: account.contextPrompt,
        imageCount: postsToProcess.length
    }
    console.log(`[Webhook Trigger] Payload:`, payload)

    // Trigger webhook ONCE for the whole account/gallery
    try {
        await $fetch(makeWebhookUrl, {
            method: 'POST',
            body: payload
        })
    } catch (err: any) {
        console.error('[Webhook Trigger] Error:', err.message)
        throw createError({ statusCode: 500, statusMessage: `Erreur webhook Make: ${err.message}` })
    }

    return {
        message: `Triggered caption generation for ${postsToProcess.length} images.`,
        accountId: account.id
    }
})
