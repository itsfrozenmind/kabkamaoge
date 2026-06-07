'use client';

import { useState, useEffect, useCallback } from 'react';

interface Job {
  id: string; title: string; company: string;
  location: string; link: string; source: string;
  foundAt: string; tags: string[];
}
interface Person {
  id: string; name: string; role: string; company: string;
  profileUrl: string; snippet: string; source: string; foundAt: string;
}
interface Meta {
  lastScrapedAt: string | null; totalJobsFound: number;
  totalPeopleFound: number; scrapeCount: number;
}

const OUTREACH_TEMPLATES: Record<string, string> = {
  pm_at_company: `Hi [Name],\n\nI'm Nimesh, a 3rd year at IIT Guwahati currently interning as a PM at a pre-Series A fintech startup. I've been following [Company]'s product work closely.\n\nI'm exploring PM opportunities post-graduation and would love 15 minutes to hear about your experience. No ask beyond that.\n\nWould you be open to a quick call?\n\nNimesh`,
  iitg_alumni: `Hi [Name],\n\nFellow IIT Guwahati here. I came across your profile while researching PM roles at [Company].\n\nCurrently interning as a PM at a pre-Series A fintech. Would really value 15 minutes to hear how you made the transition.\n\nNimesh | IIT Guwahati`,
  cold_with_case: `Hi [Name],\n\nI'm a PM intern at a pre-Series A NRI fintech (IIT Guwahati). I built a product teardown of [Company]'s [feature] and found an interesting opportunity in [area].\n\nWould love to share it and explore if there's a fit.\n\nNimesh`,
};

