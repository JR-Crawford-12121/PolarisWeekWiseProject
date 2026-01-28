# Calendar Event Management System

AI-powered calendar and event management system built with Next.js, TypeScript, and Prisma.

## Features

- **Syllabus Upload**: Upload PDF syllabi to automatically extract courses, events, and tasks
- **Gmail Integration**: Sync important emails and extract calendar events and tasks
- **LLM-Powered Extraction**: Uses GPT-4o-mini (default) with automatic escalation to GPT-4o
- **Proposal System**: All extracted items are proposed and require user approval
- **Deduplication**: Automatic deduplication across sources using dedupeKey and time tolerance
- **Week View Calendar**: FullCalendar integration with timeGridWeek view
- **Event Drawer**: View event details with optional LLM formatting and checklist
- **Timezone Support**: All times handled in America/Chicago timezone

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Calendar**: FullCalendar (timeGridWeek)
- **Database**: PostgreSQL + Prisma
- **Background Jobs**: Inngest
- **Storage**: S3-compatible (MinIO)
- **Authentication**: NextAuth.js with Google OAuth
- **LLM**: OpenAI (GPT-4o-mini / GPT-4o)

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- MinIO instance (or other S3-compatible storage)
- OpenAI API key
- Google OAuth credentials
- Inngest account (optional, for production)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `OPENAI_API_KEY`: OpenAI API key
- `S3_*`: MinIO/S3 configuration
- `INNGEST_EVENT_KEY`: Inngest event key (optional)

3. Set up database:
```bash
npx prisma generate
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```

## Usage

### Syllabus Upload

1. Click "Upload Syllabus" button
2. Select a PDF file
3. The system will:
   - Upload PDF to S3
   - Extract text from PDF
   - Process with LLM to extract courses, events, and tasks
   - Create proposed items in the database
   - Show items in the "Review Proposals" panel

### Gmail Sync

1. Sign in with Google (includes Gmail scopes)
2. Click "Sync Gmail" button
3. The system will:
   - Fetch important emails from Gmail
   - Process each email with LLM
   - Extract events and tasks
   - Create proposed items

### Reviewing Proposals

1. Click "Review Proposals" to open the approval panel
2. Review proposed events and tasks
3. Click "Confirm" to accept or "Dismiss" to reject
4. Confirmed items appear in the calendar

### Viewing Events

1. Click on any event in the calendar
2. View event details in the drawer
3. Optionally enable LLM formatting for better presentation
4. View and manage associated tasks/checklist items

## Architecture

### Database Schema

- **User**: Authentication and user data
- **Course**: Course information
- **Event**: Calendar events with status (proposed/confirmed/dismissed)
- **Task**: Tasks/assignments with due dates
- **SourceEvidence**: Links events/tasks to their source (syllabus/email)
- **EmailMessage**: Stored email messages
- **UserIntegration**: OAuth tokens for integrations

### LLM Processing

All LLM outputs are validated with Zod schemas. The system:
1. Tries GPT-4o-mini first
2. Escalates to GPT-4o if:
   - Confidence < 0.65
   - Schema validation fails

### Deduplication

Events and tasks are deduplicated using:
- `dedupeKey`: Deterministic key based on source, title, and time
- Time tolerance: 15 minutes

## Development

### Database Migrations

```bash
npx prisma migrate dev
```

### View Database

```bash
npx prisma studio
```

## License

MIT
