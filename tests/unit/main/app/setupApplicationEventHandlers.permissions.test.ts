import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import type { Mock } from "vitest";

type AppEventHandler = (...args: unknown[]) => void;
type CheckPermissionHandler = (
    webContents: unknown,
    permission: string,
    requestingOrigin?: string,
    details?: PermissionDetailsLike
) => boolean;
type MockSession = {
    setPermissionCheckHandler: Mock<(handler: CheckPermissionHandler) => void>;
    setPermissionRequestHandler: Mock<
        (handler: PermissionRequestHandler) => void
    >;
};
type MockWebContents = {
    on: Mock<(eventName: string, handler: AppEventHandler) => void>;
    session: MockSession;
    setWindowOpenHandler: Mock<(handler: AppEventHandler) => void>;
};
type PermissionDecisionCallback = (allowed: boolean) => void;
type PermissionRequestHandler = (
    webContents: unknown,
    permission: string,
    callback: PermissionDecisionCallback
) => void;
type PermissionDetailsLike =
    | {
          requestingOrigin?: string;
          requestingURL?: string;
          requestingUrl?: string;
      }
    | null
    | undefined;
type SetupHandlersModule = {
    setupApplicationEventHandlers: () => void;
};
type AppStateModule = {
    setAppState: (key: string, value: unknown) => void;
};
type WebContentsCreatedHandler = (
    event: unknown,
    contents: MockWebContents
) => void;

function assertFunction<T extends (...args: unknown[]) => unknown>(
    candidate: unknown,
    label: string
): asserts candidate is T {
    if (typeof candidate !== "function") {
        throw new TypeError(`${label} was not registered`);
    }
}

async function setElectronOverrideForTest(override: unknown): Promise<void> {
    const { setElectronOverride } =
        await import("../../../../electron-app/main/runtime/electronAccess.js");
    setElectronOverride(override);
}

async function importSetupHandlers(): Promise<SetupHandlersModule> {
    return (await import("../../../../electron-app/main/app/setupApplicationEventHandlers.js")) as SetupHandlersModule;
}

async function importAppState(): Promise<AppStateModule> {
    return (await import("../../../../electron-app/main/state/appState.js")) as AppStateModule;
}

