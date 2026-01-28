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
): Promise<{ s3Key: string; extractedText: ExtractedText; textS3Key: string }> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload PDF to S3
  const pdfS3Key = getS3Key(`users/${userId}/syllabi`, file.name)
  await uploadToS3(pdfS3Key, buffer, "application/pdf")

  // Extract text
  const extractedText = await extractTextFromPDFBuffer(buffer)

  // Upload extracted text to S3
  const textS3Key = getS3Key(`users/${userId}/extracted-text`, `${file.name}.txt`)
  await uploadToS3(textS3Key, extractedText.text, "text/plain")

  return {
    s3Key: pdfS3Key,
    extractedText,
    textS3Key,
  }
}
