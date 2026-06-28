import { afterEach, describe, expect, it, vi } from "vitest";

import {
    clearDomPurifyRuntimeForTests,
    isDomPurifyRuntime,
    resolveDomPurifyRuntime,
    setDomPurifyRuntime,
} from "../../../../electron-app/utils/dom/domPurifyRuntime.js";

afterEach(() => {
    clearDomPurifyRuntimeForTests();
});

describe("domPurifyRuntime", () => {
    it("resolves a registered DOMPurify-compatible runtime", () => {
        expect.assertions(3);

        const registeredRuntime = { sanitize: vi.fn() };

        setDomPurifyRuntime(registeredRuntime);

        expect(resolveDomPurifyRuntime()).toBe(registeredRuntime);
        expect(isDomPurifyRuntime(registeredRuntime)).toBe(true);
        expect(isDomPurifyRuntime({ sanitize: "nope" })).toBe(false);
    });

    it("ignores malformed runtimes", () => {
        expect.assertions(3);

        setDomPurifyRuntime({ purify: vi.fn() });

        expect(isDomPurifyRuntime({ purify: vi.fn() })).toBe(false);
        expect(isDomPurifyRuntime([vi.fn()])).toBe(false);
        expect(resolveDomPurifyRuntime()).toBeUndefined();
    });
});
