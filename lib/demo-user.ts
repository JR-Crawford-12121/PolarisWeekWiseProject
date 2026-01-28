import { prisma } from "./prisma"

const DEMO_EMAIL = "demo@local.dev"

/**
 * Get or create the demo user. Use this in API routes when auth is disabled.
 */
export async function getOrCreateDemoUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
    },
    update: {},
  })
  return user.id
}
