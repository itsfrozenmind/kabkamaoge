import { NextResponse } from 'next/server';
import { runFullScrape } from '@/lib/scrapers';
import { saveJobs, savePeople, saveMeta, loadMeta } from '@/lib/storage';

export const maxDuration = 60;

export async function GET(req: Request) {
  // Vercel cron sends this header
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobs, people } = await runFullScrape();
    saveJobs(jobs);
    savePeople(people);
    const prevMeta = loadMeta();
    saveMeta({
      lastScrapedAt: new Date().toISOString(),
      totalJobsFound: jobs.length,
      totalPeopleFound: people.length,
      scrapeCount: (prevMeta.scrapeCount || 0) + 1,
    });
    return NextResponse.json({ success: true, jobsFound: jobs.length, peopleFound: people.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
