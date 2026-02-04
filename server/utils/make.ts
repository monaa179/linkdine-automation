export async function triggerMakeWebhook(url: string, payload: any) {
    console.log(`[Make Webhook Trigger] Sending to: ${url}`)
    console.log(`[Make Webhook Trigger] Payload:`, JSON.stringify(payload, null, 2))

    try {
        const response = await $fetch(url, {
            method: 'POST',
            body: payload
        })
        return response
    } catch (error: any) {
        console.error(`[Make Webhook Trigger] Failed:`, error.message)
        throw createError({
            statusCode: 502,
            statusMessage: `Erreur lors de la communication avec Make.com: ${error.message}`,
            data: error.message
        })
    }
}
