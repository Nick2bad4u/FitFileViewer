// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { getFitBrowserFeatureGateRuntime } from "../../../../../electron-app/utils/ui/browser/initFitBrowserFeatureGateRuntime.js";

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
            document,
            HTMLElement,
        });

        expect(utils.getBrowserTabElements()).toStrictEqual({
            content,
            tabButton,
        });
        expect(
            getFitBrowserFeatureGateRuntime({
                document,
            }).getBrowserTabElements()
        ).toStrictEqual({
            content,
            tabButton,
        });
    });

    it("ignores matching non-HTMLElement nodes and unavailable documents", () => {
        expect.assertions(3);

        resetBody();
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        svg.id = "tab_browser";
        document.body.append(svg);

        expect(
            getFitBrowserFeatureGateRuntime({
                document,
                HTMLElement,
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
                document: {
                    querySelector: () => document.createElement("button"),
                } as unknown as Document,
            }).getBrowserTabElements()
        ).toStrictEqual({
            content: null,
            tabButton: null,
        });
    });

    it("updates element visibility when an element is available", () => {
        expect.assertions(3);

        resetBody();
        const tabButton = document.createElement("button");
        const utils = getFitBrowserFeatureGateRuntime({ document });

        utils.setElementVisible(tabButton, false);

        expect(tabButton.style.display).toBe("none");

        utils.setElementVisible(tabButton, true);
        utils.setElementVisible(null, false);

        expect(tabButton.style.display).toBe("");
        expect(document.body.childElementCount).toBe(0);
    });
});
