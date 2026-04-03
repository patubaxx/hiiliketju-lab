import type { NextConfig } from "next";

/**
 * Do not add `@react-pdf/renderer` to `transpilePackages`. Next.js already treats it as a
 * server external (see `server-external-packages.jsonc`). Listing it under `transpilePackages`
 * opts it back into bundling and breaks `@react-pdf/reconciler` with React 19 (duplicate React /
 * mismatched element symbols → runtime errors in PDF export).
 */
const nextConfig: NextConfig = {};

export default nextConfig;
