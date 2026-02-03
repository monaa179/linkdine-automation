import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

async function resetPassword(email: string, newPassword: string) {
    console.log(`Resetting password for ${email}...`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.error(`User with email ${email} not found.`)
        process.exit(1)
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await prisma.user.update({
        where: { email },
        data: { passwordHash }
    })

    console.log(`Successfully updated password for ${email}.`)
}

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
    console.log('Usage: npx ts-node scripts/reset-password.ts <email> <newPassword>')
    process.exit(1)
}

resetPassword(email, password)
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
