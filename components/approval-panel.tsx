"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { formatInAppTimezone } from "@/lib/timezone"
import { X } from "lucide-react"

interface ApprovalPanelProps {
  onClose: () => void
}

interface Proposal {
  events: Array<{
    id: string
    title: string
    description: string | null
    startTime: string
    endTime: string
    location: string | null
    confidence: number | null
    course: { name: string; code: string | null } | null
  }>
  tasks: Array<{
    id: string
    title: string
    description: string | null
    dueDate: string | null
    confidence: number | null
  }>
}

export function ApprovalPanel({ onClose }: ApprovalPanelProps) {
  const [proposals, setProposals] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/proposals")
      if (res.ok) {
        const data = await res.json()
        setProposals(data)
      }
    } catch (error) {
      console.error("Failed to fetch proposals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    type: "event" | "task",
    id: string,
    status: "confirmed" | "dismissed"
  ) => {
    try {
      const endpoint = type === "event" ? "/api/events" : `/api/tasks/${id}`
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "event" ? { id, status } : { status }
        ),
      })

      if (res.ok) {
        toast({
          title: "Updated",
          description: `${type} ${status}`,
        })
        fetchProposals()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div>Loading proposals...</div>
      </div>
    )
  }

  if (!proposals || (proposals.events.length === 0 && proposals.tasks.length === 0)) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Proposals</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">No pending proposals</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Review Proposals</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {proposals.events.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Events ({proposals.events.length})</h3>
          <div className="space-y-2">
            {proposals.events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{event.title}</CardTitle>
                  <CardDescription>
                    {formatInAppTimezone(event.startTime, "PPpp")}
                    {event.course && ` • ${event.course.name}`}
                    {event.confidence && ` • ${Math.round(event.confidence * 100)}% confidence`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange("event", event.id, "confirmed")}
                      className="flex-1"
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange("event", event.id, "dismissed")}
                      className="flex-1"
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {proposals.tasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tasks ({proposals.tasks.length})</h3>
          <div className="space-y-2">
            {proposals.tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{task.title}</CardTitle>
                  <CardDescription>
                    {task.dueDate
                      ? formatInAppTimezone(task.dueDate, "PPpp")
                      : "No due date"}
                    {task.confidence && ` • ${Math.round(task.confidence * 100)}% confidence`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange("task", task.id, "confirmed")}
                      className="flex-1"
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange("task", task.id, "dismissed")}
                      className="flex-1"
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
