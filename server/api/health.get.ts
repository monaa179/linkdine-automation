import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`

        return {
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        }
    } catch (error) {
        return {
            status: 'error',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }
    }
})