describe("setupApplicationEventHandlers permission hardening", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = "test";
    });

    afterEach(async () => {
        // Ensure no stale override leaks into other suites.
        await setElectronOverrideForTest(null);
        vi.restoreAllMocks();
    });

    it("registers permission handlers on web-contents-created (geolocation allowed in test mode)", async () => {
        expect.assertions(6);

        const handlers = new Map<string, AppEventHandler>();

        const mockApp = {
            on: vi.fn<(eventName: string, callback: AppEventHandler) => void>(
                (eventName, callback) => {
                    handlers.set(eventName, callback);
                }
            ),
            quit: vi.fn<() => void>(),
        };

        const mockSession: MockSession = {
            setPermissionRequestHandler:
                vi.fn<(handler: PermissionRequestHandler) => void>(),
            setPermissionCheckHandler:
                vi.fn<(handler: CheckPermissionHandler) => void>(),
        };

        await setElectronOverrideForTest({
            app: mockApp,
            shell: { openExternal: vi.fn<(url: string) => Promise<void>>() },
        });

        const { setupApplicationEventHandlers } = await importSetupHandlers();
        setupApplicationEventHandlers();
        (await importAppState()).setAppState(
            "permissions.geolocation.allowed",
            null
        );

        const webContentsCreatedHandler = handlers.get("web-contents-created");
        assertFunction<WebContentsCreatedHandler>(
            webContentsCreatedHandler,
            "web-contents-created handler"
        );

        const contents: MockWebContents = {
            on: vi.fn<(eventName: string, handler: AppEventHandler) => void>(),
            setWindowOpenHandler: vi.fn<(handler: AppEventHandler) => void>(),
            session: mockSession,
        };

        webContentsCreatedHandler({}, contents);

        expect(mockSession.setPermissionRequestHandler).toHaveBeenCalledOnce();
        expect(mockSession.setPermissionCheckHandler).toHaveBeenCalledOnce();

        // Ensure the request handler allows geolocation in test mode (no dialog).
        const requestHandler =
            mockSession.setPermissionRequestHandler.mock.calls[0]?.[0];
        assertFunction<PermissionRequestHandler>(
            requestHandler,
            "permission request handler"
        );

        const callback = vi.fn<PermissionDecisionCallback>();
        requestHandler({}, "geolocation", callback);
        expect(callback).toHaveBeenCalledWith(true);

        const deniedCallback = vi.fn<PermissionDecisionCallback>();
        requestHandler({}, "camera", deniedCallback);
        expect(deniedCallback).toHaveBeenCalledWith(false);
        expect(deniedCallback).not.toHaveBeenCalledWith(true);

        const checkHandler =
            mockSession.setPermissionCheckHandler.mock.calls[0]?.[0];
        assertFunction<CheckPermissionHandler>(
            checkHandler,
            "permission check handler"
        );
        expect({
            cameraAllowed: checkHandler({}, "camera"),
            geolocationAllowed: checkHandler(
                {},
                "geolocation",
                "file:///app/index.html",
                { requestingUrl: "file:///app/index.html" }
            ),
        }).toStrictEqual({
            cameraAllowed: false,
            geolocationAllowed: true,
        });
    });

    it("denies geolocation permission checks until an explicit allow is cached", async () => {
        expect.assertions(4);

        process.env.NODE_ENV = "production";
        vi.resetModules();

        const handlers = new Map<string, AppEventHandler>();
        const mockSession: MockSession = {
            setPermissionRequestHandler:
                vi.fn<(handler: PermissionRequestHandler) => void>(),
            setPermissionCheckHandler:
                vi.fn<(handler: CheckPermissionHandler) => void>(),
        };

        await setElectronOverrideForTest({
            app: {
                on: vi.fn<
                    (eventName: string, callback: AppEventHandler) => void
                >((eventName, callback) => {
                    handlers.set(eventName, callback);
                }),
                quit: vi.fn<() => void>(),
            },
            shell: { openExternal: vi.fn<(url: string) => Promise<void>>() },
        });

        const { setupApplicationEventHandlers } = await importSetupHandlers();
        setupApplicationEventHandlers();

        const webContentsCreatedHandler = handlers.get("web-contents-created");
        assertFunction<WebContentsCreatedHandler>(
            webContentsCreatedHandler,
            "web-contents-created handler"
        );

        webContentsCreatedHandler(
            {},
            {
                on: vi.fn<
                    (eventName: string, handler: AppEventHandler) => void
                >(),
                session: mockSession,
                setWindowOpenHandler:
                    vi.fn<(handler: AppEventHandler) => void>(),
            }
        );

        const checkHandler =
            mockSession.setPermissionCheckHandler.mock.calls[0]?.[0];
        assertFunction<CheckPermissionHandler>(
            checkHandler,
            "permission check handler"
        );

        expect(
            checkHandler({}, "geolocation", "file:///app/index.html", {
                requestingUrl: "file:///app/index.html",
            })
        ).toBe(false);
        expect(checkHandler({}, "camera", "file:///app/index.html")).toBe(
            false
        );
        expect(
            checkHandler({}, "geolocation", "https://zwiftmap.com/", {
                requestingUrl: "https://zwiftmap.com/",
            })
        ).toBe(false);

        (await importAppState()).setAppState(
            "permissions.geolocation.allowed",
            true
        );
        expect(
            checkHandler({}, "geolocation", "about:blank", {
                requestingUrl: "about:blank",
            })
        ).toBe(false);
    });

    it("registers session permission handlers once per session object", async () => {
        expect.assertions(3);

        const handlers = new Map<string, AppEventHandler>();
        const mockSession: MockSession = {
            setPermissionRequestHandler:
                vi.fn<(handler: PermissionRequestHandler) => void>(),
            setPermissionCheckHandler:
                vi.fn<(handler: CheckPermissionHandler) => void>(),
        };

        await setElectronOverrideForTest({
            app: {
                on: vi.fn<
                    (eventName: string, callback: AppEventHandler) => void
                >((eventName, callback) => {
                    handlers.set(eventName, callback);
                }),
                quit: vi.fn<() => void>(),
            },
            shell: { openExternal: vi.fn<(url: string) => Promise<void>>() },
        });

        const { setupApplicationEventHandlers } = await importSetupHandlers();
        setupApplicationEventHandlers();

        const webContentsCreatedHandler = handlers.get("web-contents-created");
        assertFunction<WebContentsCreatedHandler>(
            webContentsCreatedHandler,
            "web-contents-created handler"
        );

        const contents: MockWebContents = {
            on: vi.fn<(eventName: string, handler: AppEventHandler) => void>(),
            session: mockSession,
            setWindowOpenHandler: vi.fn<(handler: AppEventHandler) => void>(),
        };

        webContentsCreatedHandler({}, contents);
        webContentsCreatedHandler({}, contents);

        const requestHandler =
            mockSession.setPermissionRequestHandler.mock.calls[0]?.[0];
        const checkHandler =
            mockSession.setPermissionCheckHandler.mock.calls[0]?.[0];
        assertFunction<PermissionRequestHandler>(
            requestHandler,
            "permission request handler"
        );
        assertFunction<CheckPermissionHandler>(
            checkHandler,
            "permission check handler"
        );

        let geolocationDecision: boolean | null = null;
        requestHandler({}, "geolocation", (allowed) => {
            geolocationDecision = allowed;
        });

        expect(mockSession.setPermissionRequestHandler).toHaveBeenCalledOnce();
        expect(mockSession.setPermissionCheckHandler).toHaveBeenCalledOnce();
        expect({
            geolocationDecision,
            trustedCheckAllowed: checkHandler(
                {},
                "geolocation",
                "file:///app/index.html",
                { requestingUrl: "file:///app/index.html" }
            ),
        }).toStrictEqual({
            geolocationDecision: true,
            trustedCheckAllowed: true,
        });
    });

    it("replaces app listeners (no EventEmitter listener leaks)", async () => {
        expect.assertions(1);

        class MockApp extends EventEmitter {
            quit() {
                // no-op
            }
        }

        const appEmitter = new MockApp();

        await setElectronOverrideForTest({
            app: appEmitter,
            shell: { openExternal: vi.fn<(url: string) => Promise<void>>() },
        });

        const { setupApplicationEventHandlers } = await importSetupHandlers();

        setupApplicationEventHandlers();
        const activateCount1 = appEmitter.listenerCount("activate");
        const wccCount1 = appEmitter.listenerCount("web-contents-created");

        setupApplicationEventHandlers();
        const activateCount2 = appEmitter.listenerCount("activate");
        const wccCount2 = appEmitter.listenerCount("web-contents-created");

        expect({
            afterFirstSetup: {
                activate: activateCount1,
                webContentsCreated: wccCount1,
            },
            afterSecondSetup: {
                activate: activateCount2,
                webContentsCreated: wccCount2,
            },
        }).toStrictEqual({
            afterFirstSetup: {
                activate: 1,
                webContentsCreated: 1,
            },
            afterSecondSetup: {
                activate: 1,
                webContentsCreated: 1,
            },
        });
    });
});
