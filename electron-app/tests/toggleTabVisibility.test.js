import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { toggleTabVisibility } from "../utils/toggleTabVisibility";

describe("toggleTabVisibility", () => {
    const tabIds = ["content-data", "content-chart", "content-map", "content-summary", "content-altfit"];
    beforeEach(() => {
        document.body.innerHTML = "";
        tabIds.forEach((id) => {
            const el = document.createElement("div");
            el.id = id;
            el.style.display = "none";
            document.body.appendChild(el);
        });
    });
    it("should show only the specified tab and hide others", () => {
        toggleTabVisibility("content-map");
        tabIds.forEach((id) => {
            const el = document.getElementById(id);
            if (id === "content-map") {
                expect(el.style.display).toBe("block");
            } else {
                expect(el.style.display).toBe("none");
            }
        });
    });
    it("should not throw if some tab elements are missing", () => {
        document.getElementById("content-map").remove();
        expect(() => toggleTabVisibility("content-map")).not.toThrow();
    });
});
