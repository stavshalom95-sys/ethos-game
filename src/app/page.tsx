'use client';

import { useState, useEffect, useMemo } from 'react';
import { dilemmas } from '@/data/dilemmas';

// ─── Types ───────────────────────────────────────────────────────────────────

type Dilemma = (typeof dilemmas)[number];
type GameState = 'question' | 'results';
type Vote = 'yes' | 'no';

interface VoteData {
  yes: number;
  no: number;
  userVote?: Vote;
}

// ─── CET Reset Logic ──────────────────────────────────────────────────────────
// Dilemmas rotate at 10:00 AM Europe/Berlin (CET/CEST) every day.
// Launch anchor: July 8 2026 10:00 AM CEST = 08:00 UTC → index 0.

const LAUNCH_RESET_MS = Date.UTC(2026, 6, 8, 8, 0, 0);

function getNextResetDate(): Date {
  const now = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Berlin',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
    }).formatToParts(now).map((p) => [p.type, p.value])
  );
  const berlinSecsNow =
    parseInt(parts.hour) * 3600 + parseInt(parts.minute) * 60 + parseInt(parts.second);
  let secsUntil = 10 * 3600 - berlinSecsNow;
  if (secsUntil <= 0) secsUntil += 86_400;
  return new Date(now.getTime() + secsUntil * 1000);
}

function getDilemmaDay(): number {
  const lastResetMs = getNextResetDate().getTime() - 86_400_000;
  return Math.max(0, Math.floor((lastResetMs - LAUNCH_RESET_MS) / 86_400_000));
}

function getDailyDilemma(): Dilemma {
  return dilemmas[getDilemmaDay() % dilemmas.length];
}

