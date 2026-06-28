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
            getFitBrowserFeatureGateRuntime({}).getBrowserTabElements()
        ).toStrictEqual({
            content: null,
            tabButton: null,
        });
        expect(
            getFitBrowserFeatureGateRuntime({
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
            getDocument: () => document,
        });

        utils.setElementVisible(tabButton, false);

        expect(tabButton.style.display).toBe("none");

        utils.setElementVisible(tabButton, true);
        utils.setElementVisible(null, false);

        expect(tabButton.style.display).toBe("");
        expect(document.body.childElementCount).toBe(0);
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
