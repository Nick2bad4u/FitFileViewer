import { describe, expect, it, vi } from "vitest";

import {
    runRendererImportTimeBootstrap,
    type RendererImportTimeBootstrap,
} from "../../../electron-app/renderer/importTimeBootstrap.js";

function createBootstrap(
    overrides: Partial<RendererImportTimeBootstrap> = {}
): RendererImportTimeBootstrap {
    return {
        scheduleAppDomainStateCoverageTouch: vi.fn(),
        scheduleImportTimeListenersSetup: vi.fn(),
        scheduleImportTimeStateInitialization: vi.fn(),
        scheduleImportTimeThemeSetup: vi.fn(),
        ...overrides,
    };
}

describe("renderer import-time bootstrap", () => {
    it("runs import-time setup and coverage touches in renderer order", () => {
        expect.assertions(1);

        const calls: string[] = [];
        const bootstrap = createBootstrap({
            scheduleAppDomainStateCoverageTouch: vi.fn(() => {
                calls.push("coverage");
            }),
            scheduleImportTimeListenersSetup: vi.fn(() => {
                calls.push("listeners");
            }),
            scheduleImportTimeStateInitialization: vi.fn(() => {
                calls.push("state");
            }),
            scheduleImportTimeThemeSetup: vi.fn(() => {
                calls.push("theme");
            }),
        });

        runRendererImportTimeBootstrap(bootstrap);

        expect(calls).toStrictEqual([
            "theme",
            "state",
            "listeners",
            "coverage",
            "coverage",
        ]);
    });

    it("isolates setup errors so later import-time setup still runs", () => {
        expect.assertions(4);

        const bootstrap = createBootstrap({
            scheduleImportTimeListenersSetup: vi.fn(() => {
                throw new Error("listeners failed");
            }),
            scheduleImportTimeStateInitialization: vi.fn(() => {
                throw new Error("state failed");
            }),
            scheduleImportTimeThemeSetup: vi.fn(() => {
                throw new Error("theme failed");
            }),
        });

        expect(() => {
            runRendererImportTimeBootstrap(bootstrap);
        }).not.toThrow();

        expect(bootstrap.scheduleImportTimeThemeSetup).toHaveBeenCalledOnce();
        expect(
            bootstrap.scheduleImportTimeStateInitialization
        ).toHaveBeenCalledOnce();
        expect(
            bootstrap.scheduleAppDomainStateCoverageTouch
        ).toHaveBeenCalledTimes(2);
    });
});
