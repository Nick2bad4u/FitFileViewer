import { afterEach, describe, expect, it, vi } from "vitest";

import { getBrowserRendererRuntimeEnvironmentScope } from "../../../electron-app/renderer/rendererBrowserRuntime.js";
import { createRendererRuntimeEnvironment as createRuntimeEnvironment } from "../../../electron-app/renderer/runtimeEnvironment.js";

describe("renderer runtime environment", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates the production browser scope explicitly", () => {
        expect.assertions(5);

        const environment = createRuntimeEnvironment(
            getBrowserRendererRuntimeEnvironmentScope()
        );

        expect(environment.console).toBe(console);
        expect(environment.documentTarget).toBe(document);
        expect(environment.rendererEventTarget).toBe(globalThis);
        expect(typeof environment.addEventListener).toBe("function");
        expect(typeof environment.setTimeout).toBe("function");
    });

    it("resolves the production browser electron API from the runtime scope", () => {
        expect.assertions(2);

        const electronApiFixture = {};

        vi.stubGlobal("electronAPI", electronApiFixture);

        const environment = createRuntimeEnvironment(
            getBrowserRendererRuntimeEnvironmentScope()
        );

        expect(environment.electronApiScope.getElectronAPI()).toBe(
            electronApiFixture
        );
        expect(environment.rendererEventTarget).toBe(globalThis);
    });

    it("captures browser globals through named providers", () => {
        expect.assertions(20);

        const electronApiFixture = {};
        const replacementElectronApiFixture = {};
        const legacyRendererGlobalElectronApi = {};
        const rendererGlobal = {
            addEventListener: vi.fn(function addEventListener(this: unknown) {
                return this;
            }),
            clearInterval: vi.fn(function clearInterval(this: unknown) {
                return this;
            }),
            console,
            document,
            electronAPI: legacyRendererGlobalElectronApi,
            removeEventListener: vi.fn(function removeEventListener(
                this: unknown
            ) {
                return this;
            }),
            setInterval: vi.fn(function setInterval(this: unknown) {
                return this;
            }),
            setTimeout: vi.fn(function setTimeout(this: unknown) {
                return this;
            }),
        } as unknown as Window & typeof globalThis;
        const getAddEventListener = vi.fn(() =>
            rendererGlobal.addEventListener.bind(rendererGlobal)
        );
        const getClearInterval = vi.fn(() =>
            rendererGlobal.clearInterval.bind(rendererGlobal)
        );
        const getConsole = vi.fn(() => console);
        const getDocument = vi.fn(() => document);
        const getElectronAPI = vi.fn(() => electronApiFixture);
        const getRemoveEventListener = vi.fn(() =>
            rendererGlobal.removeEventListener.bind(rendererGlobal)
        );
        const getRendererEventTarget = vi.fn(() => rendererGlobal);
        const getSetInterval = vi.fn(() =>
            rendererGlobal.setInterval.bind(rendererGlobal)
        );
        const getSetTimeout = vi.fn(() =>
            rendererGlobal.setTimeout.bind(rendererGlobal)
        );

        const environment = createRuntimeEnvironment({
            getAddEventListener,
            getClearInterval,
            getConsole,
            getDocument,
            getElectronAPI,
            getRemoveEventListener,
            getRendererEventTarget,
            getSetInterval,
            getSetTimeout,
        });
        getElectronAPI.mockReturnValue(replacementElectronApiFixture);

        expect(environment.console).toBe(console);
        expect(environment.documentTarget).toBe(document);
        expect(environment.electronApiScope.getElectronAPI()).toBe(
            electronApiFixture
        );
        expect(environment.electronApiScope.getElectronAPI()).not.toBe(
            legacyRendererGlobalElectronApi
        );
        expect(environment.electronApiScope.getElectronAPI()).not.toBe(
            replacementElectronApiFixture
        );
        expect(environment.rendererEventTarget).toBe(rendererGlobal);
        expect(environment.addEventListener("load", vi.fn())).toBe(
            rendererGlobal
        );
        expect(environment.removeEventListener("load", vi.fn())).toBe(
            rendererGlobal
        );
        expect(environment.setTimeout(vi.fn(), 0)).toBe(rendererGlobal);
        expect(environment.setInterval(vi.fn(), 0)).toBe(rendererGlobal);
        expect(environment.clearInterval(1)).toBe(rendererGlobal);
        expect(getAddEventListener).toHaveBeenCalledOnce();
        expect(getClearInterval).toHaveBeenCalledOnce();
        expect(getConsole).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledOnce();
        expect(getElectronAPI).toHaveBeenCalledOnce();
        expect(getRemoveEventListener).toHaveBeenCalledOnce();
        expect(getRendererEventTarget).toHaveBeenCalledOnce();
        expect(getSetInterval).toHaveBeenCalledOnce();
        expect(getSetTimeout).toHaveBeenCalledOnce();
    });

    it("throws when required runtime providers are unavailable", () => {
        expect.assertions(3);

        expect(() => createRuntimeEnvironment({})).toThrow(
            "renderer runtime environment requires addEventListener"
        );
        expect(() =>
            createRuntimeEnvironment({
                getAddEventListener: () => vi.fn(),
                getClearInterval: () => vi.fn(),
                getConsole: () => console,
                getDocument: () => document,
                getElectronAPI: () => undefined,
                getRemoveEventListener: () => vi.fn(),
                getSetInterval: () => vi.fn(),
                getSetTimeout: () => vi.fn(),
            })
        ).toThrow(
            "renderer runtime environment requires a renderer event target"
        );
        expect(() =>
            createRuntimeEnvironment({
                getAddEventListener: () => vi.fn(),
                getClearInterval: () => vi.fn(),
                getConsole: () => console,
                getDocument: () => document,
                getRemoveEventListener: () => vi.fn(),
                getRendererEventTarget: () => globalThis,
                getSetInterval: () => vi.fn(),
                getSetTimeout: () => vi.fn(),
            } as unknown as Parameters<typeof createRuntimeEnvironment>[0])
        ).toThrow(
            "renderer runtime environment requires an electron API provider"
        );
    });

    it("ignores legacy direct scoped timer and DOM providers", () => {
        expect.assertions(15);

        const electronApiFixture = {};
        const legacyRendererGlobalElectronApi = {};
        const rendererGlobal = {
            addEventListener: vi.fn(function addEventListener(this: unknown) {
                return this;
            }),
            clearInterval: vi.fn(function clearInterval(this: unknown) {
                return this;
            }),
            console,
            document,
            electronAPI: legacyRendererGlobalElectronApi,
            removeEventListener: vi.fn(function removeEventListener(
                this: unknown
            ) {
                return this;
            }),
            setInterval: vi.fn(function setInterval(this: unknown) {
                return this;
            }),
            setTimeout: vi.fn(function setTimeout(this: unknown) {
                return this;
            }),
        } as unknown as Window & typeof globalThis;
        const legacyDirectElectronApi = {};
        const legacyDirectScope = {
            addEventListener: rendererGlobal.addEventListener,
            clearInterval: rendererGlobal.clearInterval,
            console,
            document,
            electronAPI: legacyDirectElectronApi,
            removeEventListener: rendererGlobal.removeEventListener,
            rendererGlobal,
            setInterval: rendererGlobal.setInterval,
            setTimeout: rendererGlobal.setTimeout,
        };
        const listenerController = new AbortController();

        expect(() =>
            createRuntimeEnvironment(
                legacyDirectScope as unknown as Parameters<
                    typeof createRuntimeEnvironment
                >[0]
            )
        ).toThrow("renderer runtime environment requires addEventListener");

        const environment = createRuntimeEnvironment({
            ...legacyDirectScope,
            getAddEventListener: () =>
                rendererGlobal.addEventListener.bind(rendererGlobal),
            getClearInterval: () =>
                rendererGlobal.clearInterval.bind(rendererGlobal),
            getConsole: () => console,
            getDocument: () => document,
            getElectronAPI: () => electronApiFixture,
            getRemoveEventListener: () =>
                rendererGlobal.removeEventListener.bind(rendererGlobal),
            getRendererEventTarget: () => rendererGlobal,
            getSetInterval: () =>
                rendererGlobal.setInterval.bind(rendererGlobal),
            getSetTimeout: () => rendererGlobal.setTimeout.bind(rendererGlobal),
        } as unknown as Parameters<typeof createRuntimeEnvironment>[0]);

        expect(environment.rendererEventTarget).toBe(rendererGlobal);
        expect(
            environment.addEventListener("load", vi.fn(), {
                signal: listenerController.signal,
            })
        ).toBe(rendererGlobal);
        expect(environment.removeEventListener("load", vi.fn())).toBe(
            rendererGlobal
        );
        expect(environment.setTimeout(vi.fn(), 0)).toBe(rendererGlobal);
        expect(environment.setInterval(vi.fn(), 0)).toBe(rendererGlobal);
        expect(environment.clearInterval(1)).toBe(rendererGlobal);
        expect(rendererGlobal.addEventListener).toHaveBeenCalledOnce();
        expect(rendererGlobal.removeEventListener).toHaveBeenCalledOnce();
        expect(rendererGlobal.setTimeout).toHaveBeenCalledOnce();
        expect(rendererGlobal.setInterval).toHaveBeenCalledOnce();
        expect(rendererGlobal.clearInterval).toHaveBeenCalledOnce();
        expect(environment.electronApiScope.getElectronAPI()).toBe(
            electronApiFixture
        );
        expect(environment.electronApiScope.getElectronAPI()).not.toBe(
            legacyDirectElectronApi
        );
        expect(environment.electronApiScope.getElectronAPI()).not.toBe(
            legacyRendererGlobalElectronApi
        );
        listenerController.abort();
    });
});
