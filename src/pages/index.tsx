// src/pages/index.tsx
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from 'framer-motion';

// ======= Data ===========================================
const TECH = ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'C++', 'SQL', 'C#'];

const PROJECTS = [
  {
    title: 'Netflix Clone',
    blurb: 'Volnočasový projekt',
    tech: ['Java Script', 'HTML', 'CSS', 'Tailwind'],
    href: '#',
  },
  {
    title: 'Glitch Efekt Maker',
    blurb: 'Web který vám přidá Glitch Efekt na fotku a je upravitelný',
    tech: ['Java Script', 'HTML', 'CSS', 'Tailwind'],
    href: '#',
  },
  {
    title: 'Sound Visualizer',
    blurb: 'Visualizer na MP3 Soubory nebo odkazy přes API',
    tech: ['Java Script', 'HTML', 'CSS', 'Tailwind'],
    href: '#',
  },
  {
    title: 'Dreamify',
    blurb: 'Vizualizace snů na základě vašeho popisu pomocí AI',
    tech: ['Next.js', 'PostgreSQL', 'NextAuth', 'Tailwind', 'API'],
    // ❌ původně http://localhost:3001
    href: '#', // dokud nebude veřejná HTTPS URL
  },
  {
    title: 'Moodify',
    blurb: 'Doporučená hudba na základě vaší nálady',
    tech: ['Next.js', 'PostgreSQL', 'NextAuth'],
    href: 'https://0d6a2c0b.moodify-main.pages.dev',
  },
  {
    title: 'OskKYS V1, V2',
    blurb: 'Moje předchozí portfolia',
    tech: ['Java Script', 'HTML', 'CSS', 'Tailwind'],
    href: '#',
  },
];

// ======= Anim helpers ===================================
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

// ======= Components =====================================

// Neon cursor particles
function CursorParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf = 0;

    type P = { x: number; y: number; vx: number; vy: number; life: number };
    const particles: P[] = [];

    const addParticles = (x: number, y: number) => {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 1.5 + 0.5;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 });
      }
    };

    const onMove = (e: MouseEvent) => addParticles(e.clientX, e.clientY);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life *= 0.96;

        const r = 4 * p.life + 1;
        const alpha = Math.max(0, p.life);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
        grad.addColorStop(0, `rgba(255,0,80,${alpha})`);
        grad.addColorStop(1, `rgba(255,0,80,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        if (p.life < 0.05) particles.splice(i, 1);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-0"
      style={{ filter: 'blur(0.2px)' }}
    />
  );
}

// Magnetic CTA button
function MagneticButton({
  children,
  href = '#contact',
  intensity = 24,
}: {
  children: React.ReactNode;
  href?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const reset = () => {
    animate(tx, 0, { duration: 0.35 });
    animate(ty, 0, { duration: 0.35 });
  };
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    tx.set(Math.max(-intensity, Math.min(intensity, x / 6)));
    ty.set(Math.max(-intensity, Math.min(intensity, y / 6)));
  };

  return (
    <m.a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: tx, y: ty }}
      className="relative inline-flex select-none items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-6 py-3 text-lg font-bold text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:shadow-[0_0_50px_rgba(239,68,68,0.9)] transition"
    >
      {children}
    </m.a>
  );
}

// Tech chips marquee
function TechMarquee({ speed = 16 }: { speed?: number }) {
  return (
    <div className="relative mt-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />
      <div className="overflow-hidden">
        <m.div
          className="flex gap-4"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
        >
          <div className="flex shrink-0 gap-4">
            {TECH.map((t) => (
              <span
                key={`a-${t}`}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 gap-4" aria-hidden="true">
            {TECH.map((t) => (
              <span
                key={`b-${t}`}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90"
              >
                {t}
              </span>
            ))}
          </div>
        </m.div>
      </div>
    </div>
  );
}

// Skill bar
function SkillBar({ name, pct, color }: { name: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-sm text-white/90">{name}</span>
        <span className="text-sm text-white/70">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${color} shadow-[0_0_10px_rgba(239,68,68,0.6)]`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Project card (bezpečné externí linky)
function ProjectCard({
  title,
  blurb,
  tech,
  href,
}: {
  title: string;
  blurb: string;
  tech: string[];
  href?: string;
}) {
  const url = href || '#';
  const isExternal = /^https?:\/\//i.test(url);
  return (
    <a
      href={url}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group block rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[0_0_20px_rgba(255,0,69,0.18)] backdrop-blur-lg transition hover:shadow-[0_0_40px_rgba(255,0,69,0.35)]"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-2 py-1 text-xs font-semibold text-white/95">
          Case
        </span>
      </div>
      <p className="mt-3 text-white/75">{blurb}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tech.map((t) => (
          <span
            key={t}
            className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/90 ring-1 ring-white/10"
          >
            {t}
          </span>
        ))}
      </div>
    </a>
  );
}

