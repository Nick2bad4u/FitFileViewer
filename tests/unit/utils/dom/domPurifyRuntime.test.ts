import { afterEach, describe, expect, it, vi } from "vitest";

import {
    clearDomPurifyRuntimeForTests,
    isDomPurifyRuntime,
    registerDomPurifyRuntime,
    resolveDomPurifyRuntime,
    setDomPurifyRuntime,
    type DomPurifyRuntime,
} from "../../../../electron-app/utils/dom/domPurifyRuntime.js";

afterEach(() => {
    clearDomPurifyRuntimeForTests();
});

describe("domPurifyRuntime", () => {
    function createDomPurifyRuntime(): DomPurifyRuntime {
        return {
            sanitize: vi.fn<DomPurifyRuntime["sanitize"]>(),
        };
    }

    it("registers a typed DOMPurify runtime after vendor payload validation", () => {
        expect.assertions(1);

        const runtime = createDomPurifyRuntime();

        registerDomPurifyRuntime(runtime);

        expect(resolveDomPurifyRuntime()).toBe(runtime);
    });

    it("resolves a registered DOMPurify-compatible runtime", () => {
        expect.assertions(3);

        const registeredRuntime = createDomPurifyRuntime();

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

    it("ignores runtimes with throwing sanitize accessors", () => {
        expect.assertions(2);

        const runtime = Object.defineProperty({}, "sanitize", {
            get() {
                throw new Error("sanitize unavailable");
            },
        });

        setDomPurifyRuntime(runtime);

        expect(isDomPurifyRuntime(runtime)).toBe(false);
        expect(resolveDomPurifyRuntime()).toBeUndefined();
    });
});
