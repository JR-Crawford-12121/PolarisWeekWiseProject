"use client"

import { useRef, useEffect, useCallback } from "react"
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

  const fetchEvents = useCallback(async (fetchInfo: { startStr: string; endStr: string }) => {
    try {
      const res = await fetch(
        `/api/events?start=${encodeURIComponent(fetchInfo.startStr)}&end=${encodeURIComponent(fetchInfo.endStr)}`
      )
      if (res.ok) {
        const data = await res.json()
        return data
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
    return []
  }, [])

  useEffect(() => {
    if (refreshKey > 0 && calendarRef.current) {
      const api = (calendarRef.current as any).getApi?.()
      if (api?.refetchEvents) {
        api.refetchEvents()
      }
    }
  }, [refreshKey])

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
        eventSources={[
          {
            id: "api",
            events: (info) => fetchEvents({ startStr: info.startStr, endStr: info.endStr }),
          },
        ]}
        eventClick={(info) => {
          onEventClick(info.event.id)
        }}
        dateClick={(info) => {
          onDateClick(info.date)
        }}
        eventContent={(eventInfo) => {
          const status = eventInfo.event.extendedProps.status
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
