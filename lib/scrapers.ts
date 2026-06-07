import axios from 'axios';
import * as cheerio from 'cheerio';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  source: string;
  foundAt: string;
  tags: string[];
}

export interface Person {
  id: string;
  name: string;
  role: string;
  company: string;
  profileUrl: string;
  snippet: string;
  source: string;
  foundAt: string;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

const PM_KEYWORDS = ['product manager', 'associate product manager', 'apm', 'product lead', 'growth pm', 'platform pm', 'senior pm'];

export function isPMRole(title: string): boolean {
  const t = title.toLowerCase();
  return PM_KEYWORDS.some(k => t.includes(k));
}

function makeId(title: string, company: string): string {
  return Buffer.from(`${title}|${company}`).toString('base64').slice(0, 16);
}

async function fetchPage(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const res = await axios.get(url, { timeout: 12000, headers: HEADERS });
    return cheerio.load(res.data);
  } catch {
    return null;
  }
}

// ── WELLFOUND ──────────────────────────────────────────
export async function scrapeWellfound(): Promise<Job[]> {
  const $ = await fetchPage('https://wellfound.com/jobs?role=product-manager&location=India');
  if (!$) return [];
  const jobs: Job[] = [];
  $('[class*="JobListing"], [class*="job-listing"], [class*="styles_component"]').each((_, el) => {
    const title = $(el).find('h2, h3, [class*="title"]').first().text().trim();
    const company = $(el).find('[class*="company"], [class*="startup-link"]').first().text().trim();
    const link = $(el).find('a').first().attr('href') || '';
    if (title && isPMRole(title)) {
      jobs.push({ id: makeId(title, company), title, company, location: 'India', link: link.startsWith('http') ? link : `https://wellfound.com${link}`, source: 'Wellfound', foundAt: new Date().toISOString(), tags: ['startup'] });
    }
  });
  return jobs;
}

// ── CUTSHORT ───────────────────────────────────────────
export async function scrapeCutshort(): Promise<Job[]> {
  const $ = await fetchPage('https://cutshort.io/jobs/product-manager-jobs-in-india');
  if (!$) return [];
  const jobs: Job[] = [];
  $('[class*="job-card"], [class*="JobCard"], .job-item, [class*="card"]').each((_, el) => {
    const title = $(el).find('[class*="title"], h2, h3').first().text().trim();
    const company = $(el).find('[class*="company"], [class*="employer"]').first().text().trim();
    const link = $(el).find('a').first().attr('href') || '';
    if (title && company && isPMRole(title)) {
      jobs.push({ id: makeId(title, company), title, company, location: 'India', link: link.startsWith('http') ? link : `https://cutshort.io${link}`, source: 'Cutshort', foundAt: new Date().toISOString(), tags: ['startup'] });
    }
  });
  return jobs;
}

// ── YC JOBS ────────────────────────────────────────────
export async function scrapeYCJobs(): Promise<Job[]> {
  const $ = await fetchPage('https://www.workatastartup.com/jobs?role=product');
  if (!$) return [];
  const jobs: Job[] = [];
  $('[class*="job"], .listing, [class*="JobItem"]').each((_, el) => {
    const title = $(el).find('h2, h3, [class*="title"]').first().text().trim();
    const company = $(el).find('[class*="company"], [class*="name"]').first().text().trim();
    const link = $(el).find('a').first().attr('href') || '';
    if (title && isPMRole(title)) {
      jobs.push({ id: makeId(title, company), title, company, location: 'India/Remote', link, source: 'YC Jobs', foundAt: new Date().toISOString(), tags: ['yc', 'startup'] });
    }
  });
  return jobs;
}

// ── GENERIC CAREER PAGE SCRAPER ────────────────────────
async function scrapeCareerPage(url: string, company: string, tags: string[]): Promise<Job[]> {
  const $ = await fetchPage(url);
  if (!$) return [];
  const jobs: Job[] = [];
  const seen = new Set<string>();
  $('a, [class*="job"], [class*="role"], [class*="position"], [class*="opening"], li').each((_, el) => {
    const text = $(el).text().trim().split('\n')[0].trim();
    const href = $(el).attr('href') || $(el).find('a').attr('href') || url;
    if (text.length > 5 && text.length < 120 && isPMRole(text) && !seen.has(text)) {
      seen.add(text);
      jobs.push({ id: makeId(text, company), title: text, company, location: 'India', link: href.startsWith('http') ? href : `${new URL(url).origin}${href}`, source: company, foundAt: new Date().toISOString(), tags });
    }
  });
  return jobs;
}

// ── GOOGLE SEARCH FOR LINKEDIN PEOPLE ─────────────────
export async function searchLinkedInPeople(queries: string[]): Promise<Person[]> {
  const people: Person[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    try {
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in ${query}`)}&num=8`;
      const $ = await fetchPage(searchUrl);
      if (!$) continue;

      $('div.g, [data-sokoban-container], .tF2Cxc').each((_, el) => {
        const titleEl = $(el).find('h3').first();
        const title = titleEl.text().trim();
        const snippet = $(el).find('[class*="snippet"], .VwiC3b, [data-sncf]').first().text().trim();
        const link = $(el).find('a').first().attr('href') || '';

        if (!title || !link.includes('linkedin.com/in/')) return;
        if (seen.has(link)) return;
        seen.add(link);

        // Parse "Name - Role at Company | LinkedIn"
        const parts = title.replace(' | LinkedIn', '').split(' - ');
        const name = parts[0]?.trim() || title;
        const roleCompany = parts[1]?.trim() || '';
        const roleParts = roleCompany.split(' at ');
        const role = roleParts[0]?.trim() || roleCompany;
        const company = roleParts[1]?.trim() || query.split(' at ').pop() || '';

        people.push({
          id: makeId(name, company),
          name,
          role,
          company,
          profileUrl: link,
          snippet: snippet.slice(0, 200),
          source: 'LinkedIn via Google',
          foundAt: new Date().toISOString(),
        });
      });
    } catch { continue; }
  }
  return people;
}

