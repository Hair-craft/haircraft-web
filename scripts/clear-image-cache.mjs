// Clears Next.js's caches before end-to-end tests, so they check the real thing:
// - optimized images: a cached copy would hide an image configuration error
// - fetched API data: it survives rebuilds, so answers cached before an API
//   change (e.g. a new sort order) would be served instead of the API's own
import { rmSync } from "node:fs";

rmSync(".next/cache/images", { recursive: true, force: true });
rmSync(".next/cache/fetch-cache", { recursive: true, force: true });
