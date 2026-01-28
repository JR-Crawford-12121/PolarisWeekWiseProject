import { prisma } from "./prisma"
import { EventStatus, SourceType } from "@prisma/client"

const TIME_TOLERANCE_MS = 15 * 60 * 1000 // 15 minutes

export interface DedupeResult {
  isDuplicate: boolean
  existingId?: string
}

export async function checkEventDedupe(
  dedupeKey: string | null,
  startTime: Date,
  userId: string
): Promise<DedupeResult> {
  if (!dedupeKey) {
    return { isDuplicate: false }
  }

  // Find events with same dedupeKey
  const existingEvents = await prisma.event.findMany({
    where: {
      userId,
      dedupeKey,
      status: {
        in: [EventStatus.proposed, EventStatus.confirmed],
      },
    },
  })

  if (existingEvents.length === 0) {
    return { isDuplicate: false }
  }

  // Check time tolerance
  for (const event of existingEvents) {
    const timeDiff = Math.abs(event.startTime.getTime() - startTime.getTime())
    if (timeDiff <= TIME_TOLERANCE_MS) {
      return {
        isDuplicate: true,
        existingId: event.id,
      }
    }
  }

  return { isDuplicate: false }
}

export async function checkTaskDedupe(
  dedupeKey: string | null,
  dueDate: Date | null,
  userId: string
): Promise<DedupeResult> {
  if (!dedupeKey || !dueDate) {
    return { isDuplicate: false }
  }

  const existingTasks = await prisma.task.findMany({
    where: {
      userId,
      dedupeKey,
      status: {
        in: [EventStatus.proposed, EventStatus.confirmed],
      },
    },
  })

  if (existingTasks.length === 0) {
    return { isDuplicate: false }
  }

  for (const task of existingTasks) {
    if (!task.dueDate) continue
    const timeDiff = Math.abs(task.dueDate.getTime() - dueDate.getTime())
    if (timeDiff <= TIME_TOLERANCE_MS) {
      return {
        isDuplicate: true,
        existingId: task.id,
      }
    }
  }

  return { isDuplicate: false }
}

export function generateDedupeKey(
  source: SourceType,
  sourceId: string,
  title: string,
  time: Date
): string {
  // Create a deterministic key based on source, title, and time (rounded to nearest hour)
  const timeRounded = new Date(time)
  timeRounded.setMinutes(0, 0, 0)
  
  const key = `${source}:${sourceId}:${title.toLowerCase().trim()}:${timeRounded.toISOString()}`
  return Buffer.from(key).toString("base64")
}
