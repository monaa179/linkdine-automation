import { promises as fs } from 'fs'
import path from 'path'
import { sendStream } from 'h3'
import { createReadStream } from 'fs'

export default defineEventHandler(async (event) => {
    const filename = getRouterParam(event, 'filename')
    if (!filename) {
        throw createError({ statusCode: 400, statusMessage: 'Filename is required' })
    }

    const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads')
    const filePath = path.join(uploadDir, filename)

    // Basic security check
    if (!filePath.startsWith(uploadDir)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    try {
        const stats = await fs.stat(filePath)
        if (!stats.isFile()) {
            throw createError({ statusCode: 404, statusMessage: 'File not found' })
        }

        // Set content type based on extension
        const ext = path.extname(filePath).toLowerCase()
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        }

        const contentType = mimeTypes[ext] || 'application/octet-stream'
        setHeader(event, 'Content-Type', contentType)
        setHeader(event, 'Content-Length', stats.size)
        setHeader(event, 'Cache-Control', 'public, max-age=604800') // 7 days

        return sendStream(event, createReadStream(filePath))
    } catch (e) {
        throw createError({ statusCode: 404, statusMessage: 'File not found' })
    }
})
