import { NextRequest, NextResponse } from "next/server"
import { getOrCreateDemoUserId } from "@/lib/demo-user"
import { processPDFUpload } from "@/lib/pdf-extract"
import { inngest } from "@/inngest/client"
import { processSyllabusExtractionInline } from "@/lib/syllabus-process"

export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateDemoUserId()

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      )
    }

    const { extractedText, s3Key, textS3Key } = await processPDFUpload(
      file,
      userId
    )

    const sourceId = `syllabus-${Date.now()}-${file.name}`

    const hasInngestKey = !!process.env.INNGEST_EVENT_KEY
    if (hasInngestKey) {
      try {
        await inngest.send({
          name: "syllabus/extract",
          data: {
            userId,
            s3Key: s3Key ?? undefined,
            textS3Key: textS3Key ?? undefined,
            extractedText: extractedText.text,
            sourceId,
          },
        })
        return NextResponse.json({
          success: true,
          message: "Syllabus uploaded and processing started",
          sourceId,
        })
      } catch (inngestError: any) {
        if (inngestError?.message?.includes("401") || inngestError?.message?.includes("Event key")) {
          // Fall back to inline processing when Inngest key is invalid/missing
          await processSyllabusExtractionInline(
            userId,
            extractedText.text,
            sourceId,
            textS3Key
          )
          return NextResponse.json({
            success: true,
            message: "Syllabus processed",
            sourceId,
          })
        }
        throw inngestError
      }
    }

    await processSyllabusExtractionInline(
      userId,
      extractedText.text,
      sourceId,
      textS3Key
    )
    return NextResponse.json({
      success: true,
      message: "Syllabus processed",
      sourceId,
    })
  } catch (error) {
    console.error("Syllabus upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload syllabus" },
      { status: 500 }
    )
  }
}
