import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { processSyllabusExtraction, processEmailExtraction } from "@/inngest/functions"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processSyllabusExtraction, processEmailExtraction],
})
