import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = requireAuth(event)

    const accounts = await prisma.account.findMany({
        orderBy: { createdAt: 'desc' }
    })

    return accounts
})