// ── ALL COMPANY PAGES ──────────────────────────────────
export async function scrapeAllCompanyPages(): Promise<Job[]> {
  const sources = [
    { url: 'https://razorpay.com/jobs/',                      company: 'Razorpay',    tags: ['fintech','high-priority'] },
    { url: 'https://cred.club/careers',                       company: 'CRED',        tags: ['fintech','high-priority'] },
    { url: 'https://groww.in/careers',                        company: 'Groww',       tags: ['fintech','high-priority'] },
    { url: 'https://meesho.io/jobs',                          company: 'Meesho',      tags: ['ecommerce','high-priority'] },
    { url: 'https://www.zepto.com/s/careers',                 company: 'Zepto',       tags: ['qcomm','high-priority'] },
    { url: 'https://www.phonepe.com/en/careers/',             company: 'PhonePe',     tags: ['fintech','high-priority'] },
    { url: 'https://jar.com/careers',                         company: 'Jar',         tags: ['fintech','high-priority'] },
    { url: 'https://setu.co/careers',                         company: 'Setu',        tags: ['fintech','high-priority'] },
    { url: 'https://juspay.io/careers',                       company: 'Juspay',      tags: ['fintech','high-priority'] },
    { url: 'https://careers.swiggy.com',                      company: 'Swiggy',      tags: ['foodtech'] },
    { url: 'https://www.zomato.com/careers',                  company: 'Zomato',      tags: ['foodtech'] },
    { url: 'https://darwinbox.com/careers',                   company: 'Darwinbox',   tags: ['b2b','saas'] },
    { url: 'https://zerodha.com/careers/',                    company: 'Zerodha',     tags: ['fintech'] },
    { url: 'https://www.postman.com/company/careers/',        company: 'Postman',     tags: ['devtools','global'] },
    { url: 'https://www.ema.co/careers',                      company: 'Ema',         tags: ['ai','structured'] },
    { url: 'https://careers.freshworks.com/jobs',             company: 'Freshworks',  tags: ['b2b','global','structured'] },
    { url: 'https://www.pw.live/careers',                     company: 'PhysicsWallah', tags: ['edtech'] },
    { url: 'https://urbancompany.com/careers',                company: 'Urban Company', tags: ['marketplace'] },
    { url: 'https://www.perfios.com/careers',                 company: 'Perfios',     tags: ['fintech','b2b'] },
    { url: 'https://bharatpe.com/careers',                    company: 'BharatPe',    tags: ['fintech'] },
    { url: 'https://careers.microsoft.com/professionals/us/en/search-results?keywords=associate%20product%20manager', company: 'Microsoft', tags: ['global','structured'] },
    { url: 'https://stripe.com/jobs/search?query=product+manager', company: 'Stripe', tags: ['global','fintech'] },
    { url: 'https://www.figma.com/careers/',                  company: 'Figma',       tags: ['global','design'] },
    { url: 'https://www.atlassian.com/company/careers/graduates/apm', company: 'Atlassian', tags: ['global','structured'] },
  ];

  const results = await Promise.allSettled(
    sources.map(s => scrapeCareerPage(s.url, s.company, s.tags))
  );
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
}

// ── LINKEDIN PEOPLE QUERIES ────────────────────────────
export const LINKEDIN_PEOPLE_QUERIES = [
  'product manager Razorpay India',
  'associate product manager CRED',
  'product manager Zepto India',
  'product manager Meesho India',
  'APM Flipkart IIT',
  'product manager Groww India',
  'product manager Jar fintech India',
  'APM Google India IIT',
  'product manager Freshworks India IIT',
  'product manager IIT Guwahati',
  'associate product manager Uber India',
  'product manager Postman India',
  'PM Darwinbox India',
  'product manager Stripe India',
];

// ── MASTER SCRAPE FUNCTION ─────────────────────────────
export async function runFullScrape(): Promise<{ jobs: Job[]; people: Person[] }> {
  const [wellfound, cutshort, yc, companyPages] = await Promise.allSettled([
    scrapeWellfound(),
    scrapeCutshort(),
    scrapeYCJobs(),
    scrapeAllCompanyPages(),
  ]);

  const allJobs: Job[] = [
    ...(wellfound.status === 'fulfilled' ? wellfound.value : []),
    ...(cutshort.status === 'fulfilled' ? cutshort.value : []),
    ...(yc.status === 'fulfilled' ? yc.value : []),
    ...(companyPages.status === 'fulfilled' ? companyPages.value : []),
  ];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter(j => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });

  // People — stagger queries to avoid rate limiting
  const people = await searchLinkedInPeople(LINKEDIN_PEOPLE_QUERIES.slice(0, 6));

  return { jobs: uniqueJobs, people };
}
