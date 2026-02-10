import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const postId = parseInt(event.context.params!.id)
    const body = await readBody(event)

    try {
        // Create history entry
        const history = await prisma.captionHistory.create({
            data: {
                postId,
                previousCaption: body.previousCaption || null,
                newCaption: body.newCaption
            }
        })

        return history
    } catch (error) {
        console.error('Error saving caption history:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to save caption history'
        })
    }
})
