import type { NextApiRequest, NextApiResponse } from "next";

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

let CACHE: { at: number; data: any } | null = null;
const TTL_MS = 1000 * 60 * 15;

async function fetchJSON(url: string, headers: Record<string, string>) {
  const r = await fetch(url, { headers });
  const text = await r.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { ok: r.ok, status: r.status, json, text };
}

function buildHeaders(withToken: boolean) {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "nextjs-portfolio-app",
  };
  if (withToken && process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (CACHE && Date.now() - CACHE.at < TTL_MS) {
      res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=60");
      return res.status(200).json(CACHE.data);
    }

    const username = process.env.GITHUB_USERNAME;
    if (!username) return res.status(500).json({ ok: false, error: "Missing GITHUB_USERNAME" });

    // 1) zkus s tokenem (pokud je), při 401/403 spadni na bez tokenu
    let headers = buildHeaders(!!process.env.GITHUB_TOKEN);
    let userResp = await fetchJSON(`https://api.github.com/users/${username}`, headers);
    if (!userResp.ok && [401, 403].includes(userResp.status)) {
      headers = buildHeaders(false);
      userResp = await fetchJSON(`https://api.github.com/users/${username}`, headers);
    }
    if (!userResp.ok) {
      const detail = userResp.json?.message || userResp.text || `HTTP ${userResp.status}`;
      return res.status(500).json({ ok: false, error: "User fetch failed", detail });
    }
    const user = userResp.json;

    const reposResp = await fetchJSON(
      `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`,
      headers
    );
    if (!reposResp.ok || !Array.isArray(reposResp.json)) {
      const detail = reposResp.json?.message || reposResp.text || `HTTP ${reposResp.status}`;
      return res.status(500).json({ ok: false, error: "Repos fetch failed", detail });
    }
    const repos: Repo[] = reposResp.json;

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

    const payload = {
      ok: true,
      profile: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        followers: user.followers,
        following: user.following,
        public_repos: user.public_repos,
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
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=60");
    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("GitHub API error:", err?.message || err);
    return res.status(500).json({ ok: false, error: "Unexpected error", detail: err?.message || String(err) });
  }
}
