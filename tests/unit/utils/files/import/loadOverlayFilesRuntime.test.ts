import { afterEach, describe, expect, it } from "vitest";

import {
    getLoadOverlayFilesRuntime,
    type LoadOverlayFilesRuntimeScope,
} from "../../../../../electron-app/utils/files/import/loadOverlayFilesRuntime.js";

describe("getLoadOverlayFilesRuntime", () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it("reads hardware concurrency from the injected navigator", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({
            getNavigator: () => ({ hardwareConcurrency: 8 }),
        });

        expect(view.getHardwareConcurrency()).toBe(8);
    });

    it("uses browser runtime providers for production document and navigator defaults", () => {
        expect.assertions(2);

        const button = document.createElement("button");
        button.className = "tab-button active";
        document.body.append(button);
        const view = getLoadOverlayFilesRuntime();

        expect(view.getActiveTabButton()).toBe(button);
        expect(view.getHardwareConcurrency()).toBe(
            navigator.hardwareConcurrency
        );
    });

    it("returns undefined when navigator metadata is unavailable", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({});

        expect(view.getHardwareConcurrency()).toBeUndefined();
    });

    it("returns null for active tab lookup when document access is unavailable", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({});

        expect(view.getActiveTabButton()).toBeNull();
    });

    it("finds the active tab button through the injected document", () => {
        expect.assertions(1);

        const documentRef = document.implementation.createHTMLDocument();
        const button = documentRef.createElement("button");
        button.className = "tab-button active";
        button.id = "tab_map";
        documentRef.body.append(button);
        const view = getLoadOverlayFilesRuntime({
            getDocument: () => documentRef,
        });

        expect(view.getActiveTabButton()).toBe(button);
    });

    it("isolates throwing navigator providers", () => {
        expect.assertions(1);

        const view = getLoadOverlayFilesRuntime({
            getNavigator() {
                throw new Error("navigator unavailable");
            },
        });

        expect(view.getHardwareConcurrency()).toBeUndefined();
    });

    it("ignores legacy direct browser primitive scope properties", () => {
        expect.assertions(2);

        const documentRef = document.implementation.createHTMLDocument();
        const button = documentRef.createElement("button");
        button.className = "tab-button active";
        documentRef.body.append(button);
        const view = getLoadOverlayFilesRuntime({
            document: documentRef,
            navigator: { hardwareConcurrency: 16 },
        } as unknown as LoadOverlayFilesRuntimeScope);

        expect(view.getHardwareConcurrency()).toBeUndefined();
        expect(view.getActiveTabButton()).toBeNull();
    });
});
