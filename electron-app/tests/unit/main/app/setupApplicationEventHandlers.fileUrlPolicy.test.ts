import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("setupApplicationEventHandlers file:// policy", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = "production";
    });

    afterEach(async () => {
        // Ensure we don't leak Electron overrides across tests.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).__electronHoistedMock = null;

        try {
            const { setElectronOverride } = await import("../../../../main/runtime/electronAccess.js");
            setElectronOverride(null);
        } catch {
            /* ignore */
        }

        vi.restoreAllMocks();
    });

    it("denies file:// URLs outside the app bundle in production", async () => {
        const handlers = new Map<string, Function>();

        const mockShell = { openExternal: vi.fn().mockResolvedValue(undefined) };
        const mockApp = {
            getAppPath: vi.fn(() => "C:\\mock\\app"),
            on: vi.fn((evt: string, cb: Function) => {
                handlers.set(evt, cb);
            }),
            quit: vi.fn(),
        };

        // Provide an Electron override so main/runtime/electronAccess.js can resolve app/shell.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).__electronHoistedMock = {
            app: mockApp,
            BrowserWindow: {},
            shell: mockShell,
        };

        // Ensure electronAccess uses the per-test override even if it's already loaded.
        const { setElectronOverride } = await import("../../../../main/runtime/electronAccess.js");
        setElectronOverride((globalThis as any).__electronHoistedMock);

        const { setupApplicationEventHandlers } = await import("../../../../main/app/setupApplicationEventHandlers.js");
        setupApplicationEventHandlers();

        const webContentsCreatedHandler = handlers.get("web-contents-created");
        expect(typeof webContentsCreatedHandler).toBe("function");

        type WindowOpenHandler = (details: { url: string }) => { action: "allow" | "deny" };
        let windowOpenHandler: WindowOpenHandler | null = null;

        const contentsHandlers: Record<string, (event: any, url: string) => void> = {};

        const contents = {
            on: vi.fn((evt: string, handler: (event: any, url: string) => void) => {
                contentsHandlers[evt] = handler;
            }),
            setWindowOpenHandler: vi.fn((fn: any) => {
                windowOpenHandler = fn;
            }),
        };

        webContentsCreatedHandler?.({}, contents);

        expect(typeof windowOpenHandler).toBe("function");
        expect(typeof contentsHandlers["will-navigate"]).toBe("function");

        const allowedFileUrl = pathToFileURL("C:\\mock\\app\\index.html").toString();
        const disallowedFileUrl = pathToFileURL("C:\\other\\secret.html").toString();

        expect(windowOpenHandler).not.toBeNull();
        const windowOpen = windowOpenHandler as unknown as WindowOpenHandler;
        expect(windowOpen({ url: allowedFileUrl })).toEqual({ action: "allow" });
        expect(windowOpen({ url: disallowedFileUrl })).toEqual({ action: "deny" });

        const preventDefault = vi.fn();
        const willNavigate = contentsHandlers["will-navigate"];
        willNavigate({ preventDefault }, disallowedFileUrl);
        expect(preventDefault).toHaveBeenCalled();

        const preventDefault2 = vi.fn();
        willNavigate({ preventDefault: preventDefault2 }, allowedFileUrl);
        expect(preventDefault2).not.toHaveBeenCalled();
    });

    it("allows blob: downloads but blocks http(s) downloads", async () => {
        const handlers = new Map<string, Function>();

        const mockShell = { openExternal: vi.fn().mockResolvedValue(undefined) };
        const mockApp = {
            getAppPath: vi.fn(() => "C:\\mock\\app"),
            on: vi.fn((evt: string, cb: Function) => {
                handlers.set(evt, cb);
            }),
            quit: vi.fn(),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).__electronHoistedMock = {
            app: mockApp,
            BrowserWindow: {},
            shell: mockShell,
        };

        const { setElectronOverride } = await import("../../../../main/runtime/electronAccess.js");
        setElectronOverride((globalThis as any).__electronHoistedMock);

        const { setupApplicationEventHandlers } = await import("../../../../main/app/setupApplicationEventHandlers.js");
        setupApplicationEventHandlers();

        const webContentsCreatedHandler = handlers.get("web-contents-created");
        expect(typeof webContentsCreatedHandler).toBe("function");

        let willDownloadHandler: ((event: any, item: any) => void) | null = null;
        const mockSession = {
            on: vi.fn((evt: string, cb: any) => {
                if (evt === "will-download") {
                    willDownloadHandler = cb;
                }
            }),
        };

        const contents = {
            on: vi.fn(),
            setWindowOpenHandler: vi.fn(),
            session: mockSession,
        };

        webContentsCreatedHandler?.({}, contents);

        expect(mockSession.on).toHaveBeenCalled();
        expect(typeof willDownloadHandler).toBe("function");

        // Allow blob: (export)
        {
            const preventDefault = vi.fn();
            const cancel = vi.fn();
            willDownloadHandler?.(
                { preventDefault },
                {
                    getURL: () => "blob:fitfileviewer://export/123",
                    cancel,
                }
            );
            expect(preventDefault).not.toHaveBeenCalled();
            expect(cancel).not.toHaveBeenCalled();
        }

        // Block https:
        {
            const preventDefault = vi.fn();
            const cancel = vi.fn();
            willDownloadHandler?.(
                { preventDefault },
                {
                    getURL: () => "https://example.com/file.zip",
                    cancel,
                }
            );
            expect(preventDefault).toHaveBeenCalled();
            expect(cancel).toHaveBeenCalled();
        }
    });
});
