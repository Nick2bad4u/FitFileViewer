import { describe, expect, it } from "vitest";

import {
    getInitStartupRuntime,
    type InitStartupRuntimeScope,
} from "../../../../electron-app/utils/ui/initStartupRuntime.js";

const unavailableInitStartupRuntimeScope = {
    getDocumentTarget: () => undefined,
} satisfies InitStartupRuntimeScope;

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

        const runtime = getInitStartupRuntime(
            unavailableInitStartupRuntimeScope
        );

        expect(runtime.getDocumentTarget()).toBeUndefined();
    });

    it("fails clearly when explicit scopes omit the document target provider", () => {
        expect.assertions(1);

        expect(() =>
            getInitStartupRuntime({} as unknown as InitStartupRuntimeScope)
        ).toThrow("initStartup requires a document target provider");
    });

    it("fails clearly when the document target provider slot is undefined", () => {
        expect.assertions(1);

        expect(() =>
            getInitStartupRuntime({
                getDocumentTarget: undefined,
            })
        ).toThrow("initStartup requires a document target provider");
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(1);

        const target = new EventTarget();
        const runtime = getInitStartupRuntime({
            ...unavailableInitStartupRuntimeScope,
            documentTarget: target,
        } as unknown as Parameters<typeof getInitStartupRuntime>[0]);

        expect(runtime.getDocumentTarget()).toBeUndefined();
    });
});
