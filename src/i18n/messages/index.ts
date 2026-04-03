import { en } from "./en";
import { fi } from "./fi";
import { sv } from "./sv";
import type { MessageTree } from "./tree";

export { en, fi, sv, type MessageTree };

export const dictionaries: Record<"en" | "fi" | "sv", MessageTree> = { en, fi, sv };
export type Locale = keyof typeof dictionaries;
export const locales: readonly Locale[] = ["en", "fi", "sv"];

/** Stable dot-path keys (e.g. `scenarioForm.title`); validated by convention, not literal types. */
export type MessageId = string;

function getLeaf(obj: unknown, parts: readonly string[]): string | undefined {
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

export function formatMessage(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);
}

export function translate(locale: Locale, id: MessageId, vars?: Record<string, string>): string {
  const dict = dictionaries[locale];
  const raw = getLeaf(dict, id.split("."));
  return formatMessage(raw ?? id, vars);
}
