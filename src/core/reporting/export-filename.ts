/**
 * Deterministic, ASCII-safe filename fragment for export downloads (Excel/PDF, client or server).
 * Does not include extension or product prefix; callers compose `hiiliketju_${base}.xlsx` etc.
 */
export function safeExportBasename(name: string, fallback = "scenario"): string {
  const s = name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return s.slice(0, 80) || fallback;
}
