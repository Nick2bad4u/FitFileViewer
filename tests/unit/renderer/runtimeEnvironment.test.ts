import { describe, expect, it, vi } from "vitest";

import { createRendererRuntimeEnvironment } from "../../../electron-app/renderer/runtimeEnvironment.js";

describe("renderer runtime environment", () => {
    it("captures browser globals as bound renderer runtime dependencies", () => {
        expect.assertions(8);

        const scope = {
            addEventListener: vi.fn(function addEventListener(this: unknown) {
                return this;
            }),
            clearInterval: vi.fn(function clearInterval(this: unknown) {
                return this;
            }),
            console,
            document,
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

        const environment = createRendererRuntimeEnvironment(scope);

        expect(environment.console).toBe(console);
        expect(environment.documentTarget).toBe(document);
        expect(environment.scope).toBe(scope);
        expect(environment.windowTarget).toBe(scope);
        expect(environment.addEventListener("load", vi.fn())).toBe(scope);
        expect(environment.removeEventListener("load", vi.fn())).toBe(scope);
        expect(environment.setTimeout(vi.fn(), 0)).toBe(scope);
        expect(environment.clearInterval(1)).toBe(scope);
    });
});
