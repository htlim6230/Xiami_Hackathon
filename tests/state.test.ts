import { describe, it, expect } from "vitest";
import { reducer, initial, selectionBox, imageBox } from "../src/state";

describe("translation lifecycle", () => {
  it("rejects late chunks after Stop and after a new selection", () => {
    let s = reducer(initial, { type: "start", requestId: "old" });
    s = reducer(s, { type: "reset" });
    expect(
      reducer(s, { type: "chunk", requestId: "old", text: "stale" }),
    ).toEqual(initial);
    s = reducer(s, { type: "start", requestId: "new" });
    expect(reducer(s, { type: "done", requestId: "old" }).phase).toBe(
      "Selecting",
    );
  });
  it("replaces partial dialect output on Mandarin fallback", () => {
    let s = reducer(initial, { type: "start", requestId: "a" });
    s = reducer(s, { type: "chunk", requestId: "a", text: "partial dialect" });
    s = reducer(s, {
      type: "romanization",
      requestId: "a",
      text: "partial reading",
    });
    s = reducer(s, {
      type: "fallback",
      requestId: "a",
      text: "普通話",
      notice: "Mandarin fallback",
    });
    expect(s.translation).toBe("普通話");
    expect(s.romanization).toBe("");
    expect(s.fallback).toBe(true);
  });
  it("keeps errors actionable without deleting original text", () => {
    let s = reducer(initial, { type: "start", requestId: "a" });
    s = reducer(s, {
      type: "source",
      requestId: "a",
      text: "Bring your ID",
      boxes: [],
    });
    s = reducer(s, {
      type: "error",
      requestId: "a",
      message: "Provider unavailable",
    });
    expect(s.phase).toBe("Error");
    expect(s.source).toBe("Bring your ID");
  });
  it("ignores late chunks after pausing", () => {
    const s = reducer(reducer(initial, { type: "start", requestId: "a" }), {
      type: "phase",
      phase: "Paused",
    });
    expect(
      reducer(s, { type: "chunk", requestId: "a", text: "late" }).translation,
    ).toBe("");
  });
  it("clamps reverse drags and maps CSS coordinates to screenshot pixels", () => {
    const viewport = { width: 1000, height: 600 };
    const box = selectionBox({ x: 500, y: 400 }, { x: -20, y: 100 }, viewport);
    expect(box).toEqual({ x: 0, y: 100, width: 500, height: 300 });
    expect(imageBox(box, viewport, { width: 2000, height: 1200 })).toEqual({
      x: 0,
      y: 200,
      width: 1000,
      height: 600,
    });
  });
});
