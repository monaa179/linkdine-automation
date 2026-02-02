import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const auth = requireAuth(event)
    const body = await readBody(event)

    // Validation
    if (!body.linkedinAccountId || !body.imageUrl || !body.aiCaption) {
        throw createError({
            statusCode: 400,
            statusMessage: 'linkedinAccountId, imageUrl, and aiCaption are required'
        })
    }

    const linkedinAccountId = parseInt(body.linkedinAccountId)
    if (isNaN(linkedinAccountId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid linkedinAccountId'
        })
    }

    // Verify account ownership
    const account = await prisma.linkedInAccount.findFirst({
        where: {
            id: linkedinAccountId,
            userId: auth.userId
        }
    })

    if (!account) {
        throw createError({
            statusCode: 404,
            statusMessage: 'LinkedIn account not found'
        })
    }

    // Validate status if provided
    const validStatuses = ['draft', 'scheduled', 'published']
    if (body.status && !validStatuses.includes(body.status)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid status'
        })
    }

    // Create post
    const post = await prisma.post.create({
        data: {
            linkedinAccountId,
            imageUrl: body.imageUrl,
            imageDescription: body.imageDescription || null,
            aiCaption: body.aiCaption,
            editedCaption: body.editedCaption || null,
            status: body.status || 'draft',
            scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null
        },
        include: {
            linkedinAccount: {
                select: {
                    id: true,
                    name: true,
                    type: true
                }
            }
        }
    })

    return { post }
})
