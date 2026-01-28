import pdfParse from "pdf-parse"
import { getS3Object, uploadToS3, getS3Key } from "./s3"

export interface ExtractedText {
  text: string
  metadata: {
    pages: number
    info?: any
  }
}

export async function extractTextFromPDFBuffer(buffer: Buffer): Promise<ExtractedText> {
  const data = await pdfParse(buffer)
  
  return {
    text: data.text,
    metadata: {
      pages: data.numpages,
      info: data.info,
    },
  }
}

export async function extractTextFromS3(s3Key: string): Promise<ExtractedText> {
  const buffer = await getS3Object(s3Key)
  return extractTextFromPDFBuffer(buffer)
}

export async function processPDFUpload(
  file: File,
  userId: string
): Promise<{
  extractedText: ExtractedText
  s3Key: string | null
  textS3Key: string | null
}> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Extract text first so upload works without S3
  const extractedText = await extractTextFromPDFBuffer(buffer)

  let pdfS3Key: string | null = null
  let textS3Key: string | null = null

  try {
    const key = getS3Key(`users/${userId}/syllabi`, file.name)
    await uploadToS3(key, buffer, "application/pdf")
    pdfS3Key = key
  } catch {
    // S3 optional; ignore
  }

  try {
    const key = getS3Key(`users/${userId}/extracted-text`, `${file.name}.txt`)
    await uploadToS3(key, extractedText.text, "text/plain")
    textS3Key = key
  } catch {
    // S3 optional; ignore
  }

  return {
    extractedText,
    s3Key: pdfS3Key,
    textS3Key,
  }
}
