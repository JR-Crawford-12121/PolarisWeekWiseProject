"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Check that DATABASE_URL is set correctly and you have run: npx prisma generate && npx prisma db push",
  AccessDenied: "Access denied. You may not have permission to sign in.",
  Verification: "The sign-in link is invalid or has expired.",
  OAuthSignin: "Error starting the sign-in flow. Check that the redirect URI in Google Cloud Console is exactly: http://localhost:3000/api/auth/callback/google",
  OAuthCallback: "Error in the OAuth callback. Often caused by a wrong redirect URI or database connection.",
  OAuthCreateAccount: "Could not create user. Check your database connection.",
  Callback: "Error in the sign-in callback.",
  Default: "An error occurred during sign-in. Most often this is a database connection issue: set DATABASE_URL in .env to your real PostgreSQL connection string and run: npx prisma db push",
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "Default"

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign-in error</CardTitle>
          <CardDescription>
            {errorMessages[error] || errorMessages.Default}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Error code: <code className="bg-muted px-1 rounded">{error}</code>
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Try again</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
