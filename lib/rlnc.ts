/** GF(2) Random Linear Network Coding — the same primitive behind mump2p. */

export type Coeff = number;

export function popcount(n: number): number {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

export function gaussianRank(vectors: readonly Coeff[], k: number): number {
  const rows = vectors.filter((v) => v !== 0).map((v) => v & ((1 << k) - 1));
  let rank = 0;
  for (let col = 0; col < k; col++) {
    const bit = 1 << col;
    let pivot = -1;
    for (let i = rank; i < rows.length; i++) {
      if (rows[i] & bit) {
        pivot = i;
        break;
      }
    }
    if (pivot === -1) continue;
    const tmp = rows[rank];
    rows[rank] = rows[pivot];
    rows[pivot] = tmp;
    for (let i = 0; i < rows.length; i++) {
      if (i !== rank && rows[i] & bit) rows[i] ^= rows[rank];
    }
    rank += 1;
  }
  return rank;
}

export function isIndependent(
  existing: readonly Coeff[],
  candidate: Coeff,
  k: number
): boolean {
  if (candidate === 0) return false;
  return gaussianRank([...existing, candidate], k) > gaussianRank(existing, k);
}

export function encodeShards(
  k: number,
  n: number,
  rng: () => number
): Coeff[] {
  const shards: Coeff[] = [];
  const mask = (1 << k) - 1;
  for (let i = 0; i < k; i++) shards.push(1 << i);
  let guard = 0;
  while (shards.length < n && guard < n * 40) {
    guard += 1;
    let v = 0;
    for (let i = 0; i < k; i++) {
      if (rng() > 0.45) v |= 1 << i;
    }
    if (v === 0) v = 1 << Math.floor(rng() * k);
    v &= mask;
    if (shards.includes(v)) continue;
    shards.push(v);
  }
  while (shards.length < n) {
    shards.push(1 << (shards.length % k));
  }
  return shards;
}

export function recode(held: readonly Coeff[], rng: () => number): Coeff {
  const live = held.filter((v) => v !== 0);
  if (live.length === 0) return 0;
  if (live.length === 1) return live[0];
  let out = 0;
  let used = 0;
  for (const v of live) {
    if (rng() < 0.55) {
      out ^= v;
      used += 1;
    }
  }
  if (used === 0) out = live[Math.floor(rng() * live.length)];
  return out;
}

export function coeffLabel(coeff: Coeff, k: number): string {
  const parts: string[] = [];
  for (let i = 0; i < k; i++) {
    if (coeff & (1 << i)) parts.push(`f${i}`);
  }
  return parts.join("⊕") || "∅";
}
