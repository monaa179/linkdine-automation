import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const id = parseInt(event.context.params?.id || '')
    const query = getQuery(event)
    const secret = query.secret

    const config = useRuntimeConfig()

    // Simple secret check to protect the endpoint
    if (!secret || secret !== config.makeWebhookSecret) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Invalid secret' })
    }

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid account ID' })
    }

    const posts = await (prisma as any).post.findMany({
        where: {
            accountId: id,
            aiCaption: null
        },
        select: {
            id: true,
            imageUrl: true
        }
    })

    const baseUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    console.log(`[Gallery-to-Caption] Found ${posts.length} posts for account ${id}`)
    if (posts.length > 0) {
        console.log(`[Gallery-to-Caption] Sample image URL: ${baseUrl}${posts[0].imageUrl}`)
    }

    return posts.map((post: any) => ({
        postId: post.id,
        accountId: id,
        imageUrl: `${baseUrl}${post.imageUrl}`
    }))
})
