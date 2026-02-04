import { prisma } from './prisma'

export interface SchedulingSettings {
    postingPeriod: string;
    postingFrequency: number;
    postingDay: string | null;
    postingHour: string;
}

export async function getNextAvailableSlots(accountId: number, count: number = 1, startAfter?: Date): Promise<Date[]> {
    const account = await (prisma as any).account.findUnique({
        where: { id: accountId }
    })

    if (!account) return []

    let baseDate: Date

    if (startAfter) {
        baseDate = new Date(startAfter)
    } else {
        // Find the last scheduled post to start after it
        const lastPost = await (prisma as any).post.findFirst({
            where: {
                accountId,
                status: 'scheduled'
            },
            orderBy: { scheduledAt: 'desc' }
        })
        baseDate = lastPost?.scheduledAt || new Date()
    }

    return calculateSlots(account, count, baseDate)
}

export function calculateSlots(settings: SchedulingSettings, count: number, startAfter: Date): Date[] {
    // If baseDate is in the past, reset to now
    const now = new Date()
    let baseDate = new Date(startAfter)
    if (baseDate < now) {
        baseDate = now
    }

    const slots: Date[] = []
    let currentRef = new Date(baseDate)

    const [hour, minute] = settings.postingHour.split(':').map(Number)

    for (let i = 0; i < count; i++) {
        let nextSlot: Date

        if (settings.postingPeriod === 'day') {
            const intervalHours = 24 / settings.postingFrequency
            nextSlot = new Date(currentRef.getTime() + intervalHours * 60 * 60 * 1000)

            if (settings.postingFrequency === 1) {
                nextSlot.setHours(hour, minute, 0, 0)
                if (nextSlot <= currentRef) {
                    nextSlot.setDate(nextSlot.getDate() + 1)
                }
            }
        } else if (settings.postingPeriod === 'week') {
            const days = settings.postingDay ? settings.postingDay.split(',') : ['monday']
            const dayMap: Record<string, number> = {
                sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
            }
            const targetDays = days.map(d => (dayMap as any)[d.trim().toLowerCase()]).filter(d => d !== undefined).sort((a: number, b: number) => a - b)

            if (targetDays.length === 0) targetDays.push(1) // Fallback to Monday

            nextSlot = findNextWeeklySlot(currentRef, targetDays, hour, minute)
        } else if (settings.postingPeriod === 'month') {
            const dayOfMonth = parseInt(settings.postingDay || '1')
            nextSlot = findNextMonthlySlot(currentRef, dayOfMonth, hour, minute)
        } else {
            // Default fallback: 1 day later
            nextSlot = new Date(currentRef.getTime() + 24 * 60 * 60 * 1000)
            nextSlot.setHours(hour, minute, 0, 0)
        }

        slots.push(nextSlot)
        currentRef = nextSlot
    }

    return slots
}

function findNextWeeklySlot(current: Date, targetDays: number[], hour: number, minute: number): Date {
    let candidate = new Date(current)
    candidate.setHours(hour, minute, 0, 0)

    // If candidate is already past or equal to current, we need to move forward at least 1 minute
    // to find the *next* possible slot.
    if (candidate <= current) {
        candidate.setDate(candidate.getDate() + 1)
    }

    // Loop until we find a target day
    let safety = 0
    while (!targetDays.includes(candidate.getDay()) && safety < 14) {
        candidate.setDate(candidate.getDate() + 1)
        safety++
    }

    return candidate
}

function findNextMonthlySlot(current: Date, dayOfMonth: number, hour: number, minute: number): Date {
    let candidate = new Date(current)
    candidate.setHours(hour, minute, 0, 0)

    // Try current month
    candidate.setDate(dayOfMonth)

    if (candidate <= current) {
        // Move to next month
        candidate.setMonth(candidate.getMonth() + 1)
        candidate.setDate(dayOfMonth)
    }

    return candidate
}
