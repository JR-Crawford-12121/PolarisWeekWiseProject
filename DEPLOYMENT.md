# Deployment Guide

## Stack Overview

This is a **Next.js 14** full-stack application with:

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS + shadcn/ui (Radix UI components)
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js (currently using demo user mode)
- **Background Jobs**: Inngest (optional - falls back to inline processing)
- **Storage**: S3/MinIO (optional - falls back to in-memory)
- **AI**: OpenAI API
- **Calendar**: FullCalendar

---

## Recommended Deployment: Vercel + Neon (Easiest)

**Vercel** is the easiest option because:
- Made by the Next.js creators
- Zero-config deployment for Next.js
- Free tier available
- Automatic HTTPS, CDN, and edge functions
- Built-in CI/CD with Git integration

**Neon** is recommended for PostgreSQL because:
- Serverless PostgreSQL (scales to zero)
- Free tier available
- Works seamlessly with Prisma
- Easy connection string setup

### Step 1: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:pass@host/dbname`)
4. Keep this for Step 3

### Step 2: Push Database Schema

```bash
# Set your Neon connection string temporarily
export DATABASE_URL="your-neon-connection-string"

# Push schema to Neon
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Step 3: Deploy to Vercel

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign up/login

3. **Import your GitHub repository**:
   - Click "Add New Project"
   - Select your repository
   - Vercel will auto-detect Next.js

4. **Configure Environment Variables**:
   In the Vercel project settings, add these environment variables:

   ```
   DATABASE_URL=your-neon-connection-string-from-step-1
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=generate-a-random-secret-here
   OPENAI_API_KEY=sk-your-openai-key
   
   # Optional (if using Inngest)
   INNGEST_EVENT_KEY=your-inngest-key
   
   # Optional (if using S3 - can leave empty for in-memory fallback)
   S3_ENDPOINT=
   S3_ACCESS_KEY_ID=
   S3_SECRET_ACCESS_KEY=
   S3_BUCKET_NAME=
   S3_REGION=
   ```

   **Generate NEXTAUTH_SECRET**: Visit [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

5. **Deploy**: Click "Deploy" - Vercel will build and deploy automatically

6. **Update NEXTAUTH_URL**: After first deploy, update `NEXTAUTH_URL` in Vercel settings to your actual domain (e.g., `https://your-app.vercel.app`)

### Step 4: Set Up Inngest (Optional)

If you want background job processing:

1. Go to [inngest.com](https://inngest.com) and sign up
2. Create a new app
3. Copy the Event Key
4. Add it to Vercel environment variables as `INNGEST_EVENT_KEY`
5. Deploy the Inngest functions endpoint (already configured at `/api/inngest`)

---

## Alternative Deployment Options

### Option 2: Railway (All-in-One)

**Railway** can host both Next.js and PostgreSQL in one place:

1. Go to [railway.app](https://railway.app) and sign up
2. Create a new project
3. Add PostgreSQL service (Railway will create it automatically)
4. Add GitHub repository (Railway will detect Next.js)
5. Set environment variables (same as Vercel)
6. Deploy

**Pros**: Everything in one place, simpler setup  
**Cons**: More expensive than Vercel free tier

### Option 3: Render

**Render** is similar to Railway:

1. Go to [render.com](https://render.com) and sign up
2. Create a PostgreSQL database
3. Create a Web Service from your GitHub repo
4. Set environment variables
5. Deploy

**Pros**: Free tier available, easy setup  
**Cons**: Free tier spins down after inactivity

### Option 4: Fly.io

**Fly.io** is good for full-stack apps:

1. Install Fly CLI: `npm i -g @fly/cli`
2. Run `fly launch` in your project directory
3. Follow prompts
4. Set environment variables via `fly secrets set KEY=value`

**Pros**: Good for Docker-based deployments  
**Cons**: More complex setup

---

## Pre-Deployment Checklist

- [ ] Push code to GitHub
- [ ] Set up PostgreSQL database (Neon/Railway/etc.)
- [ ] Run `npx prisma db push` to create tables
- [ ] Set all environment variables in hosting platform
- [ ] Generate `NEXTAUTH_SECRET`
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Test locally with production database URL (optional)

---

## Post-Deployment

1. **Verify database connection**: Check that events can be created
2. **Test syllabus upload**: Should work without S3 (uses in-memory fallback)
3. **Test AI chat**: Requires OpenAI API key
4. **Monitor logs**: Check Vercel/Railway logs for errors

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | ✅ Yes | Your app URL (e.g., `https://app.vercel.app`) |
| `NEXTAUTH_SECRET` | ✅ Yes | Random secret (32+ chars) |
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for AI features |
| `INNGEST_EVENT_KEY` | ⚠️ Optional | Inngest event key (falls back to inline processing) |
| `S3_*` | ⚠️ Optional | S3 credentials (falls back to in-memory) |

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs (Neon does automatically)
- Run `npx prisma db push` to ensure schema is up to date

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure `prisma generate` runs during build (Vercel does this automatically)
- Check build logs in Vercel dashboard

### Runtime Errors
- Check function logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `NEXTAUTH_URL` matches your actual domain

---

## Cost Estimate (Vercel + Neon)

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Neon**: Free tier includes 0.5GB storage, 192 hours compute/month
- **OpenAI**: Pay-as-you-go (very cheap for small usage)
- **Total**: ~$0/month for small projects

---

## Quick Start (TL;DR)

1. Push code to GitHub
2. Create Neon database → copy connection string
3. Deploy to Vercel → import GitHub repo
4. Add env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`
5. Deploy!
6. Run `npx prisma db push` locally with Neon URL to create tables

Done! 🎉
