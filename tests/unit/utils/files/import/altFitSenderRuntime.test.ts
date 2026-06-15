import { describe, expect, it, vi } from "vitest";

import { getAltFitSenderRuntimeEnvironment } from "../../../../../electron-app/utils/files/import/altFitSenderRuntime.js";

describe("altFitSenderRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getAltFitSenderRuntimeEnvironment({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            console,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getAltFitSenderRuntimeEnvironment({ console });

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

        const runtime = getAltFitSenderRuntimeEnvironment({
            console: logger,
            document: { getElementById },
            location,
        });

        expect(runtime.console).toBe(logger);
        expect(runtime.location).toBe(location);
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

        const runtime = getAltFitSenderRuntimeEnvironment({
            getAbortController,
            getConsole,
            getDocument,
            getLocation,
        });

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

        const runtime = getAltFitSenderRuntimeEnvironment({
            console,
        });

        expect(runtime.getElementById("altfit-iframe")).toBeNull();
    });
});
