import { describe, expect, it } from "vitest";
import {
  BODY_MAX,
  checkReview,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
  PHOTO_PROBLEMS,
  photoProblem,
  photoProblemCode,
  reviewErrorMessage,
  STAR_WORDS,
  statusWords,
  TITLE_MAX,
} from "@/lib/reviews/rules";

describe("the review form", () => {
  it("needs a rating from 1 to 5; title and text are optional", () => {
    expect(checkReview({ rating: "5", title: "", body: "" })).toEqual({
      input: { rating: 5, title: null, body: null },
    });
    expect(checkReview({ rating: "", title: "Lovely", body: "" })).toEqual({
      fields: { rating: "Choose from 1 to 5 stars." },
    });
    expect(checkReview({ rating: "6", title: "", body: "" })).toHaveProperty("fields.rating");
    expect(checkReview({ rating: "2.5", title: "", body: "" })).toHaveProperty("fields.rating");
  });

  it("tidies the title and keeps the text's lines", () => {
    expect(
      checkReview({ rating: "4", title: "  Soft   and  full ", body: " Line one\nLine two " }),
    ).toEqual({
      input: { rating: 4, title: "Soft and full", body: "Line one\nLine two" },
    });
  });

  it("keeps to the API's limits", () => {
    const result = checkReview({
      rating: "3",
      title: "x".repeat(TITLE_MAX + 1),
      body: "y".repeat(BODY_MAX + 1),
    });
    expect("fields" in result && Object.keys(result.fields).sort()).toEqual(["body", "title"]);
  });
});

describe("stars and statuses", () => {
  it("say what each rating means", () => {
    expect(Object.values(STAR_WORDS)).toEqual(["Poor", "Fair", "Good", "Very good", "Excellent"]);
  });

  it("tell the writer where their review is", () => {
    expect(statusWords("PENDING").label).toBe("Waiting for approval");
    expect(statusWords("APPROVED").label).toBe("Published");
    expect(statusWords("REJECTED")).toMatchObject({ label: "Not published", tone: "muted" });
    expect(statusWords("SOMETHING_NEW").label).toBe("Waiting for approval");
  });
});

describe("the API's answers", () => {
  it("are said plainly", () => {
    expect(reviewErrorMessage(409, "REVIEW_ALREADY_EXISTS")).toMatch(/already reviewed/);
    expect(reviewErrorMessage(404, "NOT_FOUND")).toMatch(/no longer exists/);
    expect(reviewErrorMessage(503, "X")).toMatch(/can't reach the shop/);
  });
});

describe("review photos", () => {
  const jpeg = (name: string, size = 1_000_000) => ({ name, size, type: "image/jpeg" });

  it("allows up to 3 JPEG, PNG or WebP photos of up to 5 MB", () => {
    expect(
      photoProblem([jpeg("a.jpg"), { name: "b.webp", size: 10, type: "image/webp" }], 1),
    ).toBeNull();
    expect(photoProblem([], 3)).toBeNull();
  });

  it("counts the photos already kept", () => {
    expect(photoProblem([jpeg("a.jpg"), jpeg("b.jpg")], 2)).toBe(
      `You can add up to ${MAX_PHOTOS} photos in all. Choose 1 or fewer.`,
    );
  });

  it("names a file of the wrong kind or too large", () => {
    expect(photoProblem([{ name: "notes.pdf", size: 10, type: "application/pdf" }], 0)).toMatch(
      /^"notes.pdf" isn't a photo we can use/,
    );
    expect(photoProblem([jpeg("big.jpg", MAX_PHOTO_BYTES + 1)], 0)).toMatch(
      /^"big.jpg" is larger than 5 MB/,
    );
  });

  it("turns the API's refusals into codes with the shop's words", () => {
    expect(photoProblemCode(415, "x")).toBe("photos-type");
    expect(photoProblemCode(413, "x")).toBe("photos-size");
    expect(photoProblemCode(400, "A review can have at most 3 photos; it has 2…")).toBe(
      "photos-count",
    );
    expect(photoProblemCode(503, "x")).toBe("photos-failed");
    expect(PHOTO_PROBLEMS["photos-count"]).toMatch(/^Your review is saved/);
  });
});
