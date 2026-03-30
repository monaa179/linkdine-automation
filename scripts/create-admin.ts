import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

async function createAdmin(email: string, password: string) {
    console.log(`Creating admin user ${email}...`)

    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        console.error(`User with email ${email} already exists.`)
        process.exit(1)
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: 'admin'
        }
    })

    console.log(`Successfully created admin user: ${user.email} (ID: ${user.id})`)
}

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
    console.log('Usage: npx ts-node scripts/create-admin.ts <email> <password>')
    process.exit(1)
}

createAdmin(email, password)
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
