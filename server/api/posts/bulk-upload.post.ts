import { promises as fs } from 'fs'
import path from 'path'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)

    const formData = await readMultipartFormData(event)
    if (!formData) {
        throw createError({ statusCode: 400, statusMessage: 'No form data' })
    }

    const accountIdPart = formData.find(p => p.name === 'accountId')
    const imageParts = formData.filter(p => p.name === 'images')

    if (!accountIdPart || imageParts.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'AccountId and at least one image are required' })
    }

    const rawAccountId = accountIdPart.data.toString()
    const accountId = parseInt(rawAccountId)
    console.log('Bulk Upload - Raw AccountID:', rawAccountId, 'Parsed:', accountId)

    if (isNaN(accountId)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid Account ID: ${rawAccountId}` })
    }

    // Verify account ownership
    const account = await (prisma as any).account.findUnique({
        where: { id: accountId }
    })

    if (!account) {
        console.error('Account not found in DB for ID:', accountId)
        throw createError({ statusCode: 404, statusMessage: `Account with ID ${accountId} not found in database` })
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    await fs.mkdir(uploadDir, { recursive: true })

    const createdPosts = []

    for (const filePart of imageParts) {
        if (!filePart.data || !filePart.filename) continue

        // Sanitize filename: remove special chars, replace spaces with dashes
        const sanitizedOriginalName = filePart.filename
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9.-]/g, '')

        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizedOriginalName}`
        const filePath = path.join(uploadDir, fileName)
        await fs.writeFile(filePath, filePart.data)

        const imageUrl = `/uploads/${fileName}`

        // Create post
        const post = await (prisma as any).post.create({
            data: {
                accountId,
                imageUrl,
                status: 'draft',
                aiCaption: null
            }
        })

        createdPosts.push(post)

        // Trigger Make.com for AI generation
        const makeWebhookUrl = process.env.MAKE_GENERATE_CAPTION_WEBHOOK_URL
        if (makeWebhookUrl) {
            // We trigger it asynchronously and don't wait for the result
            $fetch(makeWebhookUrl, {
                method: 'POST',
                body: {
                    postId: post.id,
                    imageUrl: `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}${imageUrl}`,
                    contextPrompt: account.contextPrompt
                }
            }).catch(err => console.error(`Error triggering Make webhook for post ${post.id}:`, err))
        }
    }

    return createdPosts
})
