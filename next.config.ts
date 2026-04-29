import type { NextConfig } from "next";

/**
 * Do not add `@react-pdf/renderer` to `transpilePackages`. Next.js already treats it as a
 * server external (see `server-external-packages.jsonc`). Listing it under `transpilePackages`
 * opts it back into bundling and breaks `@react-pdf/reconciler` with React 19 (duplicate React /
 * mismatched element symbols → runtime errors in PDF export).
 *
 * `recharts` is transpiled so Turbopack dev reliably resolves its `main`/`module` graph (Vitest
 * uses Vite and does not exercise this path — WP-AUDIT-0b).
 */
const nextConfig: NextConfig = {
  transpilePackages: ["recharts"],
};

export default nextConfig;
