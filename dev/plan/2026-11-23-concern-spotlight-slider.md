# Plan: Shop by concern as a spotlight slider (2026-11-23)

**Ask (owner):** "The shop by concern section should be in this effect, it would be more
flexible." The owner pasted a sample (MDJAmin's slider):

- one item fills the whole box as a large photo, with its name, a line of text and a
  "See More" button rising in out of a blur on the left;
- the next items wait on the right as small floating cards;
- ◁ ▷ move the queue: the first small card grows into the big photo, and the rest move up.

## What visitors see

- **The box:** a large rounded box with the section's heading and intro above it (from the
  admin, as now).
- **The spotlight:** the current concern's photo fills the box, with a soft dark fade on the
  left so the words read well. On the left, rising out of a blur one after another (as in the
  sample):
  - the concern's **title** in large type;
  - its **line** (the admin's one-line text);
  - a **"Shop now"** button to that concern's page (`/concern/<slug>`).
- **The queue:** the next 3 concerns wait on the right as small photo cards with soft shadows,
  each with its title at its foot.
  - Clicking a small card brings it into the spotlight.
  - Further concerns wait out of sight.
- **Moving on:**
  - round ‹ › buttons at the foot of the box (the sample's ◁ ▷, in the site's style);
  - the ← → keys, and a sideways swipe on phones;
  - every move takes 0.5 s, as in the sample: the first small card grows into the spotlight
    and the others slide along;
  - it goes round and round; after the last concern comes the first again.
- **Moving on by itself** every 6 seconds on all screens, like today's slider on desktop. It
  pauses while the mouse is over the box, while something inside it has focus, and when the
  section is off screen. It's off with "reduce motion".
- **Phones:** the same, with a slightly shorter box. The words sit lower, and the 2 small cards
  are smaller, in the bottom right. Today's pinned scroll-to-slide on phones is replaced by this.
- **Reduce motion:** no movement or blur; the buttons still change the spotlight at once.

## Build

- **New `src/components/home/concern-spotlight.tsx`** (client): positions by slot (spotlight,
  queue 1–3, hidden), with CSS transitions on position and size, and the text's rise
  animation restarting on each change.
- **`ConcernSection`** in `sections.tsx` uses it. The photos and alt text are as now (the
  concern's own, or its first category's), at a larger size for the spotlight.
- **Accessibility:**
  - a labelled carousel region with named ‹ › buttons and a polite live line ("2 of 6:
    Thinning at the crown");
  - every concern is still a real link in the server's HTML, for search engines;
  - the small cards are buttons ("Show Thinning at the crown").
- **The old `concern-carousel.tsx`** stays in the code base in case it's wanted back; it's
  only removed from this section.

## Tests

- Unit tests for the slot maths (which concern is where after next, previous or a jump).
- `tests/e2e/home.spec.ts` and `mobile-home.mobile.spec.ts`: the concern checks updated for
  the new layout (not run without the owner's OK; heavy).

## Not in this plan

- Other sections.
- Admin fields (it uses the title, line, photo and link the admin already has).