function getTimeUntilReset() {
  const diff = getNextResetDate().getTime() - Date.now();
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// ─── localStorage: Votes ─────────────────────────────────────────────────────

function voteKey(day: number) { return `ethos_daily_${day}`; }

function loadVotes(day: number): VoteData {
  try {
    const raw = localStorage.getItem(voteKey(day));
    if (raw) return JSON.parse(raw) as VoteData;
  } catch { /* ignore */ }
  return { yes: 0, no: 0 };
}

function persistVotes(day: number, data: VoteData) {
  try { localStorage.setItem(voteKey(day), JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── localStorage: Streak ────────────────────────────────────────────────────

function loadAndUpdateStreak(dilemmaDay: number): number {
  try {
    const lastDay = parseInt(localStorage.getItem('ethos_streak_last') ?? '-999');
    const count   = parseInt(localStorage.getItem('ethos_streak_count') ?? '0');

    if (lastDay === dilemmaDay) {
      return count; // already counted today
    }
    const newCount = lastDay === dilemmaDay - 1 ? count + 1 : 1;
    localStorage.setItem('ethos_streak_last',  String(dilemmaDay));
    localStorage.setItem('ethos_streak_count', String(newCount));
    return newCount;
  } catch {
    return 1;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ percent, color }: { percent: number; color: 'blue' | 'green' }) {
  const bg = color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';
  return (
    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${bg} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const [voteData,   setVoteData]   = useState<VoteData | null>(null);
  const [gameState,  setGameState]  = useState<GameState>('question');
  const [streak,     setStreak]     = useState(0);
  const [copied,     setCopied]     = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [countdown,  setCountdown]  = useState<ReturnType<typeof getTimeUntilReset> | null>(null);

  const dilemmaDay = useMemo(() => getDilemmaDay(), []);
  const dilemma    = useMemo(() => getDailyDilemma(), []);

  // Yesterday's dilemma for Host's Take (only available after day 0)
  const yesterdayDilemma = useMemo(
    () => dilemmaDay > 0 ? dilemmas[(dilemmaDay - 1) % dilemmas.length] : null,
    [dilemmaDay]
  );

  // Hydrate: votes + streak
  useEffect(() => {
    const votes = loadVotes(dilemmaDay);
    setVoteData(votes);
    if (votes.userVote) setGameState('results');
    setStreak(loadAndUpdateStreak(dilemmaDay));
    setMounted(true);
  }, [dilemmaDay]);

  // Countdown to 10:00 AM CET
  useEffect(() => {
    setCountdown(getTimeUntilReset());
    const id = setInterval(() => setCountdown(getTimeUntilReset()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleVote = (vote: Vote) => {
    if (!voteData || voteData.userVote) return;
    const updated: VoteData = {
      yes: voteData.yes + (vote === 'yes' ? 1 : 0),
      no:  voteData.no  + (vote === 'no'  ? 1 : 0),
      userVote: vote,
    };
    persistVotes(dilemmaDay, updated);
    setVoteData(updated);
    setGameState('results');
  };

  const handleShare = async () => {
    if (!voteData?.userVote) return;
    const total = voteData.yes + voteData.no;
    const myVotes = voteData.userVote === 'yes' ? voteData.yes : voteData.no;
    const userPickPercent = total === 0 ? 0 : Math.round((myVotes / total) * 100);
    const standing = userPickPercent >= 50 ? 'majority' : 'minority';
    const link = typeof window !== 'undefined' ? window.location.href : 'https://ethos-game.vercel.app';

    const text = [
      `🎭 Ethos Daily Dilemma`,
      ``,
      `"${dilemma.question}"`,
      ``,
      `I'm in the ${standing}! ${userPickPercent}% of people agree with me.`,
      ``,
      `What's your pick? ${link}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard may be denied */ }
  };

  // Spinner during hydration
  if (!mounted || !voteData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin" />
      </main>
    );
  }

  const total = voteData.yes + voteData.no;
  const yesPercent = total === 0 ? 0 : Math.round((voteData.yes / total) * 100);
  const noPercent  = total === 0 ? 0 : 100 - yesPercent;
  const userPickPercent = voteData.userVote === 'yes' ? yesPercent : noPercent;
  const isMajority = userPickPercent >= 50;
  const verdict = voteData.userVote === 'yes' ? dilemma.verdictA : dilemma.verdictB;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">

      {/* ── Header ── */}
      <header className="w-full max-w-md text-center mb-8">
        <p className="text-[11px] font-bold tracking-[0.3em] text-blue-500 uppercase mb-1">
          Daily Dilemma
        </p>

        {/* Title + streak badge on same row */}
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">ETHOS</h1>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-950 border border-orange-900 rounded-full px-2.5 py-1 text-xs font-bold text-orange-400 mb-1 self-end">
              🔥 {streak}
            </div>
          )}
        </div>

        <p className="text-zinc-600 text-xs mt-1">{today}</p>

        {/* Countdown */}
        <div className="pt-3">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-zinc-500 text-xs">Next dilemma at 10:00 AM CET in</span>
            <span className="font-mono font-bold text-white text-sm tracking-wider">
              {countdown
                ? `${pad(countdown.h)}:${pad(countdown.m)}:${pad(countdown.s)}`
                : '--:--:--'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Card ── */}
      <section className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">

        <div className="mb-7">
          <span className="inline-block text-[10px] font-bold tracking-widest text-blue-500 uppercase mb-3">
            Today&apos;s Question
          </span>
          <h2 className="text-2xl font-extrabold text-white leading-snug">
            {dilemma.question}
          </h2>
        </div>

        {/* ── Voting state ── */}
        {gameState === 'question' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleVote('yes')}
              className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl text-base
                transition-all duration-200 active:scale-95
                shadow-[0_0_18px_rgba(59,130,246,0.55)]
                hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.85)]"
            >
              {dilemma.optionA}
            </button>
            <button
              onClick={() => handleVote('no')}
              className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-xl text-base
                transition-all duration-200 active:scale-95
                shadow-[0_0_18px_rgba(16,185,129,0.55)]
                hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.85)]"
            >
              {dilemma.optionB}
            </button>
          </div>
        )}

        {/* ── Results state ── */}
        {gameState === 'results' && (
          <div className="space-y-4">
            <span className="inline-block text-[10px] font-bold tracking-widest text-blue-500 uppercase">
              Results
            </span>

            {/* Option A */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold flex items-center gap-1.5 ${voteData.userVote === 'yes' ? 'text-blue-400' : 'text-zinc-400'}`}>
                  {dilemma.optionA}
                  {voteData.userVote === 'yes' && (
                    <span className="text-[10px] font-normal text-blue-400 bg-blue-950 border border-blue-900 px-1.5 py-0.5 rounded-full">
                      your pick
                    </span>
                  )}
                </span>
                <span className="font-bold text-white tabular-nums">{yesPercent}%</span>
              </div>
              <ProgressBar percent={yesPercent} color="blue" />
            </div>

            {/* Option B */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold flex items-center gap-1.5 ${voteData.userVote === 'no' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {dilemma.optionB}
                  {voteData.userVote === 'no' && (
                    <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950 border border-emerald-900 px-1.5 py-0.5 rounded-full">
                      your pick
                    </span>
                  )}
                </span>
                <span className="font-bold text-white tabular-nums">{noPercent}%</span>
              </div>
              <ProgressBar percent={noPercent} color="green" />
            </div>

            {/* Majority / Minority */}
            <div className={`rounded-xl px-4 py-3 text-center border ${
              isMajority
                ? 'bg-blue-950 border-blue-900 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                : 'bg-zinc-800 border-zinc-700'
            }`}>
              <p className={`font-bold text-sm ${isMajority ? 'text-blue-400' : 'text-zinc-300'}`}>
                {isMajority ? '🏆 You are in the Majority!' : '⚡ You are in the Minority!'}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {userPickPercent}% of people voted the same as you.
              </p>
            </div>

            {/* ── Personality Verdict ── */}
            <div className="rounded-xl px-4 py-3 border bg-violet-950 border-violet-900 shadow-[0_0_18px_rgba(139,92,246,0.1)]">
              <p className="text-[10px] font-bold tracking-widest text-violet-400 uppercase mb-1">
                🧠 Your Vibe
              </p>
              <p className="text-white text-sm font-medium leading-relaxed">
                {verdict}
              </p>
            </div>

            {/* ── Host's Take ── */}
            {yesterdayDilemma && (
              <div className="rounded-xl px-4 py-3 border bg-zinc-800/60 border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🎙️</span>
                  <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    Host&apos;s Take
                  </p>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  &ldquo;{yesterdayDilemma.hostTake}&rdquo;
                </p>
                <p className="text-zinc-600 text-xs mt-2">
                  — On yesterday&apos;s: {yesterdayDilemma.question}
                </p>
              </div>
            )}

            {total > 0 && (
              <p className="text-zinc-700 text-xs text-center">
                {total.toLocaleString()} votes today
              </p>
            )}

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-95
                text-white font-semibold py-3 rounded-xl
                transition-all duration-150 text-sm border border-zinc-700"
            >
              {copied ? '✓ Copied to clipboard' : '🔗 Share your result'}
            </button>
          </div>
        )}
      </section>

      <footer className="mt-10 text-zinc-800 text-xs text-center">
        Ethos © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
