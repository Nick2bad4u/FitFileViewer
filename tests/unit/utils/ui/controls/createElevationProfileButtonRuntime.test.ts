import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import { chartOverlayColorPalette } from "../../../../../electron-app/utils/charts/theming/chartOverlayColorPalette.js";
import { getCreateElevationProfileButtonRuntime } from "../../../../../electron-app/utils/ui/controls/createElevationProfileButtonRuntime.js";

describe("getCreateElevationProfileButtonRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateElevationProfileButtonRuntime({
            getDocument: () => document,
        });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getCreateElevationProfileButtonRuntime({
            getAbortController: () => AbortController,
            getDocument: () => document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getCreateElevationProfileButtonRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("reads dark-theme state from the injected document", () => {
        expect.assertions(2);

        document.body.classList.remove("theme-dark");

        const runtime = getCreateElevationProfileButtonRuntime({
            getDocument: () => document,
        });

        expect(runtime.isDarkTheme()).toBe(false);

        document.body.classList.add("theme-dark");

        expect(runtime.isDarkTheme()).toBe(true);

        document.body.classList.remove("theme-dark");
    });

    it("opens popup windows through the injected opener", () => {
        expect.assertions(4);

        let openedUrl = "";
        let openedTarget = "";
        let openedFeatures = "";
        const popup = {} as Window;
        const runtime = getCreateElevationProfileButtonRuntime({
            getOpen: () =>
                function open(url, target, features): Window {
                    openedUrl = String(url);
                    openedTarget = target ?? "";
                    openedFeatures = features ?? "";
                    return popup;
                },
        });

        const result = runtime.openPopupWindow(
            "",
            "Elevation Profile",
            "width=900,height=600"
        );

        expect(result).toBe(popup);
        expect(openedUrl).toBe("");
        expect(openedTarget).toBe("Elevation Profile");
        expect(openedFeatures).toBe("width=900,height=600");
    });

    it("returns null when popup opening is unavailable", () => {
        expect.assertions(1);

        expect(
            getCreateElevationProfileButtonRuntime({}).openPopupWindow(
                "",
                "Elevation Profile",
                "width=900,height=600"
            )
        ).toBeNull();
    });

    it("returns the injected chart overlay color palette", () => {
        expect.assertions(1);

        const palette = ["#ff0000", "#00ff00"];

        expect(
            getCreateElevationProfileButtonRuntime({
                getChartOverlayColorPalette: () => palette,
            }).getChartOverlayColorPalette()
        ).toBe(palette);
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(8);

        const utils = getCreateElevationProfileButtonRuntime();
        const popup = {} as Window;
        const open = vi.fn(() => popup);

        vi.stubGlobal("AbortController", AbortController);
        vi.stubGlobal("document", document);
        vi.stubGlobal("open", open);

        const controller = utils.createAbortController();
        const openedWindow = utils.openPopupWindow(
            "",
            "Elevation Profile",
            "width=900,height=600"
        );

        expect(controller).toBeInstanceOf(AbortController);
        expect(utils.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(utils.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(utils.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
        expect(utils.getChartOverlayColorPalette()).toBe(
            chartOverlayColorPalette
        );
        expect(openedWindow).toBe(popup);
        expect(open).toHaveBeenCalledOnce();
        expect(open).toHaveBeenCalledWith(
            "",
            "Elevation Profile",
            "width=900,height=600"
        );
    });

    it("fails clearly when document-backed operations lack a document", () => {
        expect.assertions(4);

        const runtime = getCreateElevationProfileButtonRuntime({});
        const runtimeWithoutAbortController =
            getCreateElevationProfileButtonRuntime({
                getDocument: () => ({ defaultView: undefined }) as Document,
            });
        const runtimeWithInvalidAbortController =
            getCreateElevationProfileButtonRuntime({
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
                getDocument: () => document,
            });

        expect(() => runtime.createButton()).toThrow(
            "createElevationProfileButton requires a document runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow(
            "createElevationProfileButton requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createElevationProfileButton requires an AbortController runtime"
        );
        expect(() => runtime.isDarkTheme()).toThrow(
            "createElevationProfileButton requires a document runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(8);

        const legacyAbortController = vi.fn();
        const legacyDocument = {
            body: { classList: { contains: vi.fn() } },
            createElement: vi.fn(),
            createElementNS: vi.fn(),
            defaultView: {
                AbortController: legacyAbortController,
            },
        };
        const legacyOpen = vi.fn();
        const legacyPalette = ["#ff0000"];
        const runtime = getCreateElevationProfileButtonRuntime({
            AbortController:
                legacyAbortController as unknown as BrowserAbortControllerConstructor,
            chartOverlayColorPalette: legacyPalette,
            document: legacyDocument as unknown as Document,
            open: legacyOpen,
        } as unknown as Parameters<
            typeof getCreateElevationProfileButtonRuntime
        >[0]);

        expect(() => runtime.createButton()).toThrow(
            "createElevationProfileButton requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "createElevationProfileButton requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createElevationProfileButton requires an AbortController runtime"
        );
        expect(runtime.getChartOverlayColorPalette()).toBeUndefined();
        expect(
            runtime.openPopupWindow("", "Elevation Profile", "width=900")
        ).toBeNull();
        expect(legacyDocument.createElement).not.toHaveBeenCalled();
        expect(legacyDocument.createElementNS).not.toHaveBeenCalled();
        expect(legacyOpen).not.toHaveBeenCalled();
    });
});
