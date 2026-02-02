import { prisma } from '../../utils/prisma'
import { requireWebhookAuth } from '../../utils/webhook'

export default defineEventHandler(async (event) => {
    requireWebhookAuth(event)

    const body = await readBody(event)

    // Validation
    if (!body.postId && !body.linkedinAccountId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'postId or linkedinAccountId is required'
        })
    }

    if (!body.imageUrl) {
        throw createError({
            statusCode: 400,
            statusMessage: 'imageUrl is required'
        })
    }

    let linkedinAccount
    let post

    if (body.postId) {
        // Get existing post
        post = await prisma.post.findUnique({
            where: { id: parseInt(body.postId) },
            include: { linkedinAccount: true }
        })

        if (!post) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Post not found'
            })
        }

        linkedinAccount = post.linkedinAccount
    } else {
        // Get LinkedIn account
        linkedinAccount = await prisma.linkedInAccount.findUnique({
            where: { id: parseInt(body.linkedinAccountId) }
        })

        if (!linkedinAccount) {
            throw createError({
                statusCode: 404,
                statusMessage: 'LinkedIn account not found'
            })
        }

        // Create a draft post
        post = await prisma.post.create({
            data: {
                linkedinAccountId: linkedinAccount.id,
                imageUrl: body.imageUrl,
                imageDescription: body.imageDescription || null,
                aiCaption: '', // Will be filled by caption-generated webhook
                status: 'draft'
            }
        })
    }

    // Return data for Make.com to use in AI generation
    return {
        postId: post.id,
        imageUrl: body.imageUrl,
        imageDescription: body.imageDescription || null,
        contextPrompt: linkedinAccount.contextPrompt,
        accountName: linkedinAccount.name,
        accountType: linkedinAccount.type
    }
})
