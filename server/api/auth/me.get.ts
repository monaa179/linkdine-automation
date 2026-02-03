import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler((event) => {
    const user = getUserFromEvent(event)
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }
    return user
})
