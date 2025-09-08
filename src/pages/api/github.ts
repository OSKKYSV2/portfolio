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

type ApiResponse = {
  ok: boolean;
  error?: string;
  detail?: string;
  profile?: any;
  stats?: {
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
  };
  topLanguages?: { name: string; count: number }[];
  repoCount?: number;
  latest?: {
    name: string;
    url: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
  }[];
};


const TTL_MS = 1000 * 60 * 15; // cache 15 minut
let CACHE: { at: number; data: ApiResponse } | null = null;

/** Jednoduchý fetch s kontrolou JSON vs HTML odpovědi */
async function safeFetch(url: string, headers: Record<string, string>) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  let json: any = null;

  try {
    json = JSON.parse(text);
  } catch {
    // Pokud GitHub vrátí HTML místo JSONu
    return { ok: false, status: response.status, json: null, text };
  }

  return { ok: response.ok, status: response.status, json, text };
}

/** Postaví GitHub API hlavičky, s tokenem pokud je k dispozici */
function buildHeaders(withToken: boolean) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "nextjs-portfolio-app",
  };

  if (withToken && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    // 1) Použij cache, pokud je čerstvá
    if (CACHE && Date.now() - CACHE.at < TTL_MS) {
      res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=60");
      return res.status(200).json(CACHE.data);
    }

    const username = process.env.GITHUB_USERNAME;
    if (!username) {
      return res.status(500).json({ ok: false, error: "Chybí proměnná GITHUB_USERNAME" });
    }

    // 2) Zkus fetch uživatele s tokenem
    let headers = buildHeaders(!!process.env.GITHUB_TOKEN);
    let userResp = await safeFetch(`https://api.github.com/users/${username}`, headers);

    // Pokud token selže (401 nebo 403), zkus bez tokenu
    if (!userResp.ok && [401, 403].includes(userResp.status)) {
      headers = buildHeaders(false);
      userResp = await safeFetch(`https://api.github.com/users/${username}`, headers);
    }

    // Pokud i tak selže, vrať detail chyby
    if (!userResp.ok) {
      const detail = userResp.json?.message || `GitHub API: ${userResp.text}`;
      return res.status(500).json({ ok: false, error: "Nepodařilo se načíst uživatele", detail });
    }

    const user = userResp.json;

    // 3) Načti repozitáře
    const reposResp = await safeFetch(
      `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`,
      headers
    );

    if (!reposResp.ok || !Array.isArray(reposResp.json)) {
      const detail = reposResp.json?.message || `GitHub API: ${reposResp.text}`;
      return res.status(500).json({ ok: false, error: "Nepodařilo se načíst repozitáře", detail });
    }

    const repos: Repo[] = reposResp.json;

    // 4) Filtrovat repozitáře (jen veřejné a nearchivované)
    const filtered = repos.filter((r) => !r.private && !r.archived);

    // 5) Statistiky hvězdiček, forků a jazyků
    const totals = filtered.reduce(
      (acc, r) => {
        acc.stars += r.stargazers_count || 0;
        acc.forks += r.forks_count || 0;
        acc.watchers += (r.stargazers_count || 0) + (r.forks_count || 0);

        if (r.language) {
          acc.languages[r.language] = (acc.languages[r.language] || 0) + 1;
        }
        return acc;
      },
      { stars: 0, forks: 0, watchers: 0, languages: {} as Record<string, number> }
    );

    // 6) Top 5 jazyků
    const topLanguages = Object.entries(totals.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 7) Nejnovější repozitáře
    const latest = filtered
      .sort((a, b) => +new Date(b.pushed_at) - +new Date(a.pushed_at))
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        url: r.html_url,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
      }));

    // 8) Finální payload
    const payload: ApiResponse = {
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

    // 9) Cache
    CACHE = { at: Date.now(), data: payload };

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=60");
    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("GitHub API error:", err?.message || err);
    return res.status(500).json({
      ok: false,
      error: "Neočekávaná chyba",
      detail: err?.message || String(err),
    });
  }
}
