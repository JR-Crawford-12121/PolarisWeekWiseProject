import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { processPDFUpload } from "@/lib/pdf-extract"
import { inngest } from "@/inngest/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Process PDF upload and extract text
    const { s3Key, extractedText, textS3Key } = await processPDFUpload(
      file,
      session.user.id
    )

    // Store source evidence record
    const sourceId = `syllabus-${Date.now()}-${file.name}`
    
    // Trigger Inngest function for LLM processing
    await inngest.send({
      name: "syllabus/extract",
      data: {
        userId: session.user.id,
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
