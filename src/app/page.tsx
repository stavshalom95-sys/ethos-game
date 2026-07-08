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

// ─── Daily dilemma helpers ────────────────────────────────────────────────────

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDailyDilemma(): Dilemma {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return dilemmas[dayOfYear % dilemmas.length];
}

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function storageKey(id: number): string {
  return `ethos_daily_${getTodayString()}_${id}`;
}

function loadVotes(dilemma: Dilemma): VoteData {
  try {
    const raw = localStorage.getItem(storageKey(dilemma.id));
    if (raw) return JSON.parse(raw) as VoteData;
  } catch {
    // ignore storage errors
  }
  return { yes: 0, no: 0 };
}

function persistVotes(dilemma: Dilemma, data: VoteData) {
  try {
    localStorage.setItem(storageKey(dilemma.id), JSON.stringify(data));
  } catch {
    // ignore
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
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [gameState, setGameState] = useState<GameState>('question');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<ReturnType<typeof getTimeUntilMidnight> | null>(null);

  // Stable reference — same dilemma for the entire day
  const dilemma = useMemo(() => getDailyDilemma(), []);

  // Hydrate: load today's saved vote from localStorage
  useEffect(() => {
    const votes = loadVotes(dilemma);
    setVoteData(votes);
    if (votes.userVote) setGameState('results');
    setMounted(true);
  }, [dilemma]);

  // Countdown timer — ticks every second
  useEffect(() => {
    setCountdown(getTimeUntilMidnight());
    const id = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleVote = (vote: Vote) => {
    if (!voteData || voteData.userVote) return;
    const updated: VoteData = {
      yes: voteData.yes + (vote === 'yes' ? 1 : 0),
      no: voteData.no + (vote === 'no' ? 1 : 0),
      userVote: vote,
    };
    persistVotes(dilemma, updated);
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
    } catch {
      // clipboard access may be denied
    }
  };

  // Show spinner until client hydration is complete
  if (!mounted || !voteData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin" />
      </main>
    );
  }

  const total = voteData.yes + voteData.no;
  const yesPercent = total === 0 ? 0 : Math.round((voteData.yes / total) * 100);
  const noPercent = total === 0 ? 0 : 100 - yesPercent;
  const userPickPercent = voteData.userVote === 'yes' ? yesPercent : noPercent;
  const standing = userPickPercent >= 50 ? 'Majority' : 'Minority';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">

      {/* ── Header ── */}
      <header className="w-full max-w-md text-center mb-8 space-y-1">
        <p className="text-[11px] font-bold tracking-[0.3em] text-blue-500 uppercase">
          Daily Dilemma
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          ETHOS
        </h1>
        <p className="text-zinc-600 text-xs">{today}</p>

        {/* Countdown pill */}
        <div className="pt-3">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-zinc-500 text-xs">Next dilemma in</span>
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

        {/* Question */}
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
          <div className="space-y-5">
            <span className="inline-block text-[10px] font-bold tracking-widest text-blue-500 uppercase">
              Results
            </span>

            {/* Option A bar */}
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

            {/* Option B bar */}
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

            {/* Majority / Minority banner */}
            <div className={`rounded-xl px-4 py-3 text-center border ${
              standing === 'Majority'
                ? 'bg-blue-950 border-blue-900 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                : 'bg-zinc-800 border-zinc-700'
            }`}>
              <p className={`font-bold text-sm ${standing === 'Majority' ? 'text-blue-400' : 'text-zinc-300'}`}>
                You are in the {standing}!
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {userPickPercent}% of people voted the same as you.
              </p>
            </div>

            {total > 0 && (
              <p className="text-zinc-700 text-xs text-center">
                {total.toLocaleString()} votes
              </p>
            )}

            {/* Share button */}
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
