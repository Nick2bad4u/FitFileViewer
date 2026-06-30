import { afterEach, describe, expect, it, vi } from "vitest";

import {
    clearDomPurifyRuntimeForTests,
    isDomPurifyRuntime,
    registerDomPurifyRuntime,
    resolveDomPurifyRuntime,
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

    it("validates DOMPurify-compatible runtime payloads", () => {
        expect.assertions(3);

        const registeredRuntime = createDomPurifyRuntime();

        expect(isDomPurifyRuntime(registeredRuntime)).toBe(true);
        expect(isDomPurifyRuntime({ sanitize: "nope" })).toBe(false);
        expect(isDomPurifyRuntime({ purify: vi.fn() })).toBe(false);
    });

    it("ignores runtimes with throwing sanitize accessors", () => {
        expect.assertions(2);

        const runtime = Object.defineProperty({}, "sanitize", {
            get() {
                throw new Error("sanitize unavailable");
            },
        });

        expect(isDomPurifyRuntime(runtime)).toBe(false);
        expect(resolveDomPurifyRuntime()).toBeUndefined();
    });
});
