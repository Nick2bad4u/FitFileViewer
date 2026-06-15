import { describe, expect, it, vi } from "vitest";

import { createRendererRuntimeEnvironment as createRuntimeEnvironment } from "../../../electron-app/renderer/runtimeEnvironment.js";

describe("renderer runtime environment", () => {
    it("captures browser globals as bound renderer runtime dependencies", () => {
        expect.assertions(9);

        const electronApiCandidate = {};
        const scope = {
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

        const environment = createRuntimeEnvironment(scope);

        expect(environment.console).toBe(console);
        expect(environment.documentTarget).toBe(document);
        expect(environment.electronApiCandidate).toBe(electronApiCandidate);
        expect(environment.scope).toBe(scope);
        expect(environment.windowTarget).toBe(scope);
        expect(environment.addEventListener("load", vi.fn())).toBe(scope);
        expect(environment.removeEventListener("load", vi.fn())).toBe(scope);
        expect(environment.setTimeout(vi.fn(), 0)).toBe(scope);
        expect(environment.clearInterval(1)).toBe(scope);
    });

    it("captures browser globals through a provider scope", () => {
        expect.assertions(5);

        const electronApiCandidate = {};
        const windowTarget = {
            addEventListener: vi.fn(function addEventListener(this: unknown) {
                return this;
            }),
            clearInterval: vi.fn(function clearInterval(this: unknown) {
                return this;
            }),
            console,
            document,
            electronAPI: electronApiCandidate,
            removeEventListener: vi.fn(),
            setInterval: vi.fn(),
            setTimeout: vi.fn(function setTimeout(this: unknown) {
                return this;
            }),
        } as unknown as Window & typeof globalThis;
        const getWindow = vi.fn(() => windowTarget);
        const listenerController = new AbortController();

        const environment = createRuntimeEnvironment({ getWindow });

        expect(getWindow).toHaveBeenCalledOnce();
        expect(environment.windowTarget).toBe(windowTarget);
        expect(environment.electronApiCandidate).toBe(electronApiCandidate);
        expect(
            environment.addEventListener("load", vi.fn(), {
                signal: listenerController.signal,
            })
        ).toBe(windowTarget);
        expect(environment.setTimeout(vi.fn(), 0)).toBe(windowTarget);
        listenerController.abort();
    });
});
