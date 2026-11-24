import { afterEach, describe, expect, it } from "vitest";
import { getChosenNewArrivals } from "@/lib/api/catalog";
import { setFetchForTests } from "@/lib/api/client";

const page = (ids: string[]) =>
  new Response(
    JSON.stringify({
      success: true,
      message: "OK",
      data: ids.map((id) => ({ id, name: id, slug: id })),
      meta: {
        page: 1,
        limit: 8,
        total: ids.length,
        totalPages: ids.length ? 1 : 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

describe("Customer favourites: the admin's New arrivals (owner, 2026-11-24)", () => {
  afterEach(() => setFetchForTests(null));

  it("shows the products ticked New arrival", async () => {
    const asked: string[] = [];
    setFetchForTests(async (url) => {
      asked.push(String(url));
      return page(["fresh-1", "fresh-2"]);
    });
    expect((await getChosenNewArrivals(8)).map((p) => p.id)).toEqual(["fresh-1", "fresh-2"]);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain("newArrival=true");
  });

  it("falls back to the newest products until any are ticked", async () => {
    const asked: string[] = [];
    setFetchForTests(async (url) => {
      asked.push(String(url));
      return String(url).includes("newArrival=true") ? page([]) : page(["newest"]);
    });
    expect((await getChosenNewArrivals(8)).map((p) => p.id)).toEqual(["newest"]);
    expect(asked[1]).not.toContain("newArrival");
  });

  it("shows the newest when an older API doesn't know the New arrival filter", async () => {
    setFetchForTests(async (url) =>
      String(url).includes("newArrival=true")
        ? new Response(
            JSON.stringify({
              success: false,
              code: "VALIDATION_FAILED",
              message: "Validation failed",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        : page(["newest"]),
    );
    expect((await getChosenNewArrivals(8)).map((p) => p.id)).toEqual(["newest"]);
  });
});
