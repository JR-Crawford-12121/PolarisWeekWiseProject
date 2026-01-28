import { prisma } from "@/lib/prisma"
import {
  callLLMWithSchema,
  SyllabusExtractionSchema,
  type SyllabusExtraction,
} from "@/lib/llm"
import { checkEventDedupe, checkTaskDedupe, generateDedupeKey } from "@/lib/dedupe"
import { parseISOInTimezone } from "@/lib/timezone"
import { SourceType, EventStatus } from "@prisma/client"

/**
 * Run syllabus extraction and create proposed courses/events/tasks.
 * Use this when Inngest is not configured (e.g. no INNGEST_EVENT_KEY).
 */
export async function processSyllabusExtractionInline(
  userId: string,
  extractedText: string,
  sourceId: string,
  textS3Key?: string | null
): Promise<{ eventIds: string[]; taskIds: string[] }> {
  const prompt = `Extract course information, events, and tasks from this syllabus text:

${extractedText}

Return a JSON object with:
- courses: array of courses, each with name, code (optional), term (optional), events, and tasks (optional)
- events: array of recurring class sessions with title, description, startTime, endTime, location, and optional recurring pattern
- tasks: array of assignments/exams with title, description, and dueDate
- confidence: your confidence score (0-1)

All times should be in ISO 8601 format. Assume timezone is America/Chicago.`

  const extraction = await callLLMWithSchema<SyllabusExtraction>(
    prompt,
    SyllabusExtractionSchema
  )

  const eventIds: string[] = []
  const taskIds: string[] = []

  for (const courseData of extraction.data.courses) {
    const course = await prisma.course.upsert({
      where: {
        userId_name: {
          userId,
          name: courseData.name,
        },
      },
      update: {},
      create: {
        userId,
        name: courseData.name,
        code: courseData.code || null,
        term: courseData.term || null,
      },
    })

    for (const eventData of courseData.events) {
      const startTime = parseISOInTimezone(eventData.startTime)
      const endTime = parseISOInTimezone(eventData.endTime)

      const dedupeKey = generateDedupeKey(
        SourceType.syllabus,
        sourceId,
        eventData.title,
        startTime
      )

      const dedupeCheck = await checkEventDedupe(dedupeKey, startTime, userId)
      if (dedupeCheck.isDuplicate) continue

      const event = await prisma.event.create({
        data: {
          userId,
          courseId: course.id,
          title: eventData.title,
          description: eventData.description || null,
          startTime,
          endTime,
          location: eventData.location || null,
          source: SourceType.syllabus,
          sourceId,
          dedupeKey,
          confidence: extraction.confidence,
          status: EventStatus.proposed,
        },
      })

      eventIds.push(event.id)

      await prisma.sourceEvidence.create({
        data: {
          eventId: event.id,
          source: SourceType.syllabus,
          sourceId,
          content: extractedText.substring(0, 1000),
          s3Key: textS3Key ?? null,
          extractionJson: extraction.rawResponse as any,
        },
      })
    }

    if (courseData.tasks) {
      for (const taskData of courseData.tasks) {
        if (!taskData.dueDate) continue

        const dueDate = parseISOInTimezone(taskData.dueDate)
        const dedupeKey = generateDedupeKey(
          SourceType.syllabus,
          sourceId,
          taskData.title,
          dueDate
        )

        const dedupeCheck = await checkTaskDedupe(dedupeKey, dueDate, userId)
        if (dedupeCheck.isDuplicate) continue

        const task = await prisma.task.create({
          data: {
            userId,
            title: taskData.title,
            description: taskData.description || null,
            dueDate,
            source: SourceType.syllabus,
            sourceId,
            dedupeKey,
            confidence: extraction.confidence,
            status: EventStatus.proposed,
          },
        })

        taskIds.push(task.id)

        await prisma.sourceEvidence.create({
          data: {
            taskId: task.id,
            source: SourceType.syllabus,
            sourceId,
            content: extractedText.substring(0, 1000),
            s3Key: textS3Key ?? null,
            extractionJson: extraction.rawResponse as any,
          },
        })
      }
    }
  }

  return { eventIds, taskIds }
}
