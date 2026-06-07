# PM Radar 🎯
Nimesh's daily APM job scanner + LinkedIn PM people finder. Built on Next.js, deploys to Vercel in 2 minutes.

---

## Deploy to Vercel (2 mins)

### Step 1 — Push to GitHub
```bash
cd pm-radar
git init
git add .
git commit -m "init pm radar"
# create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/pm-radar.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Add these environment variables:
   - `SCRAPE_SECRET` = any random string (e.g. `nimesh2025`)
   - `CRON_SECRET` = any random string
4. Click Deploy

That's it. Vercel auto-detects Next.js.

### Step 3 — Run your first scan
Go to your deployed URL → click **↻ scan now**

---

## Cron
The `vercel.json` file schedules a scrape every day at 10:00 AM IST automatically.
No setup needed — Vercel handles it once deployed.

---

## Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Features
- **Jobs tab** — scans Wellfound, Cutshort, YC Jobs + 20 company career pages
- **People tab** — LinkedIn PM profiles via Google search + manual search links
- **Outreach tab** — 3 cold outreach templates + playbook
- **Daily cron** — auto-scans at 10 AM IST via Vercel cron
- **Manual scan** — hit "scan now" anytime

---

## Stack
- Next.js 14 (App Router)
- Tailwind CSS
- axios + cheerio for scraping
- File-based storage (works on Vercel /tmp)
- Vercel Cron for scheduling
