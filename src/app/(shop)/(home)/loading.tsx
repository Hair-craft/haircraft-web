import { Skeleton } from "@/components/ui/display";

/**
 * Shown while the home page loads (streamed under the header). Only the home
 * page: listing pages render whole before sending, so an unknown category gets
 * a real 404, untidy addresses a real redirect, and the filters work without
 * JavaScript.
 */
export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-12 w-2/3" />
      <Skeleton className="mt-3 h-5 w-1/2" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
