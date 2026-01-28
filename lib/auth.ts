import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn({ account, user }) {
      if (account?.provider === "google" && account.access_token && user?.id) {
        // Store OAuth tokens for Gmail integration
        await prisma.userIntegration.upsert({
          where: {
            userId_provider: {
              userId: user.id,
              provider: "gmail",
            },
          },
          update: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token || null,
            tokenExpiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
            scope: account.scope || null,
          },
          create: {
            userId: user.id,
            provider: "gmail",
            accessToken: account.access_token,
            refreshToken: account.refresh_token || null,
            tokenExpiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
            scope: account.scope || null,
          },
        })
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
