import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

type AppEventHandler = (...args: unknown[]) => void;
type ElectronOverrideGlobal = typeof globalThis & {
    __electronHoistedMock?: MockElectron | null;
};
type MockElectron = {
    app: {
        getAppPath: Mock<() => string>;
        on: Mock<(eventName: string, callback: AppEventHandler) => void>;
        quit: Mock<() => void>;
    };
    BrowserWindow: Record<string, never>;
    shell: {
        openExternal: Mock<(url: string) => Promise<void>>;
    };
};
type NavigationEvent = {
    preventDefault: Mock<() => void>;
};
type NavigationHandler = (event: NavigationEvent, url: string) => void;
type WindowOpenHandler = (details: { url: string }) => {
    action: "allow" | "deny";
};
type DownloadEvent = {
    preventDefault: Mock<() => void>;
};
type DownloadItem = {
    cancel: Mock<() => void>;
    getURL: () => string;
};
type DownloadHandler = (event: DownloadEvent, item: DownloadItem) => void;
type MockWebContents = {
    on: Mock<(eventName: string, handler: NavigationHandler) => void>;
    session?: {
        on: Mock<(eventName: string, callback: DownloadHandler) => void>;
    };
    setWindowOpenHandler: Mock<(handler: WindowOpenHandler) => void>;
};
type WebContentsCreatedHandler = (
    event: unknown,
    contents: MockWebContents
) => void;

const testGlobal = globalThis as ElectronOverrideGlobal;

function assertFunction<T extends (...args: unknown[]) => unknown>(
    candidate: unknown,
    label: string
): asserts candidate is T {
    if (typeof candidate !== "function") {
        throw new TypeError(`${label} was not registered`);
    }
}

function createMockElectron(
    handlers: Map<string, AppEventHandler>
): MockElectron {
    return {
        app: {
            getAppPath: vi.fn<() => string>(() => "C:\\mock\\app"),
            on: vi.fn<(eventName: string, callback: AppEventHandler) => void>(
                (eventName, callback) => {
                    handlers.set(eventName, callback);
                }
            ),
            quit: vi.fn<() => void>(),
        },
        BrowserWindow: {},
        shell: {
            openExternal: vi
                .fn<(url: string) => Promise<void>>()
                .mockResolvedValue(undefined),
        },
    };
}

