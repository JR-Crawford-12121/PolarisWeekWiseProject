import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/inngest/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get Gmail integration
    const integration = await prisma.userIntegration.findFirst({
      where: {
        userId: session.user.id,
        provider: "gmail",
        enabled: true,
      },
    })

    if (!integration || !integration.accessToken) {
      return NextResponse.json(
        { error: "Gmail integration not found" },
        { status: 404 }
      )
    }

    // Fetch important emails from Gmail
    const gmailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:important`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    )

    if (!gmailResponse.ok) {
      throw new Error(`Gmail API error: ${gmailResponse.statusText}`)
    }

    const data = await gmailResponse.json()
    const messageIds = data.messages?.map((m: any) => m.id) || []

    // Fetch full message details and process
    for (const messageId of messageIds.slice(0, 10)) {
      // Check if already processed
      const existing = await prisma.emailMessage.findUnique({
        where: { messageId },
      })

      if (existing?.processed) {
        continue
      }

      // Fetch message details
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
          },
        }
      )

      if (!messageResponse.ok) {
        continue
      }

      const messageData = await messageResponse.json()

      // Extract email data
      const headers = messageData.payload.headers || []
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
          ?.value || ""

      const subject = getHeader("subject")
      const from = getHeader("from")
      const to = getHeader("to")
      const date = getHeader("date")

      // Extract body
      let bodyText = ""
      let bodyHtml = ""

      const extractBody = (part: any) => {
        if (part.body?.data) {
          const content = Buffer.from(part.body.data, "base64").toString()
          if (part.mimeType === "text/plain") {
            bodyText = content
          } else if (part.mimeType === "text/html") {
            bodyHtml = content
          }
        }
        if (part.parts) {
          part.parts.forEach(extractBody)
        }
      }

      extractBody(messageData.payload)

      // Store email message
      const emailMessage = await prisma.emailMessage.upsert({
        where: { messageId },
        update: {},
        create: {
          userId: session.user.id,
          messageId,
          threadId: messageData.threadId || null,
          subject,
          from,
          to: to.split(",").map((e: string) => e.trim()),
          cc: [],
          bcc: [],
          bodyText: bodyText || null,
          bodyHtml: bodyHtml || null,
          receivedAt: date ? new Date(date) : new Date(),
          isImportant: true,
        },
      })

      // Trigger extraction if not processed
      if (!emailMessage.processed) {
        await inngest.send({
          name: "email/extract",
          data: {
            userId: session.user.id,
            emailId: emailMessage.id,
            subject,
            bodyText,
            bodyHtml,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gmail sync completed",
      processed: messageIds.length,
    })
  } catch (error) {
    console.error("Gmail sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync Gmail" },
      { status: 500 }
    )
  }
}
