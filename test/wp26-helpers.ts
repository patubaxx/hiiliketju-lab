import { waitFor } from "@testing-library/react";
import { expect } from "vitest";

export async function waitForEnLocale() {
  await waitFor(
    () => {
      expect(document.documentElement.lang).toBe("en");
    },
    { timeout: 3_000 },
  );
}
