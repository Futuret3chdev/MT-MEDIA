export type MatchJob = {
  connect?: string;
  role?: string;
  blurb?: string | null;
  location?: string | null;
  skills?: string[];
};

export type MatchProfile = {
  skills?: string[];
  location?: string | null;
  connectTypes?: string[];
  categories?: Record<string, boolean>;
};

export function scoreJobMatch(job: MatchJob, profile: MatchProfile) {
  const reasons: string[] = [];
  let score = 0;
  const connect = job.connect === 'longterm' ? 'longterm' : 'fast';
  const wants = profile.connectTypes?.length ? profile.connectTypes : ['fast', 'longterm'];
  if (!wants.includes(connect) && !wants.includes('both')) {
    return { score: 0, matchPct: 0, reasons: [], connect, hidden: true };
  }
  score += 20;
  reasons.push(connect === 'longterm' ? 'Long-term' : 'Fast Connect');

  const js = (job.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const us = (profile.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  if (js.length && us.length) {
    const matched = js.filter((s) => us.includes(s));
    score += Math.round((matched.length / js.length) * 40);
    if (matched.length) reasons.push(`${matched.length} skill${matched.length === 1 ? '' : 's'}`);
  } else {
    score += 12;
  }

  const a = String(job.location || '').toLowerCase();
  const b = String(profile.location || '').toLowerCase();
  if (a && b) {
    if (a.includes(b) || b.includes(a)) {
      score += 20;
      reasons.push('Same area');
    } else {
      const tokens = b.split(/[,\s]+/).filter((t) => t.length > 3);
      if (tokens.some((t) => a.includes(t))) {
        score += 10;
        reasons.push('Nearby city');
      }
    }
  }

  const cats = profile.categories || {};
  if (connect === 'longterm' && Object.values(cats).some(Boolean)) score += 5;

  const matchPct = Math.max(0, Math.min(99, Math.round(score)));
  return { score, matchPct, reasons: reasons.slice(0, 3), connect, hidden: false };
}
