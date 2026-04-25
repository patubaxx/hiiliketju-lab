import { screen, waitFor } from "@testing-library/react";
import { expect } from "vitest";

/**
 * `LocaleProvider` first-paints the server-default locale (Finnish) and applies `localStorage` in
 * `useEffect` (deferred to the next task). Tests that set `localStorage` to `en` before `render`
 * should await this so queries match English copy.
 */
export async function waitForStoredLocaleEnApplied(): Promise<void> {
  await screen.findByRole("button", { name: "Run calculation" }, { timeout: 5_000 });
  await waitFor(() => {
    expect(document.documentElement.lang).toBe("en");
  });
}
