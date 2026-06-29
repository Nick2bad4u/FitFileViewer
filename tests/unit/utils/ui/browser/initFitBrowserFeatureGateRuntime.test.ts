// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
    getFitBrowserFeatureGateRuntime,
    type FitBrowserFeatureGateRuntimeScope,
} from "../../../../../electron-app/utils/ui/browser/initFitBrowserFeatureGateRuntime.js";

function resetBody(): void {
    document.body.replaceChildren();
}

describe("getFitBrowserFeatureGateRuntime", () => {
    const unavailableFitBrowserFeatureGateRuntimeScope = {
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
    } satisfies FitBrowserFeatureGateRuntimeScope;

    it("finds Browser tab elements through the injected document", () => {
        expect.assertions(2);

        resetBody();
        const tabButton = document.createElement("button");
        tabButton.id = "tab_browser";
        const content = document.createElement("section");
        content.id = "content_browser";
        document.body.append(tabButton, content);
        const utils = getFitBrowserFeatureGateRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
        });

        expect(utils.getBrowserTabElements()).toStrictEqual({
            content,
            tabButton,
        });
        expect(
            getFitBrowserFeatureGateRuntime({
                ...unavailableFitBrowserFeatureGateRuntimeScope,
                getDocument: () => document,
            }).getBrowserTabElements()
        ).toStrictEqual({
            content: null,
            tabButton: null,
        });
    });

    it("ignores matching non-HTMLElement nodes and unavailable documents", () => {
        expect.assertions(4);

        resetBody();
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        svg.id = "tab_browser";
        document.body.append(svg);

        expect(
            getFitBrowserFeatureGateRuntime({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            }).getBrowserTabElements()
        ).toStrictEqual({
            content: null,
            tabButton: null,
        });
        expect(
            getFitBrowserFeatureGateRuntime(
                unavailableFitBrowserFeatureGateRuntimeScope
            ).getBrowserTabElements()
        ).toStrictEqual({
            content: null,
            tabButton: null,
        });
        expect(
            getFitBrowserFeatureGateRuntime({
                ...unavailableFitBrowserFeatureGateRuntimeScope,
                getDocument: () =>
                    ({
                        defaultView: {
                            HTMLElement,
                        },
                        querySelector: () => document.createElement("button"),
                    }) as unknown as Document,
            }).getBrowserTabElements()
        ).toStrictEqual({
            content: null,
            tabButton: null,
        });
        const fakeButton = document.createElement("button");
        expect(
            getFitBrowserFeatureGateRuntime({
                ...unavailableFitBrowserFeatureGateRuntimeScope,
                getDocument: () =>
                    ({
                        querySelector: () => fakeButton,
                    }) as unknown as Document,
                getHTMLElement: () => HTMLElement,
            }).getBrowserTabElements()
        ).toStrictEqual({
            content: fakeButton,
            tabButton: fakeButton,
        });
    });

    it("updates element visibility when an element is available", () => {
        expect.assertions(3);

        resetBody();
        const tabButton = document.createElement("button");
        const utils = getFitBrowserFeatureGateRuntime({
            ...unavailableFitBrowserFeatureGateRuntimeScope,
            getDocument: () => document,
        });

        utils.setElementVisible(tabButton, false);

        expect(tabButton.style.display).toBe("none");

        utils.setElementVisible(tabButton, true);
        utils.setElementVisible(null, false);

        expect(tabButton.style.display).toBe("");
        expect(document.body.childElementCount).toBe(0);
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(2);

        const runtime = getFitBrowserFeatureGateRuntime(
            {} as unknown as FitBrowserFeatureGateRuntimeScope
        );

        expect(() => runtime.getBrowserTabElements()).toThrow(
            "fitBrowserFeatureGate requires a document provider"
        );
        expect(() =>
            getFitBrowserFeatureGateRuntime({
                getDocument: () => document,
            } as unknown as FitBrowserFeatureGateRuntimeScope).getBrowserTabElements()
        ).toThrow("fitBrowserFeatureGate requires an HTMLElement provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(1);

        resetBody();
        const tabButton = document.createElement("button");
        tabButton.id = "tab_browser";
        const content = document.createElement("section");
        content.id = "content_browser";
        document.body.append(tabButton, content);
        const legacyScope = {
            ...unavailableFitBrowserFeatureGateRuntimeScope,
            document,
            HTMLElement,
        } as unknown as FitBrowserFeatureGateRuntimeScope;

        expect(
            getFitBrowserFeatureGateRuntime(legacyScope).getBrowserTabElements()
        ).toStrictEqual({
            content: null,
            tabButton: null,
        });
    });
});
