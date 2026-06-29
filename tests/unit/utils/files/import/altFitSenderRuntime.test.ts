import { afterEach, describe, expect, it, vi } from "vitest";

import { getAltFitSenderRuntimeEnvironment } from "../../../../../electron-app/utils/files/import/altFitSenderRuntime.js";

type AltFitSenderRuntimeScope = NonNullable<
    Parameters<typeof getAltFitSenderRuntimeEnvironment>[0]
>;

function createAltFitSenderRuntimeScope(
    overrides: Partial<AltFitSenderRuntimeScope> = {}
): AltFitSenderRuntimeScope {
    return {
        getAbortController: () => undefined,
        getConsole: () => undefined,
        getDocument: () => undefined,
        getLocation: () => undefined,
        ...overrides,
    };
}

describe("altFitSenderRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getAltFitSenderRuntimeEnvironment(
            createAltFitSenderRuntimeScope({
                getAbortController: () =>
                    AbortControllerConstructor as unknown as typeof AbortController,
                getConsole: () => console,
            })
        );

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(2);

        const environment = getAltFitSenderRuntimeEnvironment();

        expect(environment.console).toBe(globalThis.console);
        expect(environment.createAbortController()).toBeInstanceOf(
            AbortController
        );
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getAltFitSenderRuntimeEnvironment(
            createAltFitSenderRuntimeScope({
                getConsole: () => console,
            })
        );

        expect(() => runtime.createAbortController()).toThrow(
            "Alt FIT sender requires an AbortController runtime"
        );
    });

    it("centralizes default DOM, logging, and location dependencies", () => {
        expect.assertions(3);

        const iframe = document.createElement("iframe");
        iframe.id = "altfit-iframe";
        const getElementById = vi.fn<(id: string) => HTMLElement | null>(
            () => iframe
        );
        const logger = {
            error: vi.fn<typeof console.error>(),
            warn: vi.fn<typeof console.warn>(),
        };
        const location = {
            origin: "app://fit-file-viewer",
            protocol: "app:",
        };

        const runtime = getAltFitSenderRuntimeEnvironment(
            createAltFitSenderRuntimeScope({
                getConsole: () => logger,
                getDocument: () => ({ getElementById }),
                getLocation: () => location,
            })
        );

        expect(runtime.console).toBe(logger);
        expect(runtime.location).toBe(location);
        expect(runtime.getElementById("altfit-iframe")).toBe(iframe);
    });

    it("uses browser runtime providers for production document and location defaults", () => {
        expect.assertions(2);

        const iframe = document.createElement("iframe");
        iframe.id = "altfit-iframe";
        const getElementById = vi.fn<(id: string) => HTMLElement | null>(
            () => iframe
        );
        vi.stubGlobal("document", { getElementById });
        vi.stubGlobal("location", {
            origin: "app://fit-file-viewer",
            protocol: "app:",
        });

        const runtime = getAltFitSenderRuntimeEnvironment();

        expect(runtime.location).toStrictEqual({
            origin: "app://fit-file-viewer",
            protocol: "app:",
        });
        expect(runtime.getElementById("altfit-iframe")).toBe(iframe);
    });

    it("routes default dependencies through provider functions", () => {
        expect.assertions(10);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const iframe = document.createElement("iframe");
        iframe.id = "altfit-iframe";
        const getElementById = vi.fn<(id: string) => HTMLElement | null>(
            () => iframe
        );
        const logger = {
            error: vi.fn<typeof console.error>(),
            warn: vi.fn<typeof console.warn>(),
        };
        const location = {
            origin: "app://fit-file-viewer",
            protocol: "app:",
        };
        const getAbortController = vi.fn(
            () =>
                AbortControllerConstructor as unknown as typeof AbortController
        );
        const getConsole = vi.fn(() => logger);
        const getDocument = vi.fn(() => ({ getElementById }));
        const getLocation = vi.fn(() => location);

        const runtime = getAltFitSenderRuntimeEnvironment(
            createAltFitSenderRuntimeScope({
                getAbortController,
                getConsole,
                getDocument,
                getLocation,
            })
        );

        expect(runtime.console).toBe(logger);
        expect(runtime.location).toBe(location);
        expect(runtime.getElementById("altfit-iframe")).toBe(iframe);
        expect(runtime.createAbortController()).toBe(controller);
        expect(getConsole).toHaveBeenCalledOnce();
        expect(getLocation).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledOnce();
        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getElementById).toHaveBeenCalledWith("altfit-iframe");
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("returns null for DOM lookups when the runtime document is unavailable", () => {
        expect.assertions(1);

        const runtime = getAltFitSenderRuntimeEnvironment(
            createAltFitSenderRuntimeScope({
                getConsole: () => console,
            })
        );

        expect(runtime.getElementById("altfit-iframe")).toBeNull();
    });

    it("fails clearly when AltFit sender provider slots are omitted", () => {
        expect.assertions(4);

        expect(() =>
            getAltFitSenderRuntimeEnvironment(
                {} as unknown as AltFitSenderRuntimeScope
            )
        ).toThrow("Alt FIT sender requires console provider");

        const runtime = getAltFitSenderRuntimeEnvironment({
            getConsole: () => console,
            getLocation: () => undefined,
        } as unknown as AltFitSenderRuntimeScope);

        expect(() =>
            getAltFitSenderRuntimeEnvironment({
                getConsole: () => console,
            } as unknown as AltFitSenderRuntimeScope)
        ).toThrow("Alt FIT sender requires location provider");
        expect(() => runtime.createAbortController()).toThrow(
            "Alt FIT sender requires AbortController provider"
        );
        expect(() => runtime.getElementById("altfit-iframe")).toThrow(
            "Alt FIT sender requires document provider"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(10);

        const AbortControllerConstructor = vi.fn();
        const getElementById = vi.fn();
        const legacyLogger = {
            error: vi.fn<typeof console.error>(),
            warn: vi.fn<typeof console.warn>(),
        };
        const logger = {
            error: vi.fn<typeof console.error>(),
            warn: vi.fn<typeof console.warn>(),
        };
        const location = {
            origin: "app://fit-file-viewer",
            protocol: "app:",
        };

        expect(() =>
            getAltFitSenderRuntimeEnvironment({
                console: legacyLogger,
            } as unknown as Parameters<
                typeof getAltFitSenderRuntimeEnvironment
            >[0])
        ).toThrow("Alt FIT sender requires console provider");

        const runtime = getAltFitSenderRuntimeEnvironment({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            document: { getElementById },
            getConsole: () => logger,
            getDocument: () => undefined,
            getLocation: () => undefined,
            location,
        } as unknown as Parameters<
            typeof getAltFitSenderRuntimeEnvironment
        >[0]);

        expect(runtime.console).toBe(logger);
        expect(runtime.location).toBeUndefined();
        expect(runtime.getElementById("altfit-iframe")).toBeNull();
        expect(() => runtime.createAbortController()).toThrow(
            "Alt FIT sender requires AbortController provider"
        );
        expect(legacyLogger.error).not.toHaveBeenCalled();
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(getElementById).not.toHaveBeenCalled();
        expect(legacyLogger.warn).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });
});
