import { getNextAvailableSlots } from '../server/utils/scheduler'
import { prisma } from '../server/utils/prisma'

async function test() {
    console.log('--- Testing Scheduler ---')

    const account = await (prisma as any).account.findFirst()
    if (!account) {
        console.log('No account found for testing.')
        return
    }

    console.log(`Account: ${account.name} (Period: ${account.postingPeriod}, Freq: ${account.postingFrequency}, Day: ${account.postingDay}, Hour: ${account.postingHour})`)

    const slots = await getNextAvailableSlots(account.id, 5, new Date())
    console.log('Next 5 slots:')
    slots.forEach((slot, i) => {
        console.log(`${i + 1}: ${slot.toISOString()} (${slot.toLocaleString('fr-FR')})`)
    })

    process.exit(0)
}

test().catch(err => {
    console.error(err)
    process.exit(1)
})
