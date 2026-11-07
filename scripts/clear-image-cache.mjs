// Clears Next.js's caches before end-to-end tests, so they check the real thing:
// - optimized images: a cached copy would hide an image configuration error
// - fetched API data: it survives rebuilds, so answers cached before an API
//   change (e.g. a new sort order) would be served instead of the API's own
// The folder of the build under test (the tests use .next-e2e; see next.config.ts).
import { rmSync } from "node:fs";

const dist = process.env.NEXT_DIST_DIR || ".next";
rmSync(`${dist}/cache/images`, { recursive: true, force: true });
rmSync(`${dist}/cache/fetch-cache`, { recursive: true, force: true });
