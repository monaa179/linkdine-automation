import { prisma } from '../../../utils/prisma'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const auth = requireAuth(event)
    const id = parseInt(getRouterParam(event, 'id') || '')

    if (isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid account ID'
        })
    }

    // Verify ownership
    const account = await prisma.linkedInAccount.findFirst({
        where: {
            id,
            userId: auth.userId
        }
    })

    if (!account) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Account not found'
        })
    }

    // Delete account (cascades to posts)
    await prisma.linkedInAccount.delete({
        where: { id }
    })

    return {
        success: true,
        message: 'Account deleted successfully'
    }
})
