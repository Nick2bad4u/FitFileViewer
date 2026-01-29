import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import { EventEmitter } from "node:events";

const requireCjs = createRequire(import.meta.url);

function clearMainRequireCache() {
    const electronAccessPath = requireCjs.resolve("../../../../main/runtime/electronAccess");
    const setupHandlersPath = requireCjs.resolve("../../../../main/app/setupApplicationEventHandlers");
    // eslint-disable-next-line security/detect-object-injection
    delete requireCjs.cache[electronAccessPath];
    // eslint-disable-next-line security/detect-object-injection
    delete requireCjs.cache[setupHandlersPath];
}

describe("setupApplicationEventHandlers permission hardening", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = "test";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).__electronHoistedMock = null;
        clearMainRequireCache();
    });

    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).__electronHoistedMock = null;

        try {
            // Ensure no stale override leaks into other suites.
            const electronAccess = requireCjs("../../../../main/runtime/electronAccess");
            electronAccess.setElectronOverride?.(null);
        } catch {
            /* ignore */
        }

        clearMainRequireCache();
        vi.restoreAllMocks();
    });

    it("registers permission handlers on web-contents-created (geolocation allowed in test mode)", async () => {
        const handlers = new Map<string, Function>();

        const mockApp = {
            on: vi.fn((evt: string, cb: Function) => {
                handlers.set(evt, cb);
            }),
            quit: vi.fn(),
        };

        const mockSession = {
            setPermissionRequestHandler: vi.fn(),
            setPermissionCheckHandler: vi.fn(),
        };

        const electronAccess = requireCjs("../../../../main/runtime/electronAccess");
        electronAccess.setElectronOverride({ app: mockApp, shell: { openExternal: vi.fn() } });

        const { setupApplicationEventHandlers } = requireCjs("../../../../main/app/setupApplicationEventHandlers");
        setupApplicationEventHandlers();

        const webContentsCreatedHandler = handlers.get("web-contents-created");
        expect(typeof webContentsCreatedHandler).toBe("function");

        const contents = {
            on: vi.fn(),
            setWindowOpenHandler: vi.fn(),
            session: mockSession,
        };

        webContentsCreatedHandler?.({}, contents);

        expect(mockSession.setPermissionRequestHandler).toHaveBeenCalledTimes(1);
        expect(mockSession.setPermissionCheckHandler).toHaveBeenCalledTimes(1);

        // Ensure the request handler allows geolocation in test mode (no dialog).
        const requestHandler = mockSession.setPermissionRequestHandler.mock.calls[0]?.[0];
        expect(typeof requestHandler).toBe("function");

        const callback = vi.fn();
        requestHandler({}, "geolocation", callback);
        expect(callback).toHaveBeenCalledWith(true);

        const checkHandler = mockSession.setPermissionCheckHandler.mock.calls[0]?.[0];
        expect(typeof checkHandler).toBe("function");
        expect(checkHandler("camera")).toBe(false);
    });

    it("replaces app listeners (no EventEmitter listener leaks)", async () => {
        class MockApp extends EventEmitter {
            quit() {
                // no-op
            }
        }

        const appEmitter = new MockApp();

        const electronAccess = requireCjs("../../../../main/runtime/electronAccess");
        electronAccess.setElectronOverride({ app: appEmitter, shell: { openExternal: vi.fn() } });

        const { setupApplicationEventHandlers } = requireCjs("../../../../main/app/setupApplicationEventHandlers");

        setupApplicationEventHandlers();
        const activateCount1 = appEmitter.listenerCount("activate");
        const wccCount1 = appEmitter.listenerCount("web-contents-created");

        setupApplicationEventHandlers();
        const activateCount2 = appEmitter.listenerCount("activate");
        const wccCount2 = appEmitter.listenerCount("web-contents-created");

        expect(activateCount1).toBe(1);
        expect(wccCount1).toBe(1);
        expect(activateCount2).toBe(1);
        expect(wccCount2).toBe(1);
    });
});
