import { describe, expect, it, vi } from "vitest";

type VersionInfoElectronAPI = {
    getAppVersion?: () => Promise<string>;
    getChromeVersion?: () => Promise<string>;
    getElectronVersion?: () => Promise<string>;
    getLicenseInfo?: () => Promise<string>;
    getNodeVersion?: () => Promise<string>;
    getPlatformInfo?: () => Promise<{ arch: string; platform: string }>;
};

type VersionInfoGlobal = typeof globalThis & {
    electronAPI?: VersionInfoElectronAPI;
};

type LoadVersionInfoModule = typeof import("../../../../utils/app/initialization/loadVersionInfo.js");

const h = vi.hoisted(() => ({
    getErrorInfo:
        vi.fn<
            (error: unknown) => {
                message: string;
                stack?: string;
            }
        >((error) =>
            error instanceof Error
                ? { message: error.message, stack: error.stack }
                : { message: String(error) }
        ),
    logWithLevel:
        vi.fn<
            (
                level: string,
                message: string,
                context?: Record<string, unknown>
            ) => void
        >(),
    updateSystemInfo: vi.fn<(info: unknown) => boolean>(() => true),
}));

vi.mock(import("../../../../utils/app/initialization/updateSystemInfo.js"), () => ({
    updateSystemInfo: h.updateSystemInfo,
}));

vi.mock(import("../../../../utils/logging/index.js"), () => ({
    getErrorInfo: h.getErrorInfo,
    logWithLevel: h.logWithLevel,
}));

async function importLoadVersionInfoModule(): Promise<LoadVersionInfoModule> {
    return import("../../../../utils/app/initialization/loadVersionInfo.js");
}

function setElectronAPI(electronAPI?: VersionInfoElectronAPI): void {
    const versionInfoGlobal = globalThis as VersionInfoGlobal;

    if (electronAPI) {
        versionInfoGlobal.electronAPI = electronAPI;
        return;
    }

    delete versionInfoGlobal.electronAPI;
}

function resetTestState(): void {
    document.body.textContent = "";

    const versionNumber = document.createElement("div");
    versionNumber.id = "version-number";
    document.body.append(versionNumber);

    h.getErrorInfo.mockClear();
    h.logWithLevel.mockClear();
    h.updateSystemInfo.mockClear();
    setElectronAPI();
}

describe("loadVersionInfo", () => {
    it("uses electronAPI when available and updates DOM", async () => {
        expect.assertions(2);

        resetTestState();
        setElectronAPI({
            getAppVersion: vi.fn<() => Promise<string>>().mockResolvedValue(
                "1.2.3"
            ),
            getChromeVersion: vi
                .fn<() => Promise<string>>()
                .mockResolvedValue("128.0.0.0"),
            getElectronVersion: vi
                .fn<() => Promise<string>>()
                .mockResolvedValue("38.1.0"),
            getLicenseInfo: vi
                .fn<() => Promise<string>>()
                .mockResolvedValue("Unlicense"),
            getNodeVersion: vi
                .fn<() => Promise<string>>()
                .mockResolvedValue("24.8.0"),
            getPlatformInfo: vi
                .fn<() => Promise<{ arch: string; platform: string }>>()
                .mockResolvedValue({ arch: "x64", platform: "win32" }),
        });

        const { loadVersionInfo } = await importLoadVersionInfoModule();

        await loadVersionInfo();

        expect(document.querySelector("#version-number")?.textContent).toBe(
            "1.2.3"
        );
        expect(h.updateSystemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                chrome: "128.0.0.0",
                electron: "38.1.0",
                license: "Unlicense",
                node: "24.8.0",
                platform: "win32 (x64)",
                version: "1.2.3",
            })
        );
    });

    it("falls back when electronAPI is missing and still updates", async () => {
        expect.assertions(2);

        resetTestState();

        const { loadVersionInfo } = await importLoadVersionInfoModule();

        await loadVersionInfo();

        expect(document.querySelector("#version-number")?.textContent).toBe("");
        expect(h.updateSystemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                author: "Nick2bad4u",
                license: "Unlicense",
            })
        );
    });

    it("keeps defaults when electronAPI version retrieval fails", async () => {
        expect.assertions(2);

        resetTestState();
        setElectronAPI({
            getAppVersion: vi
                .fn<() => Promise<string>>()
                .mockRejectedValue(new Error("boom")),
        });

        const { loadVersionInfo } = await importLoadVersionInfoModule();

        await loadVersionInfo();

        expect(document.querySelector("#version-number")?.textContent).toBe("");
        expect(h.updateSystemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                version: "unknown",
            })
        );
    });
});
