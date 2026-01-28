"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface AddEventDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddEventDialog({
  open,
  onClose,
  onCreated,
}: AddEventDialogProps) {
  const [title, setTitle] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const reset = () => {
    setTitle("")
    setStart("")
    setEnd("")
    setDescription("")
    setLocation("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !start || !end) {
      toast({
        title: "Error",
        description: "Title, start, and end are required",
        variant: "destructive",
      })
      return
    }
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast({
        title: "Error",
        description: "Invalid date or time",
        variant: "destructive",
      })
      return
    }
    if (endDate <= startDate) {
      toast({
        title: "Error",
        description: "End must be after start",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create event")
      }
      toast({
        title: "Event created",
        description: "The event was added to your calendar",
      })
      reset()
      onCreated()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
          <DialogDescription>
            Create a new event. Times are in your local timezone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="add-event-title">Title</Label>
            <Input
              id="add-event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="add-event-start">Start</Label>
            <Input
              id="add-event-start"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="add-event-end">End</Label>
            <Input
              id="add-event-end"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="add-event-description">Description (optional)</Label>
            <Input
              id="add-event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="add-event-location">Location (optional)</Label>
            <Input
              id="add-event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              disabled={submitting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
