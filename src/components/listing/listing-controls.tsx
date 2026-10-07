"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChevronDownIcon } from "@/components/ui/icons";
import {
  activeFilters,
  listingHref,
  slugify,
  sortsFor,
  withChange,
  type FilterOptions,
  type ListingState,
  type SortKey,
} from "@/lib/listing/query";
import { FilterPanel } from "./filter-panel";
import { useHydrated, useListing } from "./listing-provider";

/**
 * The sort dropdown. With JavaScript it applies on change; without, it is a
 * small GET form that keeps the current filters.
 */
export function SortSelect({ base, state }: { base: string; state: ListingState }) {
  const { navigate } = useListing();
  const hydrated = useHydrated();
  return (
    <form method="get" action={base} className="flex items-center gap-2">
      {state.q !== null ? <input type="hidden" name="q" value={state.q} /> : null}
      {state.lengths.length > 0 ? (
        <input type="hidden" name="length" value={state.lengths.join(",")} />
      ) : null}
      {state.colors.length > 0 ? (
        <input type="hidden" name="color" value={state.colors.map(slugify).join(",")} />
      ) : null}
      {state.textures.length > 0 ? (
        <input type="hidden" name="texture" value={state.textures.map(slugify).join(",")} />
      ) : null}
      {state.min !== null ? <input type="hidden" name="min" value={state.min} /> : null}
      {state.max !== null ? <input type="hidden" name="max" value={state.max} /> : null}
      {state.inStock ? <input type="hidden" name="instock" value="1" /> : null}
      <label className="flex items-center gap-2 text-sm">
        <span className="text-deep/70">Sort by</span>
        <span className="relative">
          <select
            name="sort"
            value={state.sort}
            onChange={(event) =>
              navigate(
                listingHref(base, withChange(state, { sort: event.target.value as SortKey })),
              )
            }
            className="h-10 appearance-none rounded-full border border-deep/20 bg-white/80 pr-9 pl-4 text-sm text-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
          >
            {sortsFor(state).map((sort) => (
              <option key={sort.key} value={sort.key}>
                {sort.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            width={16}
            height={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
        </span>
      </label>
      {hydrated ? null : (
        <Button type="submit" variant="secondary" size="sm">
          Sort
        </Button>
      )}
    </form>
  );
}

/** Phones and tablets: a Filters button (with the number active) that opens the filters from the side. */
export function MobileFilters({
  base,
  state,
  options,
}: {
  base: string;
  state: ListingState;
  options: FilterOptions;
}) {
  const [open, setOpen] = useState(false);
  // Each opening starts from the applied filters (ticks abandoned with Escape are forgotten).
  const [opened, setOpened] = useState(0);
  const count = activeFilters(state).length;
  return (
    <div className="lg:hidden">
      <Button
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        onClick={() => {
          setOpened((n) => n + 1);
          setOpen(true);
        }}
      >
        Filters{count > 0 ? ` (${count})` : ""}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Filters" placement="left">
        <FilterPanel
          key={opened}
          base={base}
          state={state}
          options={options}
          mode="deferred"
          onApplied={() => setOpen(false)}
        />
      </Dialog>
    </div>
  );
}
