import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const id = parseInt(event.context.params?.id || '')

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
    }

    // Ensure account belongs to user
    const existingAccount = await prisma.account.findFirst({
        where: { id }
    })

    if (!existingAccount) {
        throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }

    await prisma.account.delete({
        where: { id }
    })

    return { message: 'Account deleted' }
})
