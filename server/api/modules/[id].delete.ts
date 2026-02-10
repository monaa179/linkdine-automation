import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireAuth(event)

    const id = parseInt(event.context.params!.id)

    await prisma.module.delete({
        where: { id }
    })

    return { success: true }
})
