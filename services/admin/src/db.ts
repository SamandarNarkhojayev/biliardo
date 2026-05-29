import { PrismaClient } from './_prisma/index.js'

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect()
}