export default function PMRadar() {
  const [tab, setTab] = useState<'jobs' | 'people' | 'outreach'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [meta, setMeta] = useState<Meta>({ lastScrapedAt: null, totalJobsFound: 0, totalPeopleFound: 0, scrapeCount: 0 });
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [jobFilter, setJobFilter] = useState('all');
  const [jobSearch, setJobSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('pm_at_company');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      setJobs(data.jobs || []);
      setPeople(data.people || []);
      setMeta(data.meta || {});
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function triggerScrape() {
    setScraping(true);
    try {
      await fetch('/api/scrape', { method: 'POST', headers: { 'x-scrape-secret': process.env.NEXT_PUBLIC_SCRAPE_SECRET || '' } });
      await fetchData();
    } catch { /* silent */ }
    setScraping(false);
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  const filteredJobs = jobs.filter(j => {
    const matchFilter = jobFilter === 'all' || j.tags.includes(jobFilter) || j.source.toLowerCase() === jobFilter;
    const matchSearch = !jobSearch || j.title.toLowerCase().includes(jobSearch.toLowerCase()) || j.company.toLowerCase().includes(jobSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredPeople = people.filter(p =>
    !personSearch || p.name.toLowerCase().includes(personSearch.toLowerCase()) ||
    p.company.toLowerCase().includes(personSearch.toLowerCase()) ||
    p.role.toLowerCase().includes(personSearch.toLowerCase())
  );

  const tagCounts: Record<string, number> = {};
  jobs.forEach(j => j.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] font-mono">

      {/* Header */}
      <div className="border-b border-[#1e1e2e] px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] tracking-widest text-[#7c6aff] uppercase mb-1">// pm_radar · IITG · 2025</div>
            <h1 className="text-2xl font-bold tracking-tight">Nimesh&apos;s <span className="text-[#3ddc84]">PM Radar</span></h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-3">
              {[
                { label: 'jobs', value: meta.totalJobsFound },
                { label: 'people', value: meta.totalPeopleFound },
                { label: 'scans', value: meta.scrapeCount },
              ].map(s => (
                <div key={s.label} className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2 text-center min-w-[56px]">
                  <div className="text-lg font-bold text-[#e8e8f0]">{s.value}</div>
                  <div className="text-[9px] text-[#5a5a78] uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end gap-1">
              <button onClick={triggerScrape} disabled={scraping}
                className="bg-[#7c6aff] hover:bg-[#6a58ee] disabled:opacity-50 text-white text-[11px] px-4 py-2 rounded-lg transition-all font-mono tracking-wide">
                {scraping ? '⟳ scanning...' : '↻ scan now'}
              </button>
              {meta.lastScrapedAt && (
                <div className="text-[9px] text-[#5a5a78]">
                  last: {new Date(meta.lastScrapedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })} IST
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto flex gap-0 mt-4 border-b border-[#1e1e2e]">
          {(['jobs', 'people', 'outreach'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[11px] px-5 py-2.5 border-b-2 transition-all tracking-wide ${tab === t ? 'border-[#7c6aff] text-[#7c6aff]' : 'border-transparent text-[#5a5a78] hover:text-[#e8e8f0]'}`}>
              {t}
              {t === 'jobs' && jobs.length > 0 && <span className="ml-2 bg-[#7c6aff]/20 text-[#7c6aff] text-[9px] px-1.5 py-0.5 rounded-full">{jobs.length}</span>}
              {t === 'people' && people.length > 0 && <span className="ml-2 bg-[#3ddc84]/20 text-[#3ddc84] text-[9px] px-1.5 py-0.5 rounded-full">{people.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {loading && (
          <div className="text-center py-12 text-[#5a5a78] text-sm">loading data...</div>
        )}

        {/* ── JOBS TAB ── */}
        {!loading && tab === 'jobs' && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 mb-5 items-center">
              <input value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                placeholder="search roles..." className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7c6aff] w-48 text-[#e8e8f0] placeholder-[#5a5a78]" />
              <div className="flex flex-wrap gap-2">
                {['all', 'high-priority', 'fintech', 'startup', 'global', 'structured', 'b2b', 'ai'].map(f => (
                  <button key={f} onClick={() => setJobFilter(f)}
                    className={`text-[10px] px-3 py-1.5 rounded-full border transition-all tracking-wide ${jobFilter === f ? 'bg-[#7c6aff] border-[#7c6aff] text-white' : 'border-[#2e2e3e] text-[#5a5a78] hover:border-[#7c6aff] hover:text-[#7c6aff]'}`}>
                    {f}{tagCounts[f] ? ` (${tagCounts[f]})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-[#5a5a78] text-sm mb-3">No jobs loaded yet.</div>
                <button onClick={triggerScrape} disabled={scraping}
                  className="bg-[#7c6aff] text-white text-sm px-5 py-2.5 rounded-lg hover:bg-[#6a58ee] disabled:opacity-50 transition-all">
                  {scraping ? 'scanning...' : 'Run first scan →'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredJobs.map(job => (
                  <div key={job.id} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2e2e3e] transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-semibold text-sm leading-tight text-[#e8e8f0]">{job.title}</div>
                      {job.tags.includes('high-priority') && (
                        <span className="text-[9px] bg-[#ff6a2a]/15 text-[#ff8a4a] px-2 py-0.5 rounded-full border border-[#ff6a2a]/20 whitespace-nowrap flex-shrink-0">🔥 priority</span>
                      )}
                    </div>
                    <div className="text-[#5a5a78] text-xs mb-3">{job.company} · {job.source}</div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.tags.filter(t => t !== 'high-priority').map(t => (
                        <span key={t} className="text-[9px] bg-[#1a1a24] text-[#5a5a78] px-2 py-0.5 rounded border border-[#2e2e3e]">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#3a3a52]">{new Date(job.foundAt).toLocaleDateString('en-IN')}</span>
                      {job.link && (
                        <a href={job.link} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-[#7c6aff] hover:text-[#9c8aff] transition-colors tracking-wide">
                          apply ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PEOPLE TAB ── */}
        {!loading && tab === 'people' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
              <input value={personSearch} onChange={e => setPersonSearch(e.target.value)}
                placeholder="search people..." className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3ddc84] w-48 text-[#e8e8f0] placeholder-[#5a5a78]" />
              <div className="text-[10px] text-[#5a5a78]">Found via Google → LinkedIn · click to view profile</div>
            </div>

            {/* Manual search links */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 mb-5">
              <div className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-3">Manual LinkedIn Searches (open in browser)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'PM at Razorpay', url: 'https://www.linkedin.com/search/results/people/?keywords=product+manager+razorpay' },
                  { label: 'APM at Flipkart (IIT)', url: 'https://www.linkedin.com/search/results/people/?keywords=flipkart+APM+IIT' },
                  { label: 'PM at CRED', url: 'https://www.linkedin.com/search/results/people/?keywords=product+manager+CRED' },
                  { label: 'PM at Zepto', url: 'https://www.linkedin.com/search/results/people/?keywords=product+manager+zepto' },
                  { label: 'PM at Groww', url: 'https://www.linkedin.com/search/results/people/?keywords=product+manager+groww' },
                  { label: 'IIT Guwahati PMs', url: 'https://www.linkedin.com/search/results/people/?keywords=product+manager+%22IIT+Guwahati%22' },
                  { label: 'Google APM India', url: 'https://www.linkedin.com/search/results/people/?keywords=google+APM+India+IIT' },
                  { label: 'Uber APM India', url: 'https://www.linkedin.com/search/results/people/?keywords=uber+APM+India' },
                  { label: 'PM at Freshworks (IIT)', url: 'https://www.linkedin.com/search/results/people/?keywords=product+manager+freshworks+IIT' },
                  { label: 'PM at Postman India', url: 'https://www.linkedin.com/search/results/people/?keywords=product+manager+postman+India' },
                ].map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between bg-[#0d0d16] border border-[#1e1e2e] rounded-lg px-3 py-2 hover:border-[#3ddc84] transition-all group">
                    <span className="text-xs text-[#e8e8f0]">{s.label}</span>
                    <span className="text-[10px] text-[#3ddc84] opacity-0 group-hover:opacity-100 transition-opacity">open ↗</span>
                  </a>
                ))}
              </div>
            </div>

            {filteredPeople.length === 0 ? (
              <div className="text-center py-10 text-[#5a5a78] text-sm">
                No people scraped yet — run a scan or use the manual links above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPeople.map(p => (
                  <div key={p.id} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2e2e3e] transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#7c6aff]/20 flex items-center justify-center text-[#7c6aff] font-bold text-sm flex-shrink-0">
                        {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#e8e8f0]">{p.name}</div>
                        <div className="text-[11px] text-[#5a5a78]">{p.role}</div>
                        <div className="text-[11px] text-[#3ddc84]">{p.company}</div>
                      </div>
                      <a href={p.profileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-[#7c6aff] hover:text-[#9c8aff] transition-colors whitespace-nowrap">
                        LinkedIn ↗
                      </a>
                    </div>
                    {p.snippet && (
                      <div className="mt-3 text-[10px] text-[#3a3a52] line-clamp-2 leading-relaxed">{p.snippet}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OUTREACH TAB ── */}
        {!loading && tab === 'outreach' && (
          <div className="max-w-2xl">
            <div className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-4">Outreach Templates</div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {Object.keys(OUTREACH_TEMPLATES).map(k => (
                <button key={k} onClick={() => setSelectedTemplate(k)}
                  className={`text-[10px] px-3 py-1.5 rounded-full border transition-all tracking-wide ${selectedTemplate === k ? 'bg-[#7c6aff] border-[#7c6aff] text-white' : 'border-[#2e2e3e] text-[#5a5a78] hover:border-[#7c6aff] hover:text-[#7c6aff]'}`}>
                  {k.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
                <span className="text-[10px] text-[#5a5a78] uppercase tracking-wider">{selectedTemplate.replace(/_/g, ' ')}</span>
                <button onClick={() => copyText(OUTREACH_TEMPLATES[selectedTemplate], selectedTemplate)}
                  className="text-[10px] px-3 py-1.5 bg-[#7c6aff]/20 text-[#7c6aff] rounded-lg hover:bg-[#7c6aff]/30 transition-all">
                  {copiedId === selectedTemplate ? 'copied ✓' : 'copy'}
                </button>
              </div>
              <pre className="px-4 py-4 text-xs text-[#c8c8d8] leading-relaxed whitespace-pre-wrap font-mono">
                {OUTREACH_TEMPLATES[selectedTemplate]}
              </pre>
            </div>

            <div className="mt-6 bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
              <div className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-3">Playbook — in order</div>
              {[
                ['1', 'Run scan', 'Get fresh jobs from all boards'],
                ['2', 'Find people', 'Open LinkedIn searches, find 2-3 PMs per company'],
                ['3', 'Add to tracker', 'Paste into your job tracker with contact attached'],
                ['4', 'Send outreach', 'Use template above, personalise [Name] and [Company]'],
                ['5', 'Follow up', '5 days later if no reply — one nudge only'],
              ].map(([num, title, sub]) => (
                <div key={num} className="flex gap-3 items-start py-2.5 border-b border-[#1a1a24] last:border-0">
                  <span className="text-[10px] text-[#7c6aff] font-bold w-4 flex-shrink-0 mt-0.5">{num}</span>
                  <div>
                    <div className="text-xs text-[#e8e8f0] font-medium">{title}</div>
                    <div className="text-[10px] text-[#5a5a78] mt-0.5">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
