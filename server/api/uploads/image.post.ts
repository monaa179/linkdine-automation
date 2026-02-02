import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    requireAuth(event)

    const uploadDir = process.env.UPLOAD_DIR || './uploads'

    // Ensure upload directory exists
    try {
        await mkdir(uploadDir, { recursive: true })
    } catch (error) {
        // Directory might already exist
    }

    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No file uploaded'
        })
    }

    const file = formData.find(f => f.name === 'image')

    if (!file || !file.data) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Image file is required'
        })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!file.type || !allowedTypes.includes(file.type)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP'
        })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.data.length > maxSize) {
        throw createError({
            statusCode: 400,
            statusMessage: 'File too large. Maximum size: 10MB'
        })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = file.type?.split('/')[1] || 'jpg'
    const filename = `${timestamp}-${random}.${extension}`
    const filepath = join(uploadDir, filename)

    // Write file
    await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(filepath)
        writeStream.write(file.data)
        writeStream.end()
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
    })

    // Return the URL (adjust based on your deployment)
    const baseUrl = process.env.NODE_ENV === 'production'
        ? process.env.BASE_URL || ''
        : 'http://localhost:3000'

    return {
        success: true,
        filename,
        url: `${baseUrl}/uploads/${filename}`,
        size: file.data.length,
        type: file.type
    }
})
