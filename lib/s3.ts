// S3-compatible storage client
// Using MinIO-compatible API
interface S3Config {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region?: string
}

const s3Config: S3Config = {
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
  bucket: process.env.S3_BUCKET_NAME || "calendar-events",
  region: process.env.S3_REGION || "us-east-1",
}

// Simple S3-compatible client using fetch API
// For production, consider using @aws-sdk/client-s3
async function s3Request(
  method: string,
  path: string,
  body?: Buffer | string,
  contentType?: string
): Promise<Response> {
  const url = `${s3Config.endpoint}/${s3Config.bucket}${path}`
  
  const headers: HeadersInit = {
    Authorization: `AWS ${s3Config.accessKeyId}:${await signRequest(method, path)}`,
  }
  
  if (contentType) {
    headers["Content-Type"] = contentType
  }

  return fetch(url, {
    method,
    headers,
    body: body as any,
  })
}

async function signRequest(method: string, path: string): Promise<string> {
  // Simplified signing - for production use proper AWS signature v4
  // This is a placeholder that works with MinIO's simpler auth
  const crypto = require("crypto")
  const stringToSign = `${method}\n\n${path}`
  return crypto.createHmac("sha1", s3Config.secretAccessKey)
    .update(stringToSign)
    .digest("base64")
}

export async function uploadToS3(
  key: string,
  body: Buffer | string,
  contentType: string
): Promise<string> {
  const response = await s3Request("PUT", `/${key}`, body, contentType)
  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.statusText}`)
  }
  return key
}

export async function getS3Object(key: string): Promise<Buffer> {
  const response = await s3Request("GET", `/${key}`)
  if (!response.ok) {
    throw new Error(`S3 get failed: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function getS3PresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  // For production, implement proper presigned URL generation
  // This is a simplified version
  return `${s3Config.endpoint}/${s3Config.bucket}/${key}?expires=${Date.now() + expiresIn * 1000}`
}

export function getS3Key(prefix: string, filename: string): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
  return `${prefix}/${timestamp}-${sanitizedFilename}`
}
