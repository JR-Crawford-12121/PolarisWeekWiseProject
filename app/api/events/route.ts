import { NextRequest, NextResponse } from "next/server"
import { getOrCreateDemoUserId } from "@/lib/demo-user"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateDemoUserId()

    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end dates required" },
        { status: 400 }
      )
    }

    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(start),
          lte: new Date(end),
        },
        status: {
          in: ["confirmed", "proposed"],
        },
      },
      include: {
        course: true,
        sourceEvidence: true,
      },
      orderBy: {
        startTime: "asc",
      },
    })

    // Format for FullCalendar
    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startTime.toISOString(),
      end: event.endTime.toISOString(),
      extendedProps: {
        description: event.description,
        location: event.location,
        course: event.course,
        status: event.status,
        confidence: event.confidence,
        source: event.source,
      },
    }))

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getOrCreateDemoUserId()

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 }
      )
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}
