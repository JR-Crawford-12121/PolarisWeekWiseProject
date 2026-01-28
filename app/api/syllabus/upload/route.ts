import { NextRequest, NextResponse } from "next/server"
import { getOrCreateDemoUserId } from "@/lib/demo-user"
import { processPDFUpload } from "@/lib/pdf-extract"
import { inngest } from "@/inngest/client"

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

    const { s3Key, extractedText, textS3Key } = await processPDFUpload(
      file,
      userId
    )

    const sourceId = `syllabus-${Date.now()}-${file.name}`

    await inngest.send({
      name: "syllabus/extract",
      data: {
        userId,
        s3Key,
        textS3Key,
        extractedText: extractedText.text,
        sourceId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Syllabus uploaded and processing started",
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
