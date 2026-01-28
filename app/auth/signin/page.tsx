"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/")
  }, [router])
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-muted-foreground">Redirecting to calendar...</div>
    </div>
  )
}
