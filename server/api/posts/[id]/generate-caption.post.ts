import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const postId = parseInt(event.context.params?.id || '')

    if (isNaN(postId)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid post ID' })
    }

    // Get the post with its account and module
    const post = await (prisma as any).post.findUnique({
        where: { id: postId },
        include: {
            account: true,
            module: true
        }
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Check if post already has a caption
    if (post.aiCaption) {
        throw createError({ statusCode: 400, statusMessage: 'This post already has a caption' })
    }

    const makeWebhookUrl = process.env.MAKE_GENERATE_SINGLE_CAPTION_WEBHOOK_URL
    if (!makeWebhookUrl) {
        throw createError({ statusCode: 500, statusMessage: 'Make.com webhook URL not configured' })
    }

    // Prepare payload for single image with module and context
    const payload = {
        accountId: post.account.id,
        accountName: post.account.name,
        contextPrompt: post.account.contextPrompt,
        imageCount: 1,
        postId: post.id,
        imageUrl: post.imageUrl,
        moduleId: post.moduleId,
        moduleName: post.module?.name || null,
        moduleScript: post.module?.script || null,
        imageContext: post.imageContext || null
    }

    console.log(`[Single Caption Generation] Triggering for post ${postId}`)
    console.log(`[Single Caption Generation] Payload:`, JSON.stringify(payload, null, 2))

    try {
        await $fetch(makeWebhookUrl, {
            method: 'POST',
            body: payload
        })

        return {
            message: 'Caption generation triggered successfully',
            postId: post.id
        }
    } catch (error: any) {
        console.error(`[Single Caption Generation] Failed:`, error.message)
        throw createError({
            statusCode: 502,
            statusMessage: `Erreur lors de la communication avec Make.com: ${error.message}`
        })
    }
})
