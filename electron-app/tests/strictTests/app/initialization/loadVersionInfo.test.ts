import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../utils/app/initialization/updateSystemInfo.js", () => ({ updateSystemInfo: vi.fn() }));
vi.mock("../../../../utils/logging/index.js", () => ({ logWithLevel: vi.fn() }));

const modPath = "../../../../utils/app/initialization/loadVersionInfo.js";

describe("loadVersionInfo", () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="version-number"></div>`;
        (window as any).electronAPI = undefined;
        vi.resetModules();
    });

    it("uses electronAPI when available and updates DOM", async () => {
        (window as any).electronAPI = {
            getAppVersion: vi.fn().mockResolvedValue("1.2.3"),
            getElectronVersion: vi.fn().mockResolvedValue("38.1.0"),
            getNodeVersion: vi.fn().mockResolvedValue("24.8.0"),
            getChromeVersion: vi.fn().mockResolvedValue("128.0.0.0"),
            getPlatformInfo: vi.fn().mockResolvedValue({ platform: "win32", arch: "x64" }),
            getLicenseInfo: vi.fn().mockResolvedValue("Unlicense"),
        };
        const { loadVersionInfo } = await import(modPath);
        const { updateSystemInfo } = await import("../../../../utils/app/initialization/updateSystemInfo.js");
        await loadVersionInfo();
        expect(document.getElementById("version-number")!.textContent).toBe("1.2.3");
        expect((updateSystemInfo as any).mock.calls[0][0]).toMatchObject({
            version: "1.2.3",
            electron: "38.1.0",
            node: "24.8.0",
            chrome: "128.0.0.0",
            platform: expect.stringContaining("win32"),
            license: "Unlicense",
        });
    });

    it("falls back when electronAPI missing and still updates", async () => {
        (window as any).electronAPI = undefined;
        const { loadVersionInfo } = await import(modPath);
        const { updateSystemInfo } = await import("../../../../utils/app/initialization/updateSystemInfo.js");
        await loadVersionInfo();
        expect((updateSystemInfo as any).mock.calls[0][0]).toHaveProperty("author");
    });

    it("handles errors and applies fallback", async () => {
        (window as any).electronAPI = {
            getAppVersion: vi.fn().mockRejectedValue(new Error("boom")),
        };
        const { loadVersionInfo } = await import(modPath);
        const { updateSystemInfo } = await import("../../../../utils/app/initialization/updateSystemInfo.js");
        await loadVersionInfo();
        // updateSystemInfo called at least once, possibly twice (normal then fallback). ensure called
        expect((updateSystemInfo as any).mock.calls.length).toBeGreaterThan(0);
    });
});
