import { describe, expect, it } from "vitest";
import {
  MIN_RING_ITEMS,
  faceAngle,
  frontIndex,
  parallaxShift,
  restingRotation,
  ringFaces,
  ringStep,
  rotationFor,
} from "@/lib/home/ring";

describe("home product ring (owner, 2026-11-23)", () => {
  it("needs at least 3 products", () => {
    expect(MIN_RING_ITEMS).toBe(3);
  });

  it("fills every ring alike (at least 16 panels): few products go round more than once, each as often", () => {
    expect(ringFaces(3)).toBe(18);
    expect(ringFaces(4)).toBe(16);
    expect(ringFaces(5)).toBe(20);
    expect(ringFaces(8)).toBe(16);
    expect(ringFaces(12)).toBe(24);
    expect(ringFaces(20)).toBe(20);
  });

  it("spaces the cards evenly round the ring", () => {
    expect(ringStep(8)).toBe(45);
    expect(ringStep(4)).toBe(90);
    expect(ringStep(3)).toBe(120);
  });

  it("knows how far each card is turned from the front", () => {
    expect(faceAngle(0, 0, 8)).toBe(0);
    expect(faceAngle(1, 0, 8)).toBe(45);
    expect(faceAngle(7, 0, 8)).toBe(-45);
    expect(faceAngle(4, 0, 8)).toBe(180);
    // Turned to the next card: card 1 at the front, card 0 off to the left.
    expect(faceAngle(1, -45, 8)).toBe(0);
    expect(faceAngle(0, -45, 8)).toBe(-45);
    // Many turns round still give -180..180.
    expect(faceAngle(2, -720 - 90, 8)).toBe(0);
  });

  it("finds the card at the front, after any number of turns", () => {
    expect(frontIndex(0, 8)).toBe(0);
    expect(frontIndex(-45, 8)).toBe(1);
    expect(frontIndex(45, 8)).toBe(7);
    expect(frontIndex(-360 * 3 - 90, 8)).toBe(2);
    expect(frontIndex(-50, 8)).toBe(1);
  });

  it("turns the short way to bring a card to the front", () => {
    expect(rotationFor(1, 0, 8)).toBe(-45);
    expect(rotationFor(7, 0, 8)).toBe(45);
    expect(frontIndex(rotationFor(5, -720, 8), 8)).toBe(5);
    expect(Math.abs(rotationFor(5, -720, 8) - -720)).toBeLessThanOrEqual(180);
  });

  it("settles on a card after a drag, carrying on a little after a flick", () => {
    expect(restingRotation(-20, 0, 8)).toBe(0);
    expect(restingRotation(-30, 0, 8)).toBe(-45);
    // A quick flick to the left carries it on by a few cards.
    const flicked = restingRotation(-30, -1, 8);
    expect(flicked).toBeLessThan(-45);
    expect(Math.abs(flicked % 45)).toBe(0);
    // Never more than a full turn.
    expect(restingRotation(0, -100, 8)).toBe(-360);
  });

  it("shifts the photo for the parallax: none at the front, most at the sides", () => {
    expect(parallaxShift(0)).toBe(0);
    expect(parallaxShift(90)).toBe(-40);
    expect(parallaxShift(-45)).toBe(20);
    expect(parallaxShift(170)).toBe(-40);
  });
});
