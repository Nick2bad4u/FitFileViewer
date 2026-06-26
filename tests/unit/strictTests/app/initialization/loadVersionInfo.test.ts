import { afterEach, describe, expect, it, vi } from "vitest";

import { setRuntimeProcess } from "../../../../../electron-app/utils/runtime/processEnvironment.js";

type VersionInfoElectronAPI = {
    getAppVersion?: () => Promise<string>;
    getChromeVersion?: () => Promise<string>;
    getElectronVersion?: () => Promise<string>;
    getLicenseInfo?: () => Promise<string>;
    getNodeVersion?: () => Promise<string>;
    getPlatformInfo?: () => Promise<{ arch: string; platform: string }>;
};

type LoadVersionInfoModule =
    typeof import("../../../../../electron-app/utils/app/initialization/loadVersionInfo.js");

const originalProcess = globalThis.process;

const h = vi.hoisted(() => ({
    getErrorInfo: vi.fn<
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

vi.mock(
    import("../../../../../electron-app/utils/app/initialization/updateSystemInfo.js"),
    () => ({
        updateSystemInfo: h.updateSystemInfo,
    })
);

vi.mock(import("../../../../../electron-app/utils/logging/index.js"), () => ({
    getErrorInfo: h.getErrorInfo,
    logWithLevel: h.logWithLevel,
}));

async function importLoadVersionInfoModule(): Promise<LoadVersionInfoModule> {
    return import("../../../../../electron-app/utils/app/initialization/loadVersionInfo.js");
}

function createElectronApiScope(electronAPI: VersionInfoElectronAPI) {
    return {
        getElectronAPI: () => electronAPI,
    };
}

function getVersionNumberElement(): HTMLElement {
    const versionNumber =
        document.querySelector<HTMLElement>("#version-number");
    if (!versionNumber) {
        throw new Error("Expected #version-number to exist");
    }
    return versionNumber;
}

function resetTestState(): void {
    document.body.replaceChildren();

    const versionNumber = document.createElement("div");
    versionNumber.id = "version-number";
    document.body.append(versionNumber);

    h.getErrorInfo.mockClear();
    h.logWithLevel.mockClear();
    h.updateSystemInfo.mockClear();
}

describe("loadVersionInfo", () => {
    afterEach(() => {
        setRuntimeProcess(originalProcess);
    });

    it("uses electronAPI when available and updates DOM", async () => {
        expect.assertions(2);

        resetTestState();
        const electronAPI = {
            getAppVersion: vi
                .fn<() => Promise<string>>()
                .mockResolvedValue("1.2.3"),
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
        };

        const { loadVersionInfoWithOptions } =
            await importLoadVersionInfoModule();

        await loadVersionInfoWithOptions({
            electronApiScope: createElectronApiScope(electronAPI),
        });

        expect(getVersionNumberElement().textContent).toBe("1.2.3");
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
        setRuntimeProcess({
            arch: "arm64",
            platform: "test-platform",
            versions: {
                chrome: "120.1.2",
                electron: "30.0.1",
                node: "22.3.4",
            },
        });

        const { loadVersionInfo } = await importLoadVersionInfoModule();

        await loadVersionInfo();

        expect(getVersionNumberElement().textContent).toBe("");
        expect(h.updateSystemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                author: "Nick2bad4u",
                chrome: "120.1.2",
                electron: "30.0.1",
                license: "Unlicense",
                node: "22.3.4",
                platform: "test-platform (arm64)",
            })
        );
    });

    it("rejects malformed scoped version APIs and falls back to process info", async () => {
        expect.assertions(4);

        resetTestState();
        setRuntimeProcess({
            arch: "x64",
            platform: "fallback-platform",
            versions: {
                chrome: "121.0.0",
                electron: "31.0.0",
                node: "23.0.0",
            },
        });
        const getElectronAPI = vi.fn<() => unknown>(() => ({
            getAppVersion: "1.2.3",
            getNodeVersion: vi.fn<() => Promise<string>>(),
        }));

        const { loadVersionInfoWithOptions } =
            await importLoadVersionInfoModule();

        await loadVersionInfoWithOptions({
            electronApiScope: { getElectronAPI },
        });

        expect(getElectronAPI).toHaveBeenCalledOnce();
        expect(getVersionNumberElement().textContent).toBe("");
        expect(h.updateSystemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                chrome: "121.0.0",
                electron: "31.0.0",
                node: "23.0.0",
                platform: "fallback-platform (x64)",
                version: "unknown",
            })
        );
        expect(h.logWithLevel).toHaveBeenCalledWith(
            "warn",
            "[LoadVersionInfo] electronAPI not available",
            undefined
        );
    });

    it("keeps defaults when electronAPI version retrieval fails", async () => {
        expect.assertions(2);

        resetTestState();
        const electronAPI = {
            getAppVersion: vi
                .fn<() => Promise<string>>()
                .mockRejectedValue(new Error("boom")),
        };

        const { loadVersionInfoWithOptions } =
            await importLoadVersionInfoModule();

        await loadVersionInfoWithOptions({
            electronApiScope: createElectronApiScope(electronAPI),
        });

        expect(getVersionNumberElement().textContent).toBe("");
        expect(h.updateSystemInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                version: "unknown",
            })
        );
    });
});
