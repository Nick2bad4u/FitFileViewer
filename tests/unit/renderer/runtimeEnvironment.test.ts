import { describe, expect, it, vi } from "vitest";

import { createRendererRuntimeEnvironment as createRuntimeEnvironment } from "../../../electron-app/renderer/runtimeEnvironment.js";

describe("renderer runtime environment", () => {
    it("captures browser globals through named providers", () => {
        expect.assertions(18);

        const electronApiCandidate = {};
        const rendererGlobal = {
            addEventListener: vi.fn(function addEventListener(this: unknown) {
                return this;
            }),
            clearInterval: vi.fn(function clearInterval(this: unknown) {
                return this;
            }),
            console,
            document,
            electronAPI: electronApiCandidate,
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
        const getRendererScope = vi.fn(() => rendererGlobal);
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
            getRendererScope,
            getSetInterval,
            getSetTimeout,
        });

        expect(environment.console).toBe(console);
        expect(environment.documentTarget).toBe(document);
        expect(environment.electronApiCandidate).toBe(electronApiCandidate);
        expect(environment.rendererGlobal).toBe(rendererGlobal);
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
        expect(getRendererScope).toHaveBeenCalledOnce();
        expect(getSetInterval).toHaveBeenCalledOnce();
        expect(getSetTimeout).toHaveBeenCalledOnce();
    });

    it("throws when required runtime providers are unavailable", () => {
        expect.assertions(2);

        expect(() => createRuntimeEnvironment({})).toThrow(
            "renderer runtime environment requires a renderer scope"
        );
        expect(() =>
            createRuntimeEnvironment({
                getRendererScope: () => ({}) as Window & typeof globalThis,
            })
        ).toThrow("renderer runtime environment requires addEventListener");
    });

    it("ignores legacy direct scoped runtime properties", () => {
        expect.assertions(14);

        const electronApiCandidate = {};
        const rendererGlobal = {
            addEventListener: vi.fn(function addEventListener(this: unknown) {
                return this;
            }),
            clearInterval: vi.fn(function clearInterval(this: unknown) {
                return this;
            }),
            console,
            document,
            electronAPI: electronApiCandidate,
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
        const legacyDirectScope = {
            addEventListener: rendererGlobal.addEventListener,
            clearInterval: rendererGlobal.clearInterval,
            console,
            document,
            electronAPI: electronApiCandidate,
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
        ).toThrow("renderer runtime environment requires a renderer scope");

        const environment = createRuntimeEnvironment({
            ...legacyDirectScope,
            getAddEventListener: () =>
                rendererGlobal.addEventListener.bind(rendererGlobal),
            getClearInterval: () =>
                rendererGlobal.clearInterval.bind(rendererGlobal),
            getConsole: () => console,
            getDocument: () => document,
            getElectronApiCandidate: () => undefined,
            getRemoveEventListener: () =>
                rendererGlobal.removeEventListener.bind(rendererGlobal),
            getRendererScope: () => rendererGlobal,
            getSetInterval: () =>
                rendererGlobal.setInterval.bind(rendererGlobal),
            getSetTimeout: () => rendererGlobal.setTimeout.bind(rendererGlobal),
        } as unknown as Parameters<typeof createRuntimeEnvironment>[0]);

        expect(environment.rendererGlobal).toBe(rendererGlobal);
        expect(environment.electronApiCandidate).toBeUndefined();
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
        expect(environment.electronApiCandidate).not.toBe(electronApiCandidate);
        listenerController.abort();
    });
});
