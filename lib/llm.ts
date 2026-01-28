import OpenAI from "openai"
import { z } from "zod"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const DEFAULT_MODEL = "gpt-4o-mini"
const ESCALATION_MODEL = "gpt-4o"
const CONFIDENCE_THRESHOLD = 0.65

export interface LLMResponse<T> {
  data: T
  confidence: number
  model: string
  rawResponse?: any
}

export async function callLLMWithSchema<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options?: {
    temperature?: number
    forceEscalation?: boolean
  }
): Promise<LLMResponse<T>> {
  const systemPrompt = `You are a helpful assistant that extracts structured information from text. 
Always respond with valid JSON that matches the provided schema exactly.
Be precise and accurate. Include a confidence score (0-1) in your response.`

  // Try default model first (unless forced escalation)
  if (!options?.forceEscalation) {
    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: options?.temperature ?? 0.3,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("No content in response")
      }

      const parsed = JSON.parse(content)
      
      // Validate with zod
      const validated = schema.parse(parsed)
      
      // Check confidence
      const confidence = parsed.confidence ?? 0.5
      
      if (confidence >= CONFIDENCE_THRESHOLD) {
        return {
          data: validated,
          confidence,
          model: DEFAULT_MODEL,
          rawResponse: response,
        }
      } else {
        // Confidence too low, escalate
        console.log(`Low confidence (${confidence}), escalating to ${ESCALATION_MODEL}`)
      }
    } catch (error) {
      // Schema validation failed or other error, escalate
      console.log(`Validation failed or error, escalating to ${ESCALATION_MODEL}:`, error)
    }
  }

  // Use escalation model
  const response = await openai.chat.completions.create({
    model: ESCALATION_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: options?.temperature ?? 0.2,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("No content in response")
  }

  const parsed = JSON.parse(content)
  const validated = schema.parse(parsed)
  const confidence = parsed.confidence ?? 0.7

  return {
    data: validated,
    confidence,
    model: ESCALATION_MODEL,
    rawResponse: response,
  }
}

// Schema for syllabus extraction
export const SyllabusExtractionSchema = z.object({
  courses: z.array(
    z.object({
      name: z.string(),
      code: z.string().optional(),
      term: z.string().optional(),
      events: z.array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          startTime: z.string(), // ISO 8601
          endTime: z.string(), // ISO 8601
          location: z.string().optional(),
          recurring: z
            .object({
              frequency: z.enum(["weekly", "daily"]),
              until: z.string().optional(),
            })
            .optional(),
        })
      ),
      tasks: z.array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          dueDate: z.string(), // ISO 8601
        })
      ).optional(),
    })
  ),
  confidence: z.number().min(0).max(1),
})

export type SyllabusExtraction = z.infer<typeof SyllabusExtractionSchema>

// Schema for email extraction
export const EmailExtractionSchema = z.object({
  events: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      startTime: z.string().optional(), // ISO 8601
      endTime: z.string().optional(), // ISO 8601
      location: z.string().optional(),
    })
  ).optional(),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.string().optional(), // ISO 8601
    })
  ).optional(),
  confidence: z.number().min(0).max(1),
})

export type EmailExtraction = z.infer<typeof EmailExtractionSchema>

// Schema for event formatting
export const EventFormattingSchema = z.object({
  formattedTitle: z.string(),
  formattedDescription: z.string().optional(),
  suggestedTasks: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
    })
  ).optional(),
  confidence: z.number().min(0).max(1),
})

export type EventFormatting = z.infer<typeof EventFormattingSchema>
