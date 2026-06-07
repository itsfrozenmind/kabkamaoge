import { NextResponse } from 'next/server';
import { loadJobs, loadPeople, loadMeta } from '@/lib/storage';

export async function GET() {
  const jobs = loadJobs();
  const people = loadPeople();
  const meta = loadMeta();
  return NextResponse.json({ jobs, people, meta });
}
