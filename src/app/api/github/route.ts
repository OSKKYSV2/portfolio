import { NextResponse } from "next/server";

type Repo = {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at?: string;
};

export async function GET() {
  try {
    const username = process.env.GITHUB_USERNAME;
    if (!username) {
      return NextResponse.json(
        { ok: false, detail: "Missing GITHUB_USERNAME env" },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = { "User-Agent": "next-portfolio" };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const base = "https://api.github.com";

    // 1) profil
    const profileResp = await fetch(`${base}/users/${username}`, { headers });
    if (!profileResp.ok) {
      const text = await profileResp.text();
      return NextResponse.json(
        { ok: false, detail: text || "Profile fetch failed" },
        { status: profileResp.status }
      );
    }
    const profile = await profileResp.json();

    // 2) všechny public repos (paginace)
    let page = 1;
    const repos: Repo[] = [];
    while (true) {
      const r = await fetch(`${base}/users/${username}/repos?per_page=100&page=${page}`, {
        headers,
      });
      if (!r.ok) {
        const text = await r.text();
        return NextResponse.json(
          { ok: false, detail: text || "Repos fetch failed" },
          { status: r.status }
        );
      }
      const chunk: Repo[] = await r.json();
      repos.push(...chunk);
      const link = r.headers.get("link") || "";
      const hasNext = /\brel="next"/.test(link);
      if (!hasNext || chunk.length === 0) break;
      page++;
    }

    // 3) souhrnné statistiky
    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
    const totalWatchers = 0;

    // 4) top jazyky (počtem repo)
    const counts = new Map<string, number>();
    repos.forEach((r) => {
      const lang = r.language || "Other";
      counts.set(lang, (counts.get(lang) || 0) + 1);
    });
    const topLanguages = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 5) poslední repozitáře
    const latest = repos
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        url: r.html_url,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
      }));

    return NextResponse.json({
      ok: true,
      profile: {
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        html_url: profile.html_url,
        followers: profile.followers,
        following: profile.following,
        public_repos: profile.public_repos,
      },
      stats: { totalStars, totalForks, totalWatchers },
      topLanguages,
      repoCount: repos.length,
      latest,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 300;
