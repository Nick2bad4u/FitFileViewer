import { describe, it, expect, beforeEach } from "vitest";
import { getActiveTabContent } from "../utils/getActiveTabContent";

describe("getActiveTabContent", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });
    it("should return the first .tab-content element with display block", () => {
        const el1 = document.createElement("div");
        el1.className = "tab-content";
        el1.style.display = "none";
        const el2 = document.createElement("div");
        el2.className = "tab-content";
        el2.style.display = "block";
        document.body.appendChild(el1);
        document.body.appendChild(el2);
        expect(getActiveTabContent()).toBe(el2);
    });
    it("should return null if no .tab-content is visible", () => {
        const el1 = document.createElement("div");
        el1.className = "tab-content";
        el1.style.display = "none";
        document.body.appendChild(el1);
        expect(getActiveTabContent()).toBeNull();
    });
    it("should return null if there are no .tab-content elements", () => {
        expect(getActiveTabContent()).toBeNull();
    });
});
