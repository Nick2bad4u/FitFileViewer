import { describe, expect, it, vi } from "vitest";

import { createRendererRuntimeEnvironment as createRuntimeEnvironment } from "../../../electron-app/renderer/runtimeEnvironment.js";

describe("renderer runtime environment", () => {
    it("captures browser globals through named providers", () => {
        expect.assertions(19);

        const electronApiCandidate = {};
        const legacyRendererGlobalElectronApiCandidate = {};
        const rendererGlobal = {
            addEventListener: vi.fn(function addEventListener(this: unknown) {
                return this;
            }),
            clearInterval: vi.fn(function clearInterval(this: unknown) {
                return this;
            }),
            console,
            document,
            electronAPI: legacyRendererGlobalElectronApiCandidate,
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
        const getElectronApiCandidate = vi.fn(() => electronApiCandidate);
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
            getElectronApiCandidate,
            getRemoveEventListener,
            getRendererEventTarget,
            getSetInterval,
            getSetTimeout,
        });

        expect(environment.console).toBe(console);
        expect(environment.documentTarget).toBe(document);
        expect(environment.electronApiCandidate).toBe(electronApiCandidate);
        expect(environment.electronApiCandidate).not.toBe(
            legacyRendererGlobalElectronApiCandidate
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
        expect(getElectronApiCandidate).toHaveBeenCalledOnce();
        expect(getRemoveEventListener).toHaveBeenCalledOnce();
        expect(getRendererEventTarget).toHaveBeenCalledOnce();
        expect(getSetInterval).toHaveBeenCalledOnce();
        expect(getSetTimeout).toHaveBeenCalledOnce();
    });

    it("throws when required runtime providers are unavailable", () => {
        expect.assertions(2);

        expect(() => createRuntimeEnvironment({})).toThrow(
            "renderer runtime environment requires addEventListener"
        );
        expect(() =>
            createRuntimeEnvironment({
                getAddEventListener: () => vi.fn(),
                getClearInterval: () => vi.fn(),
                getConsole: () => console,
                getDocument: () => document,
                getRemoveEventListener: () => vi.fn(),
                getSetInterval: () => vi.fn(),
                getSetTimeout: () => vi.fn(),
            })
        ).toThrow(
            "renderer runtime environment requires a renderer event target"
        );
    });

    it("ignores legacy direct scoped timer and DOM providers", () => {
        expect.assertions(15);

        const electronApiCandidate = {};
        const legacyRendererGlobalElectronApiCandidate = {};
        const rendererGlobal = {
            addEventListener: vi.fn(function addEventListener(this: unknown) {
                return this;
            }),
            clearInterval: vi.fn(function clearInterval(this: unknown) {
                return this;
            }),
            console,
            document,
            electronAPI: legacyRendererGlobalElectronApiCandidate,
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
        const legacyDirectElectronApiCandidate = {};
        const legacyDirectScope = {
            addEventListener: rendererGlobal.addEventListener,
            clearInterval: rendererGlobal.clearInterval,
            console,
            document,
            electronAPI: legacyDirectElectronApiCandidate,
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
            getElectronApiCandidate: () => electronApiCandidate,
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
        expect(environment.electronApiCandidate).toBe(electronApiCandidate);
        expect(environment.electronApiCandidate).not.toBe(
            legacyDirectElectronApiCandidate
        );
        expect(environment.electronApiCandidate).not.toBe(
            legacyRendererGlobalElectronApiCandidate
        );
        listenerController.abort();
    });
});
