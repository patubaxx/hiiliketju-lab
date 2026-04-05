/**
 * Zod issues use stable `validation.zod.*` message ids so the UI can localize them.
 * Unknown messages pass through (e.g. future engine strings).
 */
export function translateZodIssueMessage(
  message: string,
  t: (id: string, vars?: Record<string, string>) => string,
): string {
  return message.startsWith("validation.zod.") ? t(message) : message;
}
