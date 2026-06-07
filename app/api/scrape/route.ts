import { NextResponse } from 'next/server';
import { runFullScrape } from '@/lib/scrapers';
import { saveJobs, savePeople, saveMeta, loadMeta } from '@/lib/storage';

export const maxDuration = 60;

export async function POST(req: Request) {
  // Simple auth via secret header
  const secret = req.headers.get('x-scrape-secret');
  if (process.env.SCRAPE_SECRET && secret !== process.env.SCRAPE_SECRET) {
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

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger scrape' });
}
