import { NextRequest, NextResponse } from "next/server"
import { getOrCreateDemoUserId } from "@/lib/demo-user"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateDemoUserId()

    const events = await prisma.event.findMany({
      where: {
        userId,
        status: "proposed",
      },
      include: {
        course: true,
        sourceEvidence: true,
      },
      orderBy: {
        startTime: "asc",
      },
    })

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: "proposed",
      },
      include: {
        sourceEvidence: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    return NextResponse.json({
      events,
      tasks,
    })
  } catch (error) {
    console.error("Get proposals error:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    )
  }
}
