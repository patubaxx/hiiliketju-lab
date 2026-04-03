/** Filename-safe fragment for client-side export downloads (Excel/PDF). */
export function safeExportBasename(name: string, fallback = "scenario"): string {
  const s = name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return s.slice(0, 80) || fallback;
}
