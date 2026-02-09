import { requireAdmin } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireAdmin(event)

    const id = parseInt(event.context.params?.id as string)
    const admin = requireAdmin(event)

    // Prevent deleting self
    if (id === admin.userId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'You cannot delete yourself'
        })
    }

    await prisma.user.delete({
        where: { id }
    })

    return { success: true }
})
