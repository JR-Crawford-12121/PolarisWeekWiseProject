import { NextRequest, NextResponse } from "next/server"
import { getOrCreateDemoUserId } from "@/lib/demo-user"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getOrCreateDemoUserId()

    const body = await request.json()
    const { completed, status } = body

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(status && { status }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    )
  }
}
