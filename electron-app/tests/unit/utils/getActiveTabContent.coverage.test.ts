import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getActiveTabContent } from "../../../utils/rendering/helpers/getActiveTabContent.js";

describe("getActiveTabContent.js - coverage uplift", () => {
    const originalWarn = console.warn;
    const originalError = console.error;

    beforeEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
        console.warn = vi.fn();
        console.error = vi.fn();
    });

    afterEach(() => {
        console.warn = originalWarn;
        console.error = originalError;
        document.body.innerHTML = "";
    });

    it("returns the first visible .tab-content element", () => {
        const c1 = document.createElement("div");
        c1.className = "tab-content";
        c1.style.display = "none";
        const c2 = document.createElement("div");
        c2.id = "visible-tab";
        c2.className = "tab-content";
        c2.style.display = "block";
        const c3 = document.createElement("div");
        c3.className = "tab-content";
        c3.style.display = "none";
        document.body.append(c1, c2, c3);

        const active = getActiveTabContent();
        expect(active).toBe(c2);
        expect((active as HTMLElement).id).toBe("visible-tab");
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    it("returns null when no .tab-content elements are present and warns", () => {
        const result = getActiveTabContent();
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalled();
    });

    it("returns null when none are visible (display not 'block')", () => {
        for (let i = 0; i < 3; i++) {
            const d = document.createElement("div");
            d.className = "tab-content";
            // Explicitly set to empty or none to exercise branch
            d.style.display = i === 0 ? "none" : "";
            document.body.appendChild(d);
        }
        const result = getActiveTabContent();
        expect(result).toBeNull();
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    it("returns .tab-content.active when visible via CSS class (no inline display)", () => {
        const inactive = document.createElement("div");
        inactive.className = "tab-content";

        const active = document.createElement("div");
        active.id = "content-map";
        active.className = "tab-content active";

        document.body.append(inactive, active);

        const result = getActiveTabContent();
        expect(result).toBe(active);
        expect(console.error).not.toHaveBeenCalled();
    });

    it("derives active content from .tab-button.active id when needed", () => {
        const btn = document.createElement("button");
        btn.id = "tab-summary";
        btn.className = "tab-button active";
        document.body.appendChild(btn);

        const content = document.createElement("div");
        content.id = "content-summary";
        content.className = "tab-content";
        document.body.appendChild(content);

        const result = getActiveTabContent();
        expect(result).toBe(content);
        expect(console.error).not.toHaveBeenCalled();
    });

    it("handles querySelectorAll throwing and returns null", () => {
        const spy = vi
            .spyOn(document, "querySelectorAll")
            .mockImplementation(() => {
                throw new Error("boom");
            });
        const result = getActiveTabContent();
        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalled();
        spy.mockRestore();
    });
});
