"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import {
  clearFilters,
  defaultSort,
  hasFilters,
  lengthLabel,
  listingHref,
  priceBands,
  slugify,
  toggle,
  withChange,
  type FilterOptions,
  type ListingState,
} from "@/lib/listing/query";
import { useHydrated, useListing } from "./listing-provider";

interface Draft {
  state: ListingState;
  /** The price boxes as typed. */
  from: string;
  to: string;
}

const toDraft = (state: ListingState): Draft => ({
  state,
  from: state.min === null ? "" : String(state.min),
  to: state.max === null ? "" : String(state.max),
});

const rupees = (text: string): number | null => {
  const value = text.trim();
  return /^\d{1,7}$/.test(value) && Number(value) > 0 ? Number(value) : null;
};

/**
 * The listing filters: length, colour, texture, price and availability.
 *
 * - `instant` (desktop): each tick applies at once; the price boxes apply
 *   with their Apply button (or Enter).
 * - `deferred` (the phone panel): choices apply together with Show results.
 *
 * It is a real GET form, so without JavaScript it still works: the browser
 * submits it to the same address.
 */
export function FilterPanel({
  base,
  state,
  options,
  mode,
  onApplied,
}: {
  base: string;
  state: ListingState;
  options: FilterOptions;
  mode: "instant" | "deferred";
  onApplied?: () => void;
}) {
  const { navigate } = useListing();
  const hydrated = useHydrated();
  const [draft, setDraft] = useState(() => toDraft(state));
  // When the address changes (a filter applied, Back pressed), start again from it.
  const current = listingHref(base, state);
  const [shownFor, setShownFor] = useState(current);
  if (shownFor !== current) {
    setShownFor(current);
    setDraft(toDraft(state));
  }

  const apply = (next: ListingState) => {
    navigate(listingHref(base, next));
    onApplied?.();
  };

  /** A tick box, band or switch: applied at once on desktop, kept for later in the phone panel. */
  const change = (patch: Partial<ListingState>, boxes?: { from: string; to: string }) => {
    const next = {
      state: withChange(draft.state, patch),
      from: boxes?.from ?? draft.from,
      to: boxes?.to ?? draft.to,
    };
    setDraft(next);
    if (mode === "instant") apply(next.state);
  };

  /** The whole form (the price boxes included). */
  const submit = (event: FormEvent) => {
    event.preventDefault();
    let min = rupees(draft.from);
    let max = rupees(draft.to);
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    apply(withChange(draft.state, { min, max }));
  };

  const bands = priceBands(options.price);
  const { lengths, colors, textures } = draft.state;
  const deferred = mode === "deferred";

  return (
    <form
      method="get"
      action={base}
      onSubmit={submit}
      aria-label="Filters"
      className="flex flex-col"
    >
      {state.q !== null ? <input type="hidden" name="q" value={state.q} /> : null}
      {state.sort !== defaultSort(state) ? (
        <input type="hidden" name="sort" value={state.sort} />
      ) : null}

      {options.lengths.length > 0 ? (
        <Group title="Length" count={lengths.length}>
          {options.lengths.map((length) => (
            <Tick
              key={length}
              name="length"
              value={String(length)}
              label={lengthLabel(length)}
              checked={lengths.includes(length)}
              onChange={() => change({ lengths: toggle(lengths, length) })}
            />
          ))}
        </Group>
      ) : null}

      {options.colors.length > 0 ? (
        <Group title="Colour" count={colors.length}>
          {options.colors.map((color) => (
            <Tick
              key={color}
              name="color"
              value={slugify(color)}
              label={color}
              checked={colors.includes(color)}
              onChange={() => change({ colors: toggle(colors, color) })}
            />
          ))}
        </Group>
      ) : null}

      {options.textures.length > 0 ? (
        <Group title="Texture" count={textures.length}>
          {options.textures.map((texture) => (
            <Tick
              key={texture}
              name="texture"
              value={slugify(texture)}
              label={texture}
              checked={textures.includes(texture)}
              onChange={() => change({ textures: toggle(textures, texture) })}
            />
          ))}
        </Group>
      ) : null}

      {options.price ? (
        <Group title="Price" count={draft.state.min !== null || draft.state.max !== null ? 1 : 0}>
          {bands.length > 0 ? (
            <div className="flex flex-wrap gap-2 pb-3">
              {bands.map((band) => {
                const pressed = draft.state.min === band.min && draft.state.max === band.max;
                return (
                  <button
                    key={band.label}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() =>
                      pressed
                        ? change({ min: null, max: null }, { from: "", to: "" })
                        : change(
                            { min: band.min, max: band.max },
                            {
                              from: band.min === null ? "" : String(band.min),
                              to: band.max === null ? "" : String(band.max),
                            },
                          )
                    }
                    className={cx(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep",
                      pressed
                        ? "border-deep bg-deep text-mint"
                        : "border-deep/20 bg-white/70 hover:border-deep/60",
                    )}
                  >
                    {band.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <PriceBox
              label="From"
              name="min"
              value={draft.from}
              onChange={(from) => setDraft({ ...draft, from })}
            />
            <span aria-hidden className="pb-2.5 text-deep/70">
              –
            </span>
            <PriceBox
              label="To"
              name="max"
              value={draft.to}
              onChange={(to) => setDraft({ ...draft, to })}
            />
            {deferred ? null : (
              <Button type="submit" variant="secondary" size="sm" className="mb-0.5 shrink-0">
                Apply
              </Button>
            )}
          </div>
        </Group>
      ) : null}

      <Group title="Availability" count={draft.state.inStock ? 1 : 0}>
        <Tick
          name="instock"
          value="1"
          label="In stock only"
          checked={draft.state.inStock}
          onChange={() => change({ inStock: !draft.state.inStock })}
        />
      </Group>

      {deferred ? (
        <div className="sticky bottom-0 -mx-6 mt-4 flex gap-3 border-t border-deep/10 bg-mint px-6 py-4">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!hasFilters(draft.state) && draft.from === "" && draft.to === ""}
            onClick={() => setDraft(toDraft(clearFilters(draft.state)))}
          >
            Clear all
          </Button>
          <Button type="submit" className="flex-1">
            Show results
          </Button>
        </div>
      ) : !hydrated ? (
        // Only without JavaScript: the ticks above can't apply themselves.
        <Button type="submit" className="mt-4">
          Apply filters
        </Button>
      ) : null}
    </form>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <details open className="group border-b border-deep/10 py-4 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium tracking-[0.25em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          {count > 0 ? <span className="ml-2 text-deep-soft">({count})</span> : null}
        </span>
        <span aria-hidden className="text-base leading-none">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <fieldset className="mt-3">
        <legend className="sr-only">{title}</legend>
        <div className="flex flex-col gap-2.5">{children}</div>
      </fieldset>
    </details>
  );
}

function Tick({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-deep/40 accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
      />
      <span>{label}</span>
    </label>
  );
}

function PriceBox({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-deep/70">
      {label} (₹)
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, "").slice(0, 7))}
        className="h-10 w-full rounded-xl border border-deep/20 bg-white px-3 text-sm text-deep focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-deep"
      />
    </label>
  );
}
