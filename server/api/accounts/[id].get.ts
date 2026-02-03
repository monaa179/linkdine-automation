import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)

    const id = parseInt(event.context.params?.id || '')
    if (isNaN(id)) {
        throw createError({ statusCode: 400, message: 'Invalid ID' })
    }

    const account = await prisma.account.findFirst({
        where: {
            id
        }
    })

    if (!account) {
        throw createError({ statusCode: 404, message: 'Account not found' })
    }

    return account
})
