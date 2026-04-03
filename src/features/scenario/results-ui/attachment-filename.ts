/** Parse `Content-Disposition: attachment; filename="..."` from export API responses. */
export function attachmentFilenameFromHeader(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  const m = /filename="([^"]+)"/.exec(contentDisposition);
  return m?.[1] ?? fallback;
}
