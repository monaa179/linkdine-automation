import { requireAuth } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'
import { triggerMakeWebhook } from '../../../utils/make'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const id = parseInt(event.context.params?.id || '')

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid account ID' })
    }

    // Verify account ownership and get posts with their modules
    const account = await (prisma as any).account.findUnique({
        where: { id },
        include: {
            posts: {
                where: { aiCaption: null },
                include: { module: true }
            }
        }
    })

    if (!account) {
        throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }

    const postsToProcess = account.posts

    if (postsToProcess.length === 0) {
        return { message: 'No images to process in gallery' }
    }

    const makeWebhookUrl = process.env.MAKE_GENERATE_ALL_CAPTIONS_WEBHOOK_URL
    if (!makeWebhookUrl) {
        throw createError({ statusCode: 500, statusMessage: 'Make.com webhook URL not configured' })
    }

    // Prepare detailed payload with all post information
    const payload = {
        accountId: account.id,
        accountName: account.name,
        contextPrompt: account.contextPrompt,
        imageCount: postsToProcess.length,
        posts: postsToProcess.map((post: any) => ({
            postId: post.id,
            imageUrl: post.imageUrl,
            moduleId: post.moduleId,
            moduleName: post.module?.name || null,
            moduleScript: post.module?.script || null,
            imageContext: post.imageContext || null
        }))
    }

    console.log(`[Bulk Caption Generation] Triggering for ${postsToProcess.length} posts`)
    console.log(`[Bulk Caption Generation] Payload:`, JSON.stringify(payload, null, 2))

    // Trigger webhook ONCE for the whole account/gallery via utility
    await triggerMakeWebhook(makeWebhookUrl, payload)

    return {
        message: `Triggered caption generation for ${postsToProcess.length} images.`,
        accountId: account.id
    }
})
