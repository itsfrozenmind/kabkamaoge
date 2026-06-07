import { Job, Person } from './scrapers';

// ── FILE-BASED STORAGE (works on Vercel with /tmp) ────
// For production: swap this with @vercel/kv calls
// KV_REST_API_URL and KV_REST_API_TOKEN env vars needed

import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(process.cwd(), '.data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const PEOPLE_FILE = path.join(DATA_DIR, 'people.json');
const META_FILE = path.join(DATA_DIR, 'meta.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Meta {
  lastScrapedAt: string | null;
  totalJobsFound: number;
  totalPeopleFound: number;
  scrapeCount: number;
}

export function saveMeta(meta: Meta) {
  ensureDir();
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

export function loadMeta(): Meta {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
  } catch {
    return { lastScrapedAt: null, totalJobsFound: 0, totalPeopleFound: 0, scrapeCount: 0 };
  }
}

export function saveJobs(jobs: Job[]) {
  ensureDir();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

export function loadJobs(): Job[] {
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function savePeople(people: Person[]) {
  ensureDir();
  fs.writeFileSync(PEOPLE_FILE, JSON.stringify(people, null, 2));
}

export function loadPeople(): Person[] {
  try {
    return JSON.parse(fs.readFileSync(PEOPLE_FILE, 'utf-8'));
  } catch {
    return [];
  }
}
