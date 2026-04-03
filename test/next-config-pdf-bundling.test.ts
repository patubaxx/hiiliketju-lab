import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config — PDF server export", () => {
  it("does not transpile @react-pdf/renderer (bundling breaks reconciler + React 19)", () => {
    const tp = (nextConfig as { transpilePackages?: readonly string[] }).transpilePackages;
    expect(tp ?? []).not.toContain("@react-pdf/renderer");
  });
});
