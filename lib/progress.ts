import type { DebriefScore } from "@/lib/types";

const KEY = "optimum-relay-progress-v1";

export interface ProgressState {
  cleared: string[];
  best: Record<string, DebriefScore>;
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return { cleared: [], best: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { cleared: [], best: {} };
    return JSON.parse(raw) as ProgressState;
  } catch {
    return { cleared: [], best: {} };
  }
}

export function saveScore(score: DebriefScore): ProgressState {
  const current = loadProgress();
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