// Projects carousel
function ProjectsCarousel() {
  const x = useMotionValue(0);

  useEffect(() => {
    const c = animate(x, -50, {
      duration: 20,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    });
    return () => c.stop();
  }, [x]);

  return (
    <div className="relative mt-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />
      <div className="overflow-hidden">
        <m.div drag="x" style={{ x: useTransform(x, (v) => `calc(${v}% )`) }} className="flex w-max gap-4">
          <div className="flex shrink-0 gap-4">
            {PROJECTS.map((p) => (
              <div key={`first-${p.title}`} className="w-[320px]">
                <ProjectCard {...p} />
              </div>
            ))}
          </div>
          <div className="flex shrink-0 gap-4" aria-hidden="true">
            {PROJECTS.map((p) => (
              <div key={`second-${p.title}`} className="w-[320px]">
                <ProjectCard {...p} />
              </div>
            ))}
          </div>
        </m.div>
      </div>
    </div>
  );
}

// ========== GitHub Stats (PREMIUM vzhled) ================
type GithubPayload = {
  ok?: boolean;
  profile: {
    login: string;
    name: string;
    avatar_url: string;
    html_url: string;
    followers: number;
    following: number;
    public_repos: number;
  };
  stats: {
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
  };
  topLanguages: { name: string; count: number }[];
  repoCount: number;
  latest?: {
    name: string;
    url: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
  }[];
};

function Counter({ to, className }: { to: number; className?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const anchor = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(anchor, { once: true, margin: '-20% 0px -20% 0px' });

  useEffect(() => {
    if (inView) animate(mv, to, { duration: 1, ease: 'easeOut' });
  }, [inView, to]);

  return (
    <span ref={anchor}>
      <m.span className={className}>{(rounded as unknown) as string}</m.span>
    </span>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur-md">
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-tr from-rose-500/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/10 p-2 ring-1 ring-white/15">{icon}</div>
        <div className="text-sm text-white/70">{label}</div>
      </div>
      <div className="mt-3 text-3xl font-extrabold text-white">
        <Counter to={value} />
      </div>
    </div>
  );
}

const icons = {
  repo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/90">
      <path d="M7 22v-5a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 17a5 5 0 0 1 0-10V3h8a3 3 0 0 1 3 3v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/90">
      <path
        d="M12 3l2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 17.77 6.6 19.6l1.03-6.01L3.27 9.35l6.03-.88L12 3z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="currentColor"
      />
    </svg>
  ),
  fork: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/90">
      <path d="M7 3v6a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7" cy="3" r="2" fill="currentColor" />
      <circle cx="17" cy="3" r="2" fill="currentColor" />
      <circle cx="12" cy="21" r="2" fill="currentColor" />
      <path d="M12 13v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/90">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/90">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M23 21v-2a3 3 0 0 0-3-3h-2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
};

const langColors: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F1E05A',
  HTML: '#E44D26',
  CSS: '#563D7C',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#DEA584',
};

