import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "calendar-event-management",
  eventKey: process.env.INNGEST_EVENT_KEY,
})
