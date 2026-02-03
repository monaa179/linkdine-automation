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
    const filePart = formData.find(p => p.name === 'image')

    if (!accountIdPart || !filePart || !filePart.data || !filePart.filename) {
        throw createError({ statusCode: 400, statusMessage: 'AccountId and image are required' })
    }

    const accountId = parseInt(accountIdPart.data.toString())
    console.log('Single Post Upload - AccountID:', accountId)

    // Verify account existence
    const account = await (prisma as any).account.findUnique({
        where: { id: accountId }
    })

    if (!account) {
        console.error('Account not found in DB for ID:', accountId)
        throw createError({ statusCode: 404, statusMessage: `Account with ID ${accountId} not found in database` })
    }

    // Save file
    const uploadDir = process.env.UPLOAD_DIR || './uploads'

    // Sanitize filename
    const sanitizedOriginalName = filePart.filename
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9.-]/g, '')

    const fileName = `${Date.now()}-${sanitizedOriginalName}`
    const filePath = path.join(uploadDir, fileName)

    await fs.mkdir(uploadDir, { recursive: true })
    await fs.writeFile(filePath, filePart.data)

    const imageUrl = `/uploads/${fileName}`

    // Create post
    const post = await (prisma as any).post.create({
        data: {
            accountId,
            imageUrl,
            status: 'draft'
        }
    })

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
        }).catch(err => console.error('Error triggering Make webhook:', err))
    }

    return post
})
