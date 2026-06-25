import { describe, expect, it } from "vitest";

import { getInitStartupRuntime } from "../../../../electron-app/utils/ui/initStartupRuntime.js";

describe("getInitStartupRuntime", () => {
    it("returns the document target through the injected provider", () => {
        expect.assertions(1);

        const target = new EventTarget();
        const runtime = getInitStartupRuntime({
            getDocumentTarget: () => target,
        });

        expect(runtime.getDocumentTarget()).toBe(target);
    });

    it("returns the production document target through the browser runtime provider", () => {
        expect.assertions(1);

        expect(getInitStartupRuntime().getDocumentTarget()).toBe(document);
    });

    it("returns undefined when the document target runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getInitStartupRuntime({});

        expect(runtime.getDocumentTarget()).toBeUndefined();
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(1);

        const target = new EventTarget();
        const runtime = getInitStartupRuntime({
            documentTarget: target,
        } as unknown as Parameters<typeof getInitStartupRuntime>[0]);

        expect(runtime.getDocumentTarget()).toBeUndefined();
    });
});
