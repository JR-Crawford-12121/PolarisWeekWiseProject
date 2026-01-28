"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // If already signed in, redirect to home (fixes "stuck on login" after OAuth callback)
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in with Google to access your calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full"
          >
            Sign in with Google
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            If the button does nothing, add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL, and NEXTAUTH_SECRET to a <code className="bg-muted px-1 rounded">.env</code> file in the project root (copy from <code className="bg-muted px-1 rounded">.env.example</code>).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