function LanguageBar({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur-md">
      <div className="mb-3 font-semibold text-white">Top jazyky</div>
      <div className="h-3 w-full overflow-hidden rounded-full ring-1 ring-white/10">
        <div className="flex h-full">
          {data.map((d) => (
            <div
              key={d.name}
              className="h-full"
              style={{
                width: `${(d.count / total) * 100}%`,
                background: `linear-gradient(90deg, ${langColors[d.name] ?? 'rgba(255,255,255,0.6)'} 0%, transparent 140%)`,
              }}
              title={`${d.name} — ${d.count} repo`}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {data.map((d) => (
          <span
            key={d.name}
            className="rounded-full px-3 py-1 text-xs text-white/90 ring-1 ring-white/15"
            style={{ background: `${(langColors[d.name] ?? '#999')}22` }}
          >
            {d.name} • {d.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function RepoCard({ r }: { r: NonNullable<GithubPayload['latest']>[number] }) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      className="group relative rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/[0.06]"
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[conic-gradient(at_120%_-20%,rgba(244,63,94,.25),transparent_30%)] opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white">{r.name}</div>
        <div className="text-xs text-white/60">{r.language ?? ''}</div>
      </div>
      {r.description && <p className="mt-2 line-clamp-2 text-sm text-white/70">{r.description}</p>}
      <div className="mt-3 flex items-center gap-4 text-sm text-white/70">
        <span className="inline-flex items-center gap-1">
          {icons.star} {r.stars}
        </span>
        <span className="inline-flex items-center gap-1">
          {icons.fork} {r.forks}
        </span>
      </div>
    </a>
  );
}

function GitHubStatsSection() {
  const [data, setData] = useState<GithubPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/github');
        const json = await res.json();
        if (!mounted) return;
        if (json?.ok === false) {
          setError(json.detail || json.error || 'GitHub API error');
          setData(null);
        } else {
          setData(json);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="github" className="relative mx-auto mt-32 max-w-6xl px-6 pb-24">
      {/* subtle gradient ring container */}
      <div className="relative rounded-3xl bg-gradient-to-br from-rose-500/40 via-white/10 to-transparent p-1">
        <div className="rounded-3xl bg-black/60 p-6 ring-1 ring-white/10 backdrop-blur-xl md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data?.profile?.avatar_url || '/vercel.svg'}
                alt="Avatar"
                className="h-14 w-14 rounded-full ring-2 ring-rose-500/40"
              />
              <div>
                <div className="font-semibold text-white">
                  {data?.profile?.name || data?.profile?.login || '—'}
                </div>
                <div className="text-sm text-white/70">@{data?.profile?.login || '—'}</div>
              </div>
            </div>

            <a
              href={data?.profile?.html_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2 font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.6)] hover:shadow-[0_0_36px_rgba(239,68,68,0.9)]"
            >
              Otevřít GitHub
            </a>
          </div>

          {/* Loading / error */}
          {error && <p className="mt-6 text-center text-rose-300">Chyba při načítání GitHub dat: {error}</p>}
          {!error && !data && (
            <div className="mt-8 grid animate-pulse gap-4 md:grid-cols-3">
              <div className="h-28 rounded-2xl bg-white/5" />
              <div className="h-28 rounded-2xl bg-white/5" />
              <div className="h-28 rounded-2xl bg-white/5" />
            </div>
          )}

          {data && (
            <>
              {/* Stats */}
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Stat icon={icons.repo} label="Public repo" value={data.profile.public_repos} />
                <Stat icon={icons.star} label="Celkem ⭐" value={data.stats.totalStars} />
                <Stat icon={icons.fork} label="Forky" value={data.stats.totalForks} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Stat icon={icons.eye} label="Watchers (součet)" value={data.stats.totalWatchers} />
                <Stat icon={icons.repo} label="Repo " value={data.repoCount} />
                <Stat icon={icons.users} label="Followers" value={data.profile.followers} />
              </div>

              {/* Languages */}
              <div className="mt-8">
                <LanguageBar data={data.topLanguages} />
              </div>

              {/* Latest repos */}
              {data.latest && data.latest.length > 0 && (
                <div className="mt-8">
                  <div className="mb-3 font-semibold text-white">Poslední repozitáře</div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.latest.map((r) => (
                      <RepoCard key={r.url} r={r} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ======= Page ===========================================
export default function HomePage() {
  return (
    <>
      <Head>
        <title>OSKAR — Full-Stack Developer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Tvořím moderní webové aplikace. Od nápadu po hotový produkt."
        />
      </Head>

      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute inset-0 animate-pulse opacity-40 [background:radial-gradient(1000px_600px_at_70%_10%,rgba(239,68,68,0.35),transparent_60%),radial-gradient(800px_500px_at_20%_30%,rgba(244,63,94,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      {/* Neon cursor particles */}
      <CursorParticles />

      <LazyMotion features={domAnimation}>
        {/* NAV */}
        <div className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <a href="#home" className="text-lg font-semibold tracking-tight text-white md:text-4xl">
              OSKAR
            </a>
            <nav className="hidden gap-6 md:flex">
              <a href="#about" className="text-white/80 hover:text-white">
                O mně
              </a>
              <a href="#projects" className="text-white/80 hover:text-white">
                Projekty
              </a>
              <a href="#contact" className="text-white/80 hover:text-white">
                Kontakt
              </a>
            </nav>
            <MagneticButton href="#contact">Pojďme spolupracovat</MagneticButton>
          </div>
        </div>

        {/* HERO */}
        <header id="home" className="mx-auto max-w-6xl px-6 pb-12 pt-20">
          <div className="flex items-center gap-8">
            <m.h1 {...fadeUp} className="text-5xl font-extrabold tracking-tight text-white md:text-7xl">
              FULL STACK{' '}
              <span className="text-rose-400 [text-shadow:_0_0_8px_rgba(255,0,0,0.9),_0_0_20px_rgba(255,0,0,0.8),_0_0_40px_rgba(255,0,0,0.6)]">
                DEVELOPER
              </span>
            </m.h1>

            <div className="relative -translate-y-1 h-28 w-28 overflow-hidden rounded-full border-4 border-red-500 shadow-[0_0_80px_15px_rgba(239,68,68,0.8)] md:h-46 md:w-48">
              <Image
                src="/profile.jpg"
                alt="Profile"
                fill
                priority
                sizes="(max-width: 768px) 7rem, 9rem"
                className="object-cover"
              />
            </div>
          </div>

          {/* Neon scanner line */}
          <m.div
            initial={{ x: 0 }}
            animate={{ x: [0, 80, 0] }}
            transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
            className="mt-4 h-[5px] w-60 rounded-full bg-gradient-to-r from-red-500 via-rose-400 to-red-500 shadow-[0_0_28px_8px_rgba(255,0,69,0.9)] sm:w-60 md:w-80 lg:w-96"
          />

          <m.p {...fadeUp} className="mt-6 max-w-xl text-lg text-white/75">
            AHOY! Vytvářím webové aplikace, které prostě fungují. Od nápadu po hotový produkt – důraz
            na rychlost, čistý kód a krásné UI.
          </m.p>

          <TechMarquee speed={16} />
        </header>

        {/* ABOUT + SKILLS */}
        <section id="about" className="mx-auto mt-24 flex max-w-6xl flex-col gap-12 px-6 py-20">
          <m.h2 {...fadeUp} className="mt-110 text-center text-3xl font-semibold tracking-tight text-white md:text-left">
            O mně
          </m.h2>

          <div className="flex flex-col items-start gap-12 md:flex-row">
            {/* LEFT SIDE */}
            <div className="flex-1 space-y-6">
              <p className="text-lg leading-relaxed text-white/80">
                Jsem vývojář s více než{' '}
                <span className="font-semibold text-white">2 roky zkušeností</span> v oblasti webového
                vývoje a Roblox developingu. Specializuji se na{' '}
                <span className="font-semibold text-rose-400">C++</span>,{' '}
                <span className="font-semibold text-rose-400">Next.js</span>,{' '}
                <span className="font-semibold text-rose-400">C#</span> a tvorbu kvalitních řešení.
              </p>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full flex-1 space-y-6">
              <h3 className="text-2xl font-semibold text-white">Dovednosti</h3>
              <SkillBar
                name="Frontend Development"
                pct={90}
                color="from-red-500 via-rose-400 to-red-500 shadow-[0_0_18px_8px_rgba(200,0,69,0.9)]"
              />
              <SkillBar
                name="Backend Development"
                pct={68}
                color="from-red-500 via-rose-400 to-red-500 shadow-[0_0_18px_8px_rgba(200,0,69,0.9)]"
              />
              <SkillBar
                name="Roblox Developing"
                pct={32}
                color="from-red-500 via-rose-400 to-red-500 shadow-[0_0_18px_8px_rgba(200,0,69,0.9)]"
              />
              <SkillBar
                name="UI/UX Design"
                pct={75}
                color="from-red-500 via-rose-400 to-red-500 shadow-[0_0_18px_8px_rgba(200,0,69,0.9)]"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative mt-28 mb-28 flex w-full justify-center">
          <div className="absolute left-1/2 top-1/2 h-[320px] w-[90%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-red-600/40 opacity-50 blur-[24px]" />
          <div className="relative mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/60 px-8 py-16 shadow-[0_0_30px_rgba(239,68,68,0.5)] backdrop-blur-xl">
            <m.h2
              {...fadeUp}
              className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,0,69,0.6)] md:text-5xl"
            >
              Máte <span className="text-rose-400">nápad</span> na projekt? <br />
              Pojďme ho <span className="text-rose-500">proměnit v realitu</span>! 🚀
            </m.h2>

            <m.p {...fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
              Připravím pro vás <span className="text-white">moderní web</span>,
              <span className="text-white"> unikátní design</span> a
              <span className="text-white"> rychlý kód</span>, který zaujme na první pohled.
            </m.p>

            <div className="mt-10">
              <MagneticButton href="#contact">🚀 Začít spolupráci</MagneticButton>
            </div>
          </div>
        </section>

        {/* Projects carousel */}
        <section id="projects" className="mx-auto mt-55 max-w-6xl px-6 py-16">
          <m.h2 {...fadeUp} className="text-3xl font-semibold tracking-tight text-white">
            Moje projekty
          </m.h2>
          <ProjectsCarousel />
        </section>

        {/* GitHub — premium sekce */}
        <GitHubStatsSection />

        {/* CONTACT */}
        <section id="contact" className="mx-auto mt-25 max-w-6xl px-6 pb-20">
          <m.h2 {...fadeUp} className="text-3xl font-semibold tracking-tight text-white">
            Kontakt
          </m.h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <div className="text-sm text-white/60">Email</div>
              <div className="mt-1 text-white">oskk1s@seznam.cz</div>
              <a
                href="mailto:oskk1s@seznam.cz"
                className="mt-4 inline-block rounded-xl bg-white/10 px-4 py-2 text-white hover:bg-white/15"
              >
                Napište mi
              </a>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <div className="text-sm text-white/60">Discord</div>
              <div className="mt-1 text-white">pozky25</div>
              {/* ✅ oficiální URL/externí odkaz */}
              <a
                href="https://discordapp.com/users/pozky25"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-xl bg-white/10 px-4 py-2 text-white hover:bg-white/15"
              >
                Otevřít
              </a>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 p-[1px]">
              <div className="h-full rounded-2xl bg-black p-6">
                <div className="text-sm text-white/80">Kontaktujte mě ještě dnes</div>
                <div className="mt-6 text-white" />
                <MagneticButton href="mailto:oskk1s@seznam.cz">🚀 Pojďme spolupracovat</MagneticButton>
              </div>
            </div>
          </div>
        </section>
      </LazyMotion>

      {/* FOOTER */}
      <footer className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-white/60 md:flex-row">
          <div>© {new Date().getFullYear()} Oskar — Všechna práva vyhrazena</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white">
              CZ
            </a>
            <span className="opacity-20">/</span>
            <a href="#" className="hover:text-white">
              EN
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
