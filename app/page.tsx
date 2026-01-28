"use client"

import { useState } from "react"
import { Calendar } from "@/components/calendar"
import { EventDrawer } from "@/components/event-drawer"
import { ApprovalPanel } from "@/components/approval-panel"
import { SyllabusUpload } from "@/components/syllabus-upload"
import { AIChatPanel } from "@/components/ai-chat-panel"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export default function HomePage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)

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
              onClick={() => setShowAIPanel(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              AI
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <Calendar
            onEventClick={(eventId) => setSelectedEvent(eventId)}
            onDateClick={(date) => {
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

      <AIChatPanel
        open={showAIPanel}
        onClose={() => setShowAIPanel(false)}
        onEntriesCreated={() => {
          // Optionally refresh calendar or proposals
        }}
      />
    </div>
  )
}