describe("setupApplicationEventHandlers file:// policy", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = "production";
    });

    afterEach(async () => {
        // Ensure we don't leak Electron overrides across tests.
        testGlobal.__electronHoistedMock = null;

        try {
            const { setElectronOverride } =
                await import("../../../../electron-app/main/runtime/electronAccess.js");
            setElectronOverride(null);
        } catch {
            /* ignore */
        }

        vi.restoreAllMocks();
    });

    it("denies file:// URLs outside the app bundle in production", async () => {
        expect.assertions(4);

        const handlers = new Map<string, AppEventHandler>();
        const mockElectron = createMockElectron(handlers);

        // Provide an Electron override so main/runtime/electronAccess.js can resolve app/shell.
        testGlobal.__electronHoistedMock = mockElectron;

        // Ensure electronAccess uses the per-test override even if it's already loaded.
        const { setElectronOverride } =
            await import("../../../../electron-app/main/runtime/electronAccess.js");
        setElectronOverride(testGlobal.__electronHoistedMock);

        const { setupApplicationEventHandlers } =
            await import("../../../../electron-app/main/app/setupApplicationEventHandlers.js");
        setupApplicationEventHandlers();

        const webContentsCreatedHandler = handlers.get("web-contents-created");
        assertFunction<WebContentsCreatedHandler>(
            webContentsCreatedHandler,
            "web-contents-created handler"
        );
        let windowOpenHandler: WindowOpenHandler | null = null;

        const contentsHandlers: Partial<Record<string, NavigationHandler>> = {};

        const contents: MockWebContents = {
            on: vi.fn<(eventName: string, handler: NavigationHandler) => void>(
                (eventName, handler) => {
                    contentsHandlers[eventName] = handler;
                }
            ),
            setWindowOpenHandler: vi.fn<(handler: WindowOpenHandler) => void>(
                (handler) => {
                    windowOpenHandler = handler;
                }
            ),
        };

        webContentsCreatedHandler({}, contents);

        assertFunction<WindowOpenHandler>(
            windowOpenHandler,
            "window open handler"
        );
        const willNavigate = contentsHandlers["will-navigate"];
        assertFunction<NavigationHandler>(
            willNavigate,
            "will-navigate handler"
        );

        const allowedFileUrl = pathToFileURL(
            "C:\\mock\\app\\index.html"
        ).toString();
        const disallowedFileUrl = pathToFileURL(
            "C:\\other\\secret.html"
        ).toString();

        expect(windowOpenHandler({ url: allowedFileUrl })).toEqual({
            action: "allow",
        });
        expect(windowOpenHandler({ url: disallowedFileUrl })).toEqual({
            action: "deny",
        });

        const preventDefault = vi.fn<() => void>();
        willNavigate({ preventDefault }, disallowedFileUrl);
        expect(preventDefault).toHaveBeenCalledOnce();

        const preventDefault2 = vi.fn<() => void>();
        willNavigate({ preventDefault: preventDefault2 }, allowedFileUrl);
        expect(preventDefault2).not.toHaveBeenCalled();
    });

    it("allows blob: downloads but blocks http(s) downloads", async () => {
        expect.assertions(8);

        const handlers = new Map<string, AppEventHandler>();
        const mockElectron = createMockElectron(handlers);

        testGlobal.__electronHoistedMock = mockElectron;

        const { setElectronOverride } =
            await import("../../../../electron-app/main/runtime/electronAccess.js");
        setElectronOverride(testGlobal.__electronHoistedMock);

        const { setupApplicationEventHandlers } =
            await import("../../../../electron-app/main/app/setupApplicationEventHandlers.js");
        setupApplicationEventHandlers();

        const webContentsCreatedHandler = handlers.get("web-contents-created");
        assertFunction<WebContentsCreatedHandler>(
            webContentsCreatedHandler,
            "web-contents-created handler"
        );

        let willDownloadHandler: DownloadHandler | null = null;
        const mockSession = {
            on: vi.fn<(eventName: string, callback: DownloadHandler) => void>(
                (eventName, callback) => {
                    if (eventName === "will-download") {
                        willDownloadHandler = callback;
                    }
                }
            ),
        };

        const contents: MockWebContents = {
            on: vi.fn<
                (eventName: string, handler: NavigationHandler) => void
            >(),
            setWindowOpenHandler: vi.fn<(handler: WindowOpenHandler) => void>(),
            session: mockSession,
        };

        webContentsCreatedHandler({}, contents);

        const [registeredEventName, registeredHandler] =
            mockSession.on.mock.calls[0] ?? [];
        assertFunction<DownloadHandler>(
            willDownloadHandler,
            "will-download handler"
        );
        expect(registeredEventName).toBe("will-download");
        expect(registeredHandler).toBe(willDownloadHandler);
        expect(mockSession.on).toHaveBeenCalledExactlyOnceWith(
            "will-download",
            willDownloadHandler
        );

        // Allow blob: (export)
        const downloadOutcomes = {
            blockedCancelCount: 0,
            blockedPreventCount: 0,
            blobCancelCount: 0,
            blobPreventCount: 0,
        };

        {
            const preventDefault = vi.fn<() => void>(() => {
                downloadOutcomes.blobPreventCount += 1;
            });
            const cancel = vi.fn<() => void>(() => {
                downloadOutcomes.blobCancelCount += 1;
            });
            willDownloadHandler(
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
            const preventDefault = vi.fn<() => void>(() => {
                downloadOutcomes.blockedPreventCount += 1;
            });
            const cancel = vi.fn<() => void>(() => {
                downloadOutcomes.blockedCancelCount += 1;
            });
            willDownloadHandler(
                { preventDefault },
                {
                    getURL: () => "https://example.com/file.zip",
                    cancel,
                }
            );
            expect(preventDefault).toHaveBeenCalledOnce();
            expect(cancel).toHaveBeenCalledOnce();
        }

        expect(downloadOutcomes).toStrictEqual({
            blockedCancelCount: 1,
            blockedPreventCount: 1,
            blobCancelCount: 0,
            blobPreventCount: 0,
        });
    });
});
