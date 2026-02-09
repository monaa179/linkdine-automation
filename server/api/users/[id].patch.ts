import { requireAdmin, hashPassword } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    requireAdmin(event)

    const id = parseInt(event.context.params?.id as string)
    const body = await readBody(event)
    const { email, password, role } = body

    const updateData: any = {}
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (password) {
        updateData.passwordHash = await hashPassword(password)
    }

    const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true
        }
    })

    return user
})
