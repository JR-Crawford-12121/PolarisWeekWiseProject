"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridWeek from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

interface CalendarProps {
  onEventClick: (eventId: string) => void
  onDateClick: (date: Date) => void
  refreshKey?: number
}

export function Calendar({ onEventClick, onDateClick, refreshKey = 0 }: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<any[]>([])
  const [currentRange, setCurrentRange] = useState<{ start: string; end: string } | null>(null)

  const fetchEvents = useCallback(async (startStr: string, endStr: string) => {
    try {
      const res = await fetch(
        `/api/events?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`
      )
      if (res.ok) {
        const data = await res.json()
        console.log("Fetched events:", data.length, "events for range", startStr, "to", endStr)
        return data
      } else {
        const error = await res.json()
        console.error("Failed to fetch events:", error)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
    return []
  }, [])

  // Fetch events when refreshKey changes
  useEffect(() => {
    if (currentRange) {
      console.log("Refreshing calendar, refreshKey:", refreshKey)
      fetchEvents(currentRange.start, currentRange.end).then((data) => {
        setEvents(data)
      })
    }
  }, [refreshKey, currentRange, fetchEvents])

  return (
    <div className="h-full p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridWeek, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek",
        }}
        events={events}
        datesSet={(arg) => {
          // Update range when calendar view changes
          const newRange = { start: arg.startStr, end: arg.endStr }
          if (currentRange?.start !== newRange.start || currentRange?.end !== newRange.end) {
            setCurrentRange(newRange)
            fetchEvents(newRange.start, newRange.end).then((data) => {
              setEvents(data)
            })
          }
        }}
        eventClick={(info) => {
          onEventClick(info.event.id)
        }}
        dateClick={(info) => {
          onDateClick(info.date)
        }}
        eventContent={(eventInfo) => {
          const status = eventInfo.event.extendedProps?.status
          const isProposed = status === "proposed"
          return (
            <div
              className={`p-1 rounded text-xs ${
                isProposed
                  ? "bg-yellow-100 border border-yellow-300"
                  : "bg-blue-100 border border-blue-300"
              }`}
            >
              <div className="font-semibold truncate">
                {eventInfo.event.title}
              </div>
              {isProposed && (
                <div className="text-yellow-700 text-[10px]">Proposed</div>
              )}
            </div>
          )
        }}
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        timeZone="America/Chicago"
        locale="en"
        firstDay={0} // Sunday
        weekends={true}
        editable={false}
        selectable={true}
        eventResizableFromStart={false}
        eventStartEditable={false}
        eventDurationEditable={false}
      />
    </div>
  )
}
