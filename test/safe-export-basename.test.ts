import { describe, expect, it } from "vitest";

import { safeExportBasename } from "@/features/scenario/results-ui/safe-export-basename";

describe("safeExportBasename", () => {
  it("sanitizes unsafe characters and truncates", () => {
    expect(safeExportBasename('Test / Case <*> "x"')).toBe("Test_Case_x");
    expect(safeExportBasename("a".repeat(100)).length).toBe(80);
  });

  it("uses fallback when empty after sanitization", () => {
    expect(safeExportBasename("   !!!   ")).toBe("scenario");
    expect(safeExportBasename("", "custom")).toBe("custom");
  });
});
