import { describe, expect, it } from "vitest";

import { getExternalLinkHandlersRuntime } from "../../../../../electron-app/utils/ui/links/externalLinkHandlersRuntime.js";

describe("getExternalLinkHandlersRuntime", () => {
    it("opens browser windows through the injected opener", () => {
        expect.assertions(4);

        let openedUrl = "";
        let openedTarget = "";
        let openedFeatures = "";
        const openedWindow = {} as WindowProxy;
        const runtime = getExternalLinkHandlersRuntime({
            open(url, target, features): WindowProxy {
                openedUrl = String(url);
                openedTarget = target ?? "";
                openedFeatures = features ?? "";
                return openedWindow;
            },
        });

        const result = runtime.openBrowserWindow(
            "https://example.com",
            "_blank",
            "noopener,noreferrer"
        );

        expect(result).toBe(openedWindow);
        expect(openedUrl).toBe("https://example.com");
        expect(openedTarget).toBe("_blank");
        expect(openedFeatures).toBe("noopener,noreferrer");
    });

    it("returns null when a browser opener is unavailable", () => {
        expect.assertions(1);

        expect(
            getExternalLinkHandlersRuntime({}).openBrowserWindow(
                "https://example.com",
                "_blank",
                "noopener,noreferrer"
            )
        ).toBeNull();
    });
});
