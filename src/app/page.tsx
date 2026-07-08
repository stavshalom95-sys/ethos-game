'use client';

import { useState, useEffect } from 'react';
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

// ─── localStorage helpers ─────────────────────────────────────────────────────

function storageKey(id: number) {
  return `ethos_votes_${id}`;
}

function loadVotes(dilemma: Dilemma): VoteData {
  try {
    const raw = localStorage.getItem(storageKey(dilemma.id));
    if (raw) return JSON.parse(raw) as VoteData;
  } catch {
    // ignore storage errors (e.g. private mode)
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

function ProgressBar({ percent, color }: { percent: number; color: 'emerald' | 'red' }) {
  const bg = color === 'emerald' ? 'bg-emerald-500' : 'bg-red-500';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [gameState, setGameState] = useState<GameState>('question');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const dilemma = dilemmas[currentIndex];

  // Hydrate on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load votes from localStorage whenever the dilemma changes
  useEffect(() => {
    if (!mounted) return;
    const votes = loadVotes(dilemma);
    setVoteData(votes);
    setGameState(votes.userVote ? 'results' : 'question');
  }, [currentIndex, mounted, dilemma]);

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

  const handleNext = () => {
    setCurrentIndex((i) => (i + 1) % dilemmas.length);
  };

  const handleShare = async () => {
    if (!voteData?.userVote) return;
    const total = voteData.yes + voteData.no;
    const yesPercent = total === 0 ? 0 : Math.round((voteData.yes / total) * 100);
    const noPercent = 100 - yesPercent;
    const choice = voteData.userVote === 'yes' ? dilemma.optionA : dilemma.optionB;

    const text = [
      `🎭 Ethos`,
      ``,
      `${dilemma.question}`,
      ``,
      `My pick: ${choice}`,
      ``,
      `Results:`,
      `${dilemma.optionA} — ${yesPercent}%`,
      `${dilemma.optionB} — ${noPercent}%`,
      ``,
      `What would you pick? 👇`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard access may be denied
    }
  };

  // Prevent SSR/hydration mismatch for localStorage-dependent state
  if (!mounted || !voteData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
      </main>
    );
  }

  const total = voteData.yes + voteData.no;
  const yesPercent = total === 0 ? 0 : Math.round((voteData.yes / total) * 100);
  const noPercent = total === 0 ? 0 : 100 - yesPercent;

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      {/* ── Header ── */}
      <header className="w-full max-w-md text-center mb-10">
        <p className="text-xs font-semibold tracking-[0.25em] text-zinc-600 uppercase mb-2">
          Game
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          Ethos
        </h1>
        <p className="mt-2 text-zinc-500 text-sm">Moral dilemmas</p>
      </header>

      {/* ── Card ── */}
      <section className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        {/* Dilemma counter + question */}
        <div className="mb-7">
          <span className="inline-block text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-3">
            {currentIndex + 1} / {dilemmas.length}
          </span>
          <h2 className="text-xl font-bold text-white leading-relaxed">
            {dilemma.question}
          </h2>
        </div>

        {/* ── Question state ── */}
        {gameState === 'question' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleVote('yes')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all duration-150 text-base"
            >
              {dilemma.optionA}
            </button>
            <button
              onClick={() => handleVote('no')}
              className="flex-1 bg-red-700 hover:bg-red-600 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all duration-150 text-base"
            >
              {dilemma.optionB}
            </button>
          </div>
        )}

        {/* ── Results state ── */}
        {gameState === 'results' && (
          <div className="animate-fade-up space-y-5">
            <span className="inline-block text-[10px] font-semibold tracking-widest text-zinc-600 uppercase">
              Results
            </span>

            {/* Option A result */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold flex items-center gap-1.5 ${voteData.userVote === 'yes' ? 'text-emerald-400' : 'text-zinc-300'}`}>
                  {dilemma.optionA}
                  {voteData.userVote === 'yes' && (
                    <span className="text-[10px] font-normal text-emerald-600 bg-emerald-950 border border-emerald-900 px-1.5 py-0.5 rounded-full">
                      your pick
                    </span>
                  )}
                </span>
                <span className="font-bold text-white tabular-nums">{yesPercent}%</span>
              </div>
              <ProgressBar percent={yesPercent} color="emerald" />
            </div>

            {/* Option B result */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold flex items-center gap-1.5 ${voteData.userVote === 'no' ? 'text-red-400' : 'text-zinc-300'}`}>
                  {dilemma.optionB}
                  {voteData.userVote === 'no' && (
                    <span className="text-[10px] font-normal text-red-600 bg-red-950 border border-red-900 px-1.5 py-0.5 rounded-full">
                      your pick
                    </span>
                  )}
                </span>
                <span className="font-bold text-white tabular-nums">{noPercent}%</span>
              </div>
              <ProgressBar percent={noPercent} color="red" />
            </div>

            {total > 0 && (
              <p className="text-zinc-700 text-xs text-center pt-1">
                {total.toLocaleString()} votes
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleShare}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all duration-150 text-sm"
              >
                {copied ? '✓ Copied' : 'Share'}
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-white hover:bg-zinc-100 active:scale-95 text-zinc-900 font-bold py-3 rounded-xl transition-all duration-150 text-sm"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="mt-10 text-zinc-800 text-xs text-center">
        Ethos © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
