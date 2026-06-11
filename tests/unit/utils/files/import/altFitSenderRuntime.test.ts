import { describe, expect, it, vi } from "vitest";

import { getAltFitSenderRuntimeEnvironment } from "../../../../../electron-app/utils/files/import/altFitSenderRuntime.js";

describe("altFitSenderRuntime", () => {
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

    it("returns null for DOM lookups when the runtime document is unavailable", () => {
        expect.assertions(1);

        const runtime = getAltFitSenderRuntimeEnvironment({
            console,
        });

        expect(runtime.getElementById("altfit-iframe")).toBeNull();
    });
});
