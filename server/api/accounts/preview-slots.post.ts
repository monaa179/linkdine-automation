import { calculateSlots, SchedulingSettings } from '../../utils/scheduler'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const settings: SchedulingSettings = {
        postingPeriod: body.postingPeriod,
        postingFrequency: body.postingFrequency,
        postingDay: body.postingDay,
        postingHour: body.postingHour
    }

    const count = body.count || 5
    const startAfter = body.startAfter ? new Date(body.startAfter) : new Date()

    const slots = calculateSlots(settings, count, startAfter)

    return {
        slots: slots.map(d => ({
            iso: d.toISOString(),
            formatted: d.toLocaleString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            })
        }))
    }
})
