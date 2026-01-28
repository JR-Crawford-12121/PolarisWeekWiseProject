import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id,
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
        userId: session.user.id,
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
