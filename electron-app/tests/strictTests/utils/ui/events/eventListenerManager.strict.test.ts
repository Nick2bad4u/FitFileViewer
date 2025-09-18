import { describe, it, expect, vi } from "vitest";
import {
  addEventListenerWithCleanup,
  cleanupEventListeners,
  getListenerCount,
} from "../../../../../utils/ui/events/eventListenerManager.js";

describe("eventListenerManager.strict branches", () => {
  it("warns if removeEventListener throws during cleanup", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("div");
    const originalRemove = el.removeEventListener.bind(el);
    // Force removeEventListener to throw
    // @ts-ignore
    el.removeEventListener = (() => {
      throw new Error("remove fail");
    }) as any;

    const cleanup = addEventListenerWithCleanup(el as any, "click", () => {});
    expect(getListenerCount()).toBe(1);
    // Should not throw; should warn
    expect(() => cleanup()).not.toThrow();
    expect(warn).toHaveBeenCalled();
    // restore
    // @ts-ignore
    el.removeEventListener = originalRemove;
    cleanupEventListeners();
  });
});
