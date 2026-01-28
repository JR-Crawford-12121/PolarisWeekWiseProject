import { z } from "zod"

/**
 * Format the AI must use when creating calendar entries.
 * All times in ISO 8601; assume America/Chicago when user says "Tuesday 3pm" etc.
 */
export const AIChatResponseSchema = z.object({
  reply: z.string().describe("Your message to the user"),
  events: z
    .array(
      z.object({
        title: z.string(),
        startTime: z.string().describe("ISO 8601 datetime"),
        endTime: z.string().describe("ISO 8601 datetime"),
        description: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  tasks: z
    .array(
      z.object({
        title: z.string(),
        dueDate: z.string().describe("ISO 8601 datetime"),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
})

export type AIChatResponse = z.infer<typeof AIChatResponseSchema>

export const CALENDAR_FORMAT_INSTRUCTIONS = `
You are a calendar assistant. The user chats with you. When they ask to add events or tasks, you MUST include them in your JSON response.

Response format (always valid JSON):
{
  "reply": "Your message to the user (e.g. 'Added the meeting to your calendar.')",
  "events": [
    { "title": "...", "startTime": "ISO 8601", "endTime": "ISO 8601", "description": "optional", "location": "optional" }
  ],
  "tasks": [
    { "title": "...", "dueDate": "ISO 8601", "description": "optional" }
  ]
}

Rules:
- Timezone is America/Chicago. When the user says "Tuesday 3pm" or "next week", use that timezone.
- If the user is NOT asking to add/change calendar items, set "events" and "tasks" to [].
- Always return exactly this JSON shape. "reply" is required; "events" and "tasks" are arrays (empty if none to add).
- Use ISO 8601 for all dates/times (e.g. 2025-01-28T15:00:00.000-06:00 for 3pm Chicago).
`
