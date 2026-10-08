import { EventEmitter } from "node:events";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { App, BrowserWindow } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configurePackagedSmoke } from "../../../electron-app/main/runtime/packagedSmoke.js";
import { approveFilePath } from "../../../electron-app/main/security/fileAccessPolicy.js";
import { setAutoUpdaterInitialized } from "../../../electron-app/main/state/appState.js";

vi.mock("../../../electron-app/main/security/fileAccessPolicy.js", () => ({
    approveFilePath: vi.fn(),
}));
vi.mock("../../../electron-app/main/state/appState.js", () => ({
    setAutoUpdaterInitialized: vi.fn(),
}));

let directory = "";
const originalArguments = [...process.argv];

beforeEach(() => {
    vi.clearAllMocks();
    directory = mkdtempSync(path.join(os.tmpdir(), "ffv-smoke-runtime-test-"));
    vi.stubEnv("FFV_SMOKE_DIRECTORY", directory);
    vi.stubEnv("FFV_SMOKE_NONCE", "test-nonce");
    vi.stubEnv("FFV_SMOKE_FIXTURE", path.join(directory, "activity.fit"));
    process.argv = [...originalArguments, "--ffv-smoke-test"];
});

afterEach(() => {
    process.argv = originalArguments;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true, force: true });
});

function createApp() {
    return Object.assign(new EventEmitter(), {
        setPath: vi.fn(),
        getVersion: () => "30.0.3",
        exit: vi.fn(),
    });
}

function createWindow() {
    return {
        isVisible: vi.fn().mockReturnValue(true),
        isDestroyed: vi.fn().mockReturnValue(false),
        webContents: Object.assign(new EventEmitter(), {
            getURL: () => "file:///app/dist/index.html",
            executeJavaScript: vi
                .fn()
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce({ recordCount: 1285, sessionCount: 1 }),
            capturePage: vi
                .fn()
                .mockResolvedValue({ toPNG: () => Buffer.from("screenshot") }),
        }),
    };
}

