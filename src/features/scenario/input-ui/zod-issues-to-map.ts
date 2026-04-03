import * as z from "zod";

export function zodIssuesToMap(error: z.ZodError): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.map(String).join(".") : "_root";
    const arr = map.get(path) ?? [];
    arr.push(issue.message);
    map.set(path, arr);
  }
  return map;
}
