import { inngest } from "./client"
import { prisma } from "@/lib/prisma"
import {
  callLLMWithSchema,
  SyllabusExtractionSchema,
  EmailExtractionSchema,
  type SyllabusExtraction,
  type EmailExtraction,
} from "@/lib/llm"
import { checkEventDedupe, checkTaskDedupe, generateDedupeKey } from "@/lib/dedupe"
import { parseISOInTimezone } from "@/lib/timezone"
import { SourceType, EventStatus } from "@prisma/client"

// Process syllabus extraction
export const processSyllabusExtraction = inngest.createFunction(
  { id: "process-syllabus-extraction" },
  { event: "syllabus/extract" },
  async ({ event, step }) => {
    const { userId, s3Key, textS3Key, extractedText, sourceId } = event.data

    const extraction = await step.run("extract-with-llm", async () => {
      const prompt = `Extract course information, events, and tasks from this syllabus text:

${extractedText}

Return a JSON object with:
- courses: array of courses, each with name, code (optional), term (optional), events, and tasks (optional)
- events: array of recurring class sessions with title, description, startTime, endTime, location, and optional recurring pattern
- tasks: array of assignments/exams with title, description, and dueDate
- confidence: your confidence score (0-1)

All times should be in ISO 8601 format. Assume timezone is America/Chicago.`

      const result = await callLLMWithSchema<SyllabusExtraction>(
        prompt,
        SyllabusExtractionSchema
      )

      return result
    })

    // Create courses and events/tasks
    const created = await step.run("create-proposed-items", async () => {
      const items: {
        courseId?: string
        eventIds: string[]
        taskIds: string[]
      } = {
        eventIds: [],
        taskIds: [],
      }

      for (const courseData of extraction.data.courses) {
        // Create or find course
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

        items.courseId = course.id

        // Create events
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
          if (dedupeCheck.isDuplicate) {
            continue // Skip duplicate
          }

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

          items.eventIds.push(event.id)

          // Create source evidence
          await prisma.sourceEvidence.create({
            data: {
              eventId: event.id,
              source: SourceType.syllabus,
              sourceId,
              content: extractedText.substring(0, 1000), // First 1000 chars
              s3Key: textS3Key,
              extractionJson: extraction.rawResponse as any,
            },
          })
        }

        // Create tasks
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
            if (dedupeCheck.isDuplicate) {
              continue
            }

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

            items.taskIds.push(task.id)

            await prisma.sourceEvidence.create({
              data: {
                taskId: task.id,
                source: SourceType.syllabus,
                sourceId,
                content: extractedText.substring(0, 1000),
                s3Key: textS3Key,
                extractionJson: extraction.rawResponse as any,
              },
            })
          }
        }
      }

      return items
    })

    return {
      success: true,
      extraction,
      created,
    }
  }
)

// Process email extraction
export const processEmailExtraction = inngest.createFunction(
  { id: "process-email-extraction" },
  { event: "email/extract" },
  async ({ event, step }) => {
    const { userId, emailId, subject, bodyText, bodyHtml } = event.data

    // Extract text outside of step for use in both steps
    const text = bodyText || (bodyHtml ? stripHtml(bodyHtml) : "")

    const extraction = await step.run("extract-with-llm", async () => {
      const prompt = `Extract calendar events and tasks from this email:

Subject: ${subject}
Body: ${text}

Return a JSON object with:
- events: array of events with title, description, startTime, endTime, location
- tasks: array of tasks with title, description, dueDate
- confidence: your confidence score (0-1)

All times should be in ISO 8601 format. Assume timezone is America/Chicago.`

      const result = await callLLMWithSchema<EmailExtraction>(
        prompt,
        EmailExtractionSchema
      )

      return result
    })

    const created = await step.run("create-proposed-items", async () => {
      const items: {
        eventIds: string[]
        taskIds: string[]
      } = {
        eventIds: [],
        taskIds: [],
      }

      if (extraction.data.events) {
        for (const eventData of extraction.data.events) {
          if (!eventData.startTime || !eventData.endTime) continue

          const startTime = parseISOInTimezone(eventData.startTime)
          const endTime = parseISOInTimezone(eventData.endTime)

          const dedupeKey = generateDedupeKey(
            SourceType.email,
            emailId,
            eventData.title,
            startTime
          )

          const dedupeCheck = await checkEventDedupe(dedupeKey, startTime, userId)
          if (dedupeCheck.isDuplicate) {
            continue
          }

          const event = await prisma.event.create({
            data: {
              userId,
              title: eventData.title,
              description: eventData.description || null,
              startTime,
              endTime,
              location: eventData.location || null,
              source: SourceType.email,
              sourceId: emailId,
              dedupeKey,
              confidence: extraction.confidence,
              status: EventStatus.proposed,
            },
          })

          items.eventIds.push(event.id)

          await prisma.sourceEvidence.create({
            data: {
              eventId: event.id,
              source: SourceType.email,
              sourceId: emailId,
              content: text.substring(0, 1000),
              extractionJson: extraction.rawResponse as any,
            },
          })
        }
      }

      if (extraction.data.tasks) {
        for (const taskData of extraction.data.tasks) {
          if (!taskData.dueDate) continue

          const dueDate = parseISOInTimezone(taskData.dueDate)
          const dedupeKey = generateDedupeKey(
            SourceType.email,
            emailId,
            taskData.title,
            dueDate
          )

          const dedupeCheck = await checkTaskDedupe(dedupeKey, dueDate, userId)
          if (dedupeCheck.isDuplicate) {
            continue
          }

          const task = await prisma.task.create({
            data: {
              userId,
              title: taskData.title,
              description: taskData.description || null,
              dueDate,
              source: SourceType.email,
              sourceId: emailId,
              dedupeKey,
              confidence: extraction.confidence,
              status: EventStatus.proposed,
            },
          })

          items.taskIds.push(task.id)

          await prisma.sourceEvidence.create({
            data: {
              taskId: task.id,
              source: SourceType.email,
              sourceId: emailId,
              content: text.substring(0, 1000),
              extractionJson: extraction.rawResponse as any,
            },
          })
        }
      }

      // Mark email as processed
      await prisma.emailMessage.update({
        where: { id: emailId },
        data: { processed: true, processedAt: new Date() },
      })

      return items
    })

    return {
      success: true,
      extraction,
      created,
    }
  }
)

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ")
}
