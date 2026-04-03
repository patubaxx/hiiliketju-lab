/**
 * UX helper: split pasted series text into numbers.
 * Authoritative length and sign rules remain on Zod schemas.
 */
export function parseNumberSeries(text: string): { ok: true; values: number[] } | { ok: false } {
  const parts = text
    .trim()
    .split(/[\s,;]+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const values: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isFinite(n)) {
      return { ok: false };
    }
    values.push(n);
  }
  return { ok: true, values };
}

export function parseFiniteNumber(raw: string): number | undefined {
  const s = raw.trim();
  if (s === "") return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return n;
}
