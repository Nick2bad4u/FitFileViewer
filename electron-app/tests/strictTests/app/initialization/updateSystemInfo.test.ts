import { describe, it, expect, beforeEach, vi } from "vitest";

const modPath = "../../../../utils/app/initialization/updateSystemInfo.js";

function createFields(count = 7) {
    document.body.innerHTML = "";
    const container = document.createElement("div");
    for (let i = 0; i < count; i++) {
        const span = document.createElement("span");
        span.className = "system-info-value";
        container.appendChild(span);
    }
    document.body.appendChild(container);
}

describe("updateSystemInfo", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.resetModules();
    });

    it("maps fields in order to DOM and returns true", async () => {
        createFields(7);
        const { updateSystemInfo } = await import(modPath);
        const ok = updateSystemInfo({
            version: "1.0.0",
            electron: "38.0.0",
            node: "22.0.0",
            chrome: "128.0",
            platform: "win32 (x64)",
            author: "FitFileViewer Team",
            license: "MIT",
        } as any);
        expect(ok).toBe(true);
        const values = Array.from(document.querySelectorAll(".system-info-value")).map((e) => e.textContent);
        expect(values).toEqual(["1.0.0", "38.0.0", "22.0.0", "128.0", "win32 (x64)", "FitFileViewer Team", "MIT"]);
    });

    it("warns when DOM count mismatches and still sets available", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        createFields(5);
        const { updateSystemInfo } = await import(modPath);
        const ok = updateSystemInfo({
            version: "1",
            electron: "2",
            node: "3",
            chrome: "4",
            platform: "5",
            author: "6",
            license: "7",
        } as any);
        expect(ok).toBe(true);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    it("returns false with invalid info object and when no DOM elements", async () => {
        document.body.innerHTML = "";
        const { updateSystemInfo } = await import(modPath);
        // invalid object
        expect(updateSystemInfo(null as any)).toBe(false);
        // create fields but then remove to simulate not found
        createFields(0);
        expect(updateSystemInfo({} as any)).toBe(false);
    });

    it("clears cache and re-initializes on next call", async () => {
        createFields(7);
        const { updateSystemInfo, clearSystemInfoCache } = await import(modPath);
        updateSystemInfo({
            version: "A",
            electron: "B",
            node: "C",
            chrome: "D",
            platform: "E",
            author: "F",
            license: "G",
        } as any);
        // Rebuild DOM with different elements
        createFields(7);
        clearSystemInfoCache();
        updateSystemInfo({
            version: "X",
            electron: "Y",
            node: "Z",
            chrome: "Q",
            platform: "P",
            author: "O",
            license: "N",
        } as any);
        const values = Array.from(document.querySelectorAll(".system-info-value")).map((e) => e.textContent);
        expect(values[0]).toBe("X");
    });
});
