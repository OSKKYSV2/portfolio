import { NextResponse } from 'next/server';

export const runtime = 'edge';

type Repo = {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  archived: boolean;
  fork: boolean;
  private: boolean;
  pushed_at: string;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  detail?: string;
  profile?: any;
  stats?: { totalStars: number; totalForks: number; totalWatchers: number };
  topLanguages?: { name: string; count: number }[];
  repoCount?: number;
  latest?: { name: string; url: string; description: string | null; stars: number; forks: number; language: string | null }[];
};

const TTL_MS = 1000 * 60 * 15;
let CACHE: { at: number; data: ApiResponse } | null = null;

function buildHeaders(withToken: boolean) {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'nextjs-portfolio-app',
  };
  const tok = process.env.GITHUB_TOKEN;
  if (withToken && tok) h.Authorization = `Bearer ${tok}`;
  return h;
}

async function safeFetch(url: string, headers: Record<string, string>) {
  const r = await fetch(url, { headers, cache: 'no-store' });
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { ok: r.ok, status: r.status, json, text };
}

export async function GET() {
  try {
    // cache
    if (CACHE && Date.now() - CACHE.at < TTL_MS) {
      return NextResponse.json(CACHE.data, {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=60' },
      });
    }

    const username = process.env.GITHUB_USERNAME;
    if (!username) {
      return NextResponse.json({ ok: false, error: 'Chybí proměnná GITHUB_USERNAME' }, { status: 500 });
    }

    // user (try token, then fallback)
    let headers = buildHeaders(!!process.env.GITHUB_TOKEN);
    let userResp = await safeFetch(`https://api.github.com/users/${username}`, headers);
    if (!userResp.ok && (userResp.status === 401 || userResp.status === 403)) {
      headers = buildHeaders(false);
      userResp = await safeFetch(`https://api.github.com/users/${username}`, headers);
    }
    if (!userResp.ok) {
      const detail = userResp.json?.message ?? `GitHub API: ${userResp.text}`;
      return NextResponse.json({ ok: false, error: 'Nepodařilo se načíst uživatele', detail }, { status: 500 });
    }

    // repos
    const reposResp = await safeFetch(
      `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`,
      headers
    );
    if (!reposResp.ok || !Array.isArray(reposResp.json)) {
      const detail = reposResp.json?.message ?? `GitHub API: ${reposResp.text}`;
      return NextResponse.json({ ok: false, error: 'Nepodařilo se načíst repozitáře', detail }, { status: 500 });
    }

    const repos = reposResp.json as Repo[];
    const filtered = repos.filter(r => !r.private && !r.archived);

    const totals = filtered.reduce(
      (acc, r) => {
        acc.stars += r.stargazers_count || 0;
        acc.forks += r.forks_count || 0;
        acc.watchers += (r.stargazers_count || 0) + (r.forks_count || 0);
        if (r.language) acc.languages[r.language] = (acc.languages[r.language] || 0) + 1;
        return acc;
      },
      { stars: 0, forks: 0, watchers: 0, languages: {} as Record<string, number> }
    );

    const topLanguages = Object.entries(totals.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const latest = filtered
      .sort((a, b) => +new Date(b.pushed_at) - +new Date(a.pushed_at))
      .slice(0, 6)
      .map(r => ({
        name: r.name,
        url: r.html_url,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
      }));

    const payload: ApiResponse = {
      ok: true,
      profile: {
        login: userResp.json.login,
        name: userResp.json.name,
        avatar_url: userResp.json.avatar_url,
        html_url: userResp.json.html_url,
        followers: userResp.json.followers,
        following: userResp.json.following,
        public_repos: userResp.json.public_repos,
      },
      stats: {
        totalStars: totals.stars,
        totalForks: totals.forks,
        totalWatchers: totals.watchers,
      },
      topLanguages,
      repoCount: filtered.length,
      latest,
    };

    CACHE = { at: Date.now(), data: payload };

    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=60' },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'Neočekávaná chyba', detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
