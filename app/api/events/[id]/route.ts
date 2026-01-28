import { NextRequest, NextResponse } from "next/server"
import { getOrCreateDemoUserId } from "@/lib/demo-user"
import { prisma } from "@/lib/prisma"
import {
  callLLMWithSchema,
  EventFormattingSchema,
  type EventFormatting,
} from "@/lib/llm"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getOrCreateDemoUserId()

    const event = await prisma.event.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        course: true,
        sourceEvidence: true,
        tasks: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Optional LLM formatting
    const useLLM = request.nextUrl.searchParams.get("format") === "true"
    let formatting: EventFormatting | null = null

    if (useLLM) {
      try {
        const prompt = `Format this calendar event for better presentation:

Title: ${event.title}
Description: ${event.description || "None"}
Course: ${event.course?.name || "None"}
Location: ${event.location || "None"}
Time: ${event.startTime.toISOString()} to ${event.endTime.toISOString()}

Return a JSON object with:
- formattedTitle: improved title
- formattedDescription: improved description
- suggestedTasks: array of suggested tasks/checklist items
- confidence: your confidence score (0-1)`

        const result = await callLLMWithSchema<EventFormatting>(
          prompt,
          EventFormattingSchema
        )
        formatting = result.data
      } catch (error) {
        console.error("LLM formatting error:", error)
        // Continue without formatting
      }
    }

    return NextResponse.json({
      event,
      formatting,
    })
  } catch (error) {
    console.error("Get event error:", error)
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    )
  }
}
