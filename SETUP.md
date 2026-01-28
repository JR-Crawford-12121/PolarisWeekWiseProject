# Local Development Setup Guide

## Prerequisites

Before starting, ensure you have installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** ([Download](https://www.postgresql.org/download/))
- **MinIO** (S3-compatible storage) ([Download](https://min.io/download))

## Step-by-Step Setup

### Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

**Note**: If you encounter PowerShell execution policy errors on Windows:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

If you encounter dependency conflicts, you can use:
```bash
npm install --legacy-peer-deps
```

This will install all required packages including Next.js, Prisma, FullCalendar, and other dependencies.

---

### Step 2: Set Up PostgreSQL Database

1. **Start PostgreSQL** (if not already running):
   - On Windows: Start PostgreSQL service from Services
   - On Mac/Linux: `brew services start postgresql` or `sudo systemctl start postgresql`

2. **Create a database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE calendar_events;
   
   # Exit psql
   \q
   ```

3. **Note your connection string**:
   - Format: `postgresql://username:password@localhost:5432/calendar_events?schema=public`
   - Example: `postgresql://postgres:password@localhost:5432/calendar_events?schema=public`

---

### Step 3: Set Up MinIO (S3-Compatible Storage)

1. **Download and install MinIO**:
   - Download from https://min.io/download
   - Or use Docker: `docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"`

2. **Start MinIO**:
   ```bash
   # If installed locally
   minio server ./data --console-address ":9001"
   
   # Or with Docker (from above)
   ```

3. **Create bucket**:
   - Open http://localhost:9001 in your browser
   - Login with default credentials: `minioadmin` / `minioadmin`
   - Create a bucket named `calendar-events`

---

### Step 4: Set Up Environment Variables

1. **Create `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** with your values:

   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/calendar_events?schema=public"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-random-secret-here"
   
   # Generate NEXTAUTH_SECRET:
   # Run: openssl rand -base64 32
   # Or use: https://generate-secret.vercel.app/32
   
   # Google OAuth (Get from https://console.cloud.google.com/)
   GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # OpenAI
   OPENAI_API_KEY="sk-your-openai-api-key"
   
   # S3/MinIO
   S3_ENDPOINT="http://localhost:9000"
   S3_ACCESS_KEY_ID="minioadmin"
   S3_SECRET_ACCESS_KEY="minioadmin"
   S3_BUCKET_NAME="calendar-events"
   S3_REGION="us-east-1"
   
   # Inngest (Optional for local development)
   INNGEST_EVENT_KEY="your-inngest-event-key"
   ```

#### Getting Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API" and "Gmail API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env`

---

### Step 5: Set Up Database Schema

Run Prisma migrations to create all database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

**Optional**: View your database with Prisma Studio:
```bash
npx prisma studio
```
This opens a GUI at http://localhost:5555

---

### Step 6: Start the Development Server

Run the Next.js development server:

```bash
npm run dev
```

The application will start at:
- **Frontend/API**: http://localhost:3000

---

### Step 7: Access the Application

1. **Open browser**: Navigate to http://localhost:3000
2. **Sign in**: Click "Sign in with Google" and authenticate
3. **Start using**:
   - Upload a syllabus PDF
   - Sync Gmail important emails
   - Review proposals in the approval panel
   - View events in the calendar

---

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
- Check DATABASE_URL format in `.env`
- Ensure database exists: `psql -U postgres -l`

### MinIO Connection Issues

- Verify MinIO is running: Check http://localhost:9000
- Verify bucket exists: Check http://localhost:9001
- Check S3_* environment variables match MinIO credentials

### Authentication Issues

- Verify Google OAuth credentials are correct
- Check redirect URI matches: `http://localhost:3000/api/auth/callback/google`
- Ensure NEXTAUTH_SECRET is set

### Prisma Issues

- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to sync schema
- Check database connection string

### Port Already in Use

If port 3000 is in use:
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in package.json scripts:
# "dev": "next dev -p 3001"
```

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npx prisma generate    # Generate Prisma Client
npx prisma db push     # Push schema to database
npx prisma migrate dev # Create migration
npx prisma studio      # Open database GUI

# Linting
npm run lint
```

---

## Next Steps After Setup

1. **Test Syllabus Upload**:
   - Click "Upload Syllabus"
   - Upload a PDF syllabus
   - Check proposals panel for extracted events/tasks

2. **Test Gmail Sync**:
   - Ensure you're signed in with Google
   - Click "Sync Gmail"
   - Check proposals panel for email-derived events/tasks

3. **Review Proposals**:
   - Open "Review Proposals" panel
   - Confirm or dismiss proposed items
   - View confirmed items in calendar

4. **View Events**:
   - Click on any event in the calendar
   - View details in the event drawer
   - Enable LLM formatting for enhanced presentation

---

## Production Deployment Notes

For production deployment:

1. Use a production PostgreSQL database (e.g., Supabase, AWS RDS)
2. Use production S3 storage (AWS S3, Cloudflare R2)
3. Set up Inngest cloud account for background jobs
4. Configure proper environment variables
5. Set up domain and update OAuth redirect URIs
6. Use secure NEXTAUTH_SECRET
7. Enable HTTPS

---

## Need Help?

- Check the main [README.md](README.md) for architecture details
- Review Prisma schema in `prisma/schema.prisma`
- Check API routes in `app/api/`
- Review component code in `components/`