describe("packaged smoke runtime", () => {
    it("leaves normal startup untouched", () => {
        expect.assertions(3);
        process.argv = originalArguments;
        const app = createApp();
        configurePackagedSmoke(app as unknown as App);
        expect(app.setPath).not.toHaveBeenCalled();
        expect(setAutoUpdaterInitialized).not.toHaveBeenCalled();
        expect(existsSync(path.join(directory, "user-data"))).toBe(false);
    });

    it("rejects incomplete opt-in configuration before startup", () => {
        expect.assertions(1);
        vi.stubEnv("FFV_SMOKE_NONCE", "");
        expect(() =>
            configurePackagedSmoke(createApp() as unknown as App)
        ).toThrow("requires an absolute report directory");
    });

    it.each([
        ["FFV_SMOKE_DIRECTORY", undefined],
        ["FFV_SMOKE_DIRECTORY", "relative-directory"],
        ["FFV_SMOKE_FIXTURE", ""],
        ["FFV_SMOKE_FIXTURE", "relative.fit"],
    ])("rejects invalid %s before creating a profile", (name, value) => {
        expect.assertions(2);
        vi.stubEnv(name, value);
        expect(() =>
            configurePackagedSmoke(createApp() as unknown as App)
        ).toThrow("requires an absolute report directory");
        expect(existsSync(path.join(directory, "user-data"))).toBe(false);
    });

    it("requires Electron when smoke mode is explicitly requested", () => {
        expect.assertions(1);
        expect(() => configurePackagedSmoke()).toThrow(
            "requires an absolute report directory"
        );
    });

    it("isolates the profile, prevents updates and writes a successful visible FIT report", async () => {
        expect.assertions(6);
        const app = createApp();
        const window = createWindow();
        configurePackagedSmoke(app as unknown as App);
        app.emit(
            "browser-window-created",
            {},
            window as unknown as BrowserWindow
        );
        await vi.waitUntil(() => app.exit.mock.calls.length > 0);
        expect(app.exit).toHaveBeenCalledWith(0);
        expect(app.setPath).toHaveBeenCalledWith(
            "userData",
            path.join(directory, "user-data")
        );
        expect(setAutoUpdaterInitialized).toHaveBeenCalledWith(true);
        expect(approveFilePath).toHaveBeenCalledWith(
            path.join(directory, "activity.fit"),
            { source: "packaged-smoke" }
        );
        expect(
            JSON.parse(
                readFileSync(path.join(directory, "report.json"), "utf8")
            )
        ).toMatchObject({
            nonce: "test-nonce",
            status: "passed",
            visible: true,
            activity: { recordCount: 1285, sessionCount: 1 },
        });
        expect(
            readFileSync(path.join(directory, "screenshot.png"), "utf8")
        ).toBe("screenshot");
    });

    it("reports FIT parsing failures and exits unsuccessfully", async () => {
        expect.assertions(2);
        const app = createApp();
        const window = createWindow();
        window.webContents.executeJavaScript
            .mockReset()
            .mockResolvedValueOnce(true)
            .mockRejectedValueOnce(new Error("FIT smoke failed: read denied"));
        configurePackagedSmoke(app as unknown as App);
        app.emit(
            "browser-window-created",
            {},
            window as unknown as BrowserWindow
        );
        await vi.waitUntil(() => app.exit.mock.calls.length > 0);
        expect(app.exit).toHaveBeenCalledWith(1);
        expect(
            JSON.parse(
                readFileSync(path.join(directory, "report.json"), "utf8")
            )
        ).toMatchObject({
            status: "failed",
            error: "FIT smoke failed: read denied",
        });
    });

    it("reports an explicit readiness deadline failure without loading a fixture", async () => {
        expect.assertions(3);
        const app = createApp();
        const mainWindow = createWindow();
        mainWindow.isVisible.mockReturnValue(false);
        configurePackagedSmoke(app as unknown as App);
        app.emit(
            "browser-window-created",
            {},
            mainWindow as unknown as BrowserWindow
        );
        await vi.waitUntil(() => app.exit.mock.calls.length > 0, {
            timeout: 35_000,
        });
        expect(app.exit).toHaveBeenCalledWith(1);
        expect(
            JSON.parse(
                readFileSync(path.join(directory, "report.json"), "utf8")
            )
        ).toMatchObject({
            status: "failed",
            error: "Visible renderer UI did not initialize",
        });
        expect(mainWindow.webContents.executeJavaScript).not.toHaveBeenCalled();
    }, 40_000);

    it("preserves the original failure and exits if the report directory disappears", async () => {
        expect.assertions(4);
        const errorLogger = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        const app = createApp();
        const mainWindow = createWindow();
        mainWindow.webContents.executeJavaScript
            .mockReset()
            .mockImplementationOnce(async () => {
                rmSync(directory, { recursive: true, force: true });
                throw new Error("Original renderer failure");
            });
        configurePackagedSmoke(app as unknown as App);
        app.emit(
            "browser-window-created",
            {},
            mainWindow as unknown as BrowserWindow
        );
        await vi.waitUntil(() => app.exit.mock.calls.length > 0);
        expect(app.exit).toHaveBeenCalledWith(1);
        expect(errorLogger).toHaveBeenCalledWith(
            "[packaged-smoke] Original renderer failure"
        );
        expect(errorLogger).toHaveBeenCalledWith(
            expect.stringContaining("Unable to write failure report:")
        );
        expect(existsSync(path.join(directory, "report.json"))).toBe(false);
    });

    it("fails renderer crashes even if the load probe later resolves", async () => {
        expect.assertions(2);
        const app = createApp();
        const window = createWindow();
        window.webContents.executeJavaScript
            .mockReset()
            .mockImplementationOnce(async () => {
                window.webContents.emit(
                    "render-process-gone",
                    {},
                    { reason: "crashed", exitCode: 11 }
                );
                return true;
            })
            .mockResolvedValueOnce({ recordCount: 1285, sessionCount: 1 });
        configurePackagedSmoke(app as unknown as App);
        app.emit(
            "browser-window-created",
            {},
            window as unknown as BrowserWindow
        );
        await vi.waitUntil(() => app.exit.mock.calls.length > 0);
        expect(app.exit).toHaveBeenCalledWith(1);
        expect(
            JSON.parse(
                readFileSync(path.join(directory, "report.json"), "utf8")
            )
        ).toMatchObject({
            status: "failed",
            error: "Renderer terminated: crashed (11)",
        });
    });

    it("does not publish success when the renderer crashes during capture", async () => {
        expect.assertions(3);
        const app = createApp();
        const mainWindow = createWindow();
        mainWindow.webContents.capturePage.mockImplementation(async () => {
            mainWindow.webContents.emit(
                "render-process-gone",
                {},
                { reason: "crashed", exitCode: 11 }
            );
            return { toPNG: () => Buffer.from("stale screenshot") };
        });
        configurePackagedSmoke(app as unknown as App);
        app.emit(
            "browser-window-created",
            {},
            mainWindow as unknown as BrowserWindow
        );
        await vi.waitUntil(() => app.exit.mock.calls.length > 0);
        expect(app.exit).toHaveBeenCalledWith(1);
        expect(
            JSON.parse(
                readFileSync(path.join(directory, "report.json"), "utf8")
            )
        ).toMatchObject({
            status: "failed",
            error: "Renderer terminated: crashed (11)",
        });
        expect(existsSync(path.join(directory, "screenshot.png"))).toBe(false);
    });
});
