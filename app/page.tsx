"use client"

import { useState, useCallback } from "react"
import { Calendar } from "@/components/calendar"
import { EventDrawer } from "@/components/event-drawer"
import { ApprovalPanel } from "@/components/approval-panel"
import { SyllabusUpload } from "@/components/syllabus-upload"
import { AIChatPanel } from "@/components/ai-chat-panel"
import { AddEventDialog } from "@/components/add-event-dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus } from "lucide-react"

export default function HomePage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)

  const refreshCalendar = useCallback(() => {
    setCalendarRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Calendar Event Management</h1>
          <div className="flex gap-2">
            <SyllabusUpload />
            <Button variant="outline" onClick={() => setShowAddEvent(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add event
            </Button>
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
            refreshKey={calendarRefreshKey}
          />
        </div>

        {showApprovalPanel && (
          <div className="w-96 border-l overflow-y-auto">
            <ApprovalPanel
              onClose={() => setShowApprovalPanel(false)}
              onProposalUpdated={refreshCalendar}
            />
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDrawer
          eventId={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      <AddEventDialog
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        onCreated={refreshCalendar}
      />

      <AIChatPanel
        open={showAIPanel}
        onClose={() => setShowAIPanel(false)}
        onEntriesCreated={refreshCalendar}
      />
    </div>
  )
}
