"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import timeGridWeek from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Calendar } from "@/components/calendar"
import { EventDrawer } from "@/components/event-drawer"
import { ApprovalPanel } from "@/components/approval-panel"
import { SyllabusUpload } from "@/components/syllabus-upload"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="p-8">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Calendar Event Management</h1>
          <div className="flex gap-2">
            <SyllabusUpload />
            <Button
              variant="outline"
              onClick={() => setShowApprovalPanel(!showApprovalPanel)}
            >
              Review Proposals
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch("/api/gmail/sync", { method: "POST" })
                  if (res.ok) {
                    toast({
                      title: "Gmail sync started",
                      description: "Processing important emails...",
                    })
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to sync Gmail",
                    variant: "destructive",
                  })
                }
              }}
            >
              Sync Gmail
            </Button>
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <Calendar
            onEventClick={(eventId) => setSelectedEvent(eventId)}
            onDateClick={(date) => {
              // Could open create event dialog
              console.log("Date clicked:", date)
            }}
          />
        </div>

        {showApprovalPanel && (
          <div className="w-96 border-l overflow-y-auto">
            <ApprovalPanel onClose={() => setShowApprovalPanel(false)} />
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDrawer
          eventId={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
