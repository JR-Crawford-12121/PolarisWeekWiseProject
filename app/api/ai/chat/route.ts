import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { z } from "zod"
import { getOrCreateDemoUserId } from "@/lib/demo-user"
import { prisma } from "@/lib/prisma"
import { AIChatResponseSchema, CALENDAR_FORMAT_INSTRUCTIONS } from "@/lib/ai-chat"
import { parseISOInTimezone } from "@/lib/timezone"
import { SourceType, EventStatus } from "@prisma/client"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateDemoUserId()

    const body = await request.json()
    const { messages } = body as { messages: Array<{ role: string; content: string }> }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: CALENDAR_FORMAT_INSTRUCTIONS },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: "No AI response" }, { status: 500 })
    }

    let parsed: z.infer<typeof AIChatResponseSchema>
    try {
      parsed = AIChatResponseSchema.parse(JSON.parse(content))
    } catch {
      return NextResponse.json({
        reply: content,
        createdEvents: [],
        createdTasks: [],
      })
    }

    const createdEventIds: string[] = []
    const createdTaskIds: string[] = []

    if (parsed.events?.length) {
      for (const e of parsed.events) {
        const startTime = parseISOInTimezone(e.startTime)
        const endTime = parseISOInTimezone(e.endTime)
        const event = await prisma.event.create({
          data: {
            userId,
            title: e.title,
            description: e.description ?? null,
            startTime,
            endTime,
            location: e.location ?? null,
            source: SourceType.manual,
            status: EventStatus.proposed,
          },
        })
        createdEventIds.push(event.id)
      }
    }

    if (parsed.tasks?.length) {
      for (const t of parsed.tasks) {
        const dueDate = parseISOInTimezone(t.dueDate)
        const task = await prisma.task.create({
          data: {
            userId,
            title: t.title,
            description: t.description ?? null,
            dueDate,
            source: SourceType.manual,
            status: EventStatus.proposed,
          },
        })
        createdTaskIds.push(task.id)
      }
    }

    return NextResponse.json({
      reply: parsed.reply,
      createdEvents: createdEventIds,
      createdTasks: createdTaskIds,
    })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI chat failed" },
      { status: 500 }
    )
  }
}
