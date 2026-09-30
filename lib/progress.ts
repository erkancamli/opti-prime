import type { DebriefScore } from "@/lib/types";

const KEY = "optimum-relay-progress-v1";

export interface ProgressState {
  cleared: string[];
  best: Record<string, DebriefScore>;
}

const EMPTY_PROGRESS: ProgressState = { cleared: [], best: {} };
let cachedRaw: string | null = null;
let cachedProgress: ProgressState = EMPTY_PROGRESS;

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    if (raw === cachedRaw) return cachedProgress;
    cachedRaw = raw;
    cachedProgress = JSON.parse(raw) as ProgressState;
    return cachedProgress;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveScore(score: DebriefScore): ProgressState {
  const loaded = loadProgress();
  const current: ProgressState = {
    cleared: [...loaded.cleared],
    best: { ...loaded.best },
  };
  if (score.won && !current.cleared.includes(score.missionId)) {
    current.cleared.push(score.missionId);
  }
  const prev = current.best[score.missionId];
  const better =
    !prev ||
    (score.won && !prev.won) ||
    (score.coverageMump > prev.coverageMump && score.won === prev.won);
  if (better) current.best[score.missionId] = score;
  window.localStorage.setItem(KEY, JSON.stringify(current));
  return current;
}
