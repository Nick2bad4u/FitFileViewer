import { describe, expect, it } from "vitest";

import { getCreateElevationProfileButtonRuntime } from "../../../../../electron-app/utils/ui/controls/createElevationProfileButtonRuntime.js";

describe("getCreateElevationProfileButtonRuntime", () => {
    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateElevationProfileButtonRuntime({ document });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getCreateElevationProfileButtonRuntime({
            AbortController,
            document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("reads dark-theme state from the injected document", () => {
        expect.assertions(2);

        document.body.classList.remove("theme-dark");

        const runtime = getCreateElevationProfileButtonRuntime({ document });

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
            open(url, target, features): Window {
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
                chartOverlayColorPalette: palette,
            }).getChartOverlayColorPalette()
        ).toBe(palette);
    });

    it("fails clearly when document-backed operations lack a document", () => {
        expect.assertions(4);

        const runtime = getCreateElevationProfileButtonRuntime({});
        const runtimeWithoutAbortController =
            getCreateElevationProfileButtonRuntime({
                document: { defaultView: undefined } as Document,
            });
        const runtimeWithInvalidAbortController =
            getCreateElevationProfileButtonRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
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
});
