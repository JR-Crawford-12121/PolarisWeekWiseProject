"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checklist } from "@/components/checklist"
import { useToast } from "@/components/ui/use-toast"
import { formatInAppTimezone } from "@/lib/timezone"

interface EventDrawerProps {
  eventId: string
  onClose: () => void
}

interface EventData {
  event: {
    id: string
    title: string
    description: string | null
    startTime: string
    endTime: string
    location: string | null
    status: string
    confidence: number | null
    source: string
    course: {
      name: string
      code: string | null
    } | null
    sourceEvidence: Array<{
      source: string
      content: string
    }>
    tasks: Array<{
      id: string
      title: string
      description: string | null
      completed: boolean
    }>
  }
  formatting?: {
    formattedTitle: string
    formattedDescription: string | null
    suggestedTasks: Array<{
      title: string
      description: string | null
    }> | null
  } | null
}

export function EventDrawer({ eventId, onClose }: EventDrawerProps) {
  const [data, setData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [useFormatting, setUseFormatting] = useState(false)
  const { toast } = useToast()

  const fetchEvent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}?format=${useFormatting}`)
      if (res.ok) {
        const eventData = await res.json()
        setData(eventData)
      }
    } catch (error) {
      console.error("Failed to fetch event:", error)
      toast({
        title: "Error",
        description: "Failed to load event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [eventId, useFormatting, toast])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const handleStatusChange = async (status: "confirmed" | "dismissed") => {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, status }),
      })

      if (res.ok) {
        toast({
          title: "Event updated",
          description: `Event ${status}`,
        })
        fetchEvent()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      })
    }
  }

  if (loading || !data) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div>Loading...</div>
        </DialogContent>
      </Dialog>
    )
  }

  const { event, formatting } = data
  const displayTitle = formatting?.formattedTitle || event.title
  const displayDescription = formatting?.formattedDescription || event.description

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{displayTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <p className="text-sm">
                {formatInAppTimezone(event.startTime, "PPpp")}
              </p>
            </div>
            <div>
              <Label>End Time</Label>
              <p className="text-sm">
                {formatInAppTimezone(event.endTime, "PPpp")}
              </p>
            </div>
          </div>

          {event.location && (
            <div>
              <Label>Location</Label>
              <p className="text-sm">{event.location}</p>
            </div>
          )}

          {event.course && (
            <div>
              <Label>Course</Label>
              <p className="text-sm">
                {event.course.code && `${event.course.code} - `}
                {event.course.name}
              </p>
            </div>
          )}

          {displayDescription && (
            <div>
              <Label>Description</Label>
              <p className="text-sm whitespace-pre-wrap">{displayDescription}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label>Status:</Label>
            <span
              className={`px-2 py-1 rounded text-xs ${
                event.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : event.status === "proposed"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {event.status}
            </span>
            {event.confidence && (
              <>
                <Label>Confidence:</Label>
                <span className="text-sm">{Math.round(event.confidence * 100)}%</span>
              </>
            )}
          </div>

          {event.status === "proposed" && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusChange("confirmed")}
                className="flex-1"
              >
                Confirm
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("dismissed")}
                className="flex-1"
              >
                Dismiss
              </Button>
            </div>
          )}

          {event.sourceEvidence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Source Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.sourceEvidence.map((evidence, idx) => (
                    <div key={idx} className="text-sm">
                      <Label>Source: {evidence.source}</Label>
                      <p className="text-muted-foreground mt-1">
                        {evidence.content.substring(0, 200)}...
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseFormatting(!useFormatting)}
            >
              {useFormatting ? "Disable" : "Enable"} LLM Formatting
            </Button>
          </div>

          {event.tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <Checklist
                  tasks={event.tasks}
                  onTaskUpdate={async (taskId, completed) => {
                    try {
                      await fetch(`/api/tasks/${taskId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ completed }),
                      })
                      fetchEvent()
                    } catch (error) {
                      console.error("Failed to update task:", error)
                    }
                  }}
                />
              </CardContent>
            </Card>
          )}

          {formatting?.suggestedTasks && formatting.suggestedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Tasks</CardTitle>
                <CardDescription>
                  AI-suggested checklist items for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {formatting.suggestedTasks.map((task, idx) => (
                    <li key={idx} className="text-sm">
                      {task.title}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
