import { describe, expect, it, vi } from "vitest";

import {
    getShowUpdateNotificationRuntime,
    type ShowUpdateNotificationRuntimeScope,
} from "../../../../../electron-app/utils/ui/notifications/showUpdateNotificationRuntime.js";

describe("getShowUpdateNotificationRuntime", () => {
    it("queries and creates notification elements through the document provider", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("notification");
        const host = documentRef.createElement("div");
        host.id = "notification";
        documentRef.body.append(host);
        const utils = getShowUpdateNotificationRuntime({
            getDocument: () => documentRef,
        });

        const queried = utils.queryNotificationElement("#notification");
        const button = utils.createElement("button");

        expect(queried).toBe(host);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.ownerDocument).toBe(documentRef);
        expect(button.tagName).toBe("BUTTON");
    });

    it("uses the shared browser document provider for production defaults", () => {
        expect.assertions(4);

        const host = document.createElement("div");
        host.id = "notification";
        document.body.append(host);

        try {
            const utils = getShowUpdateNotificationRuntime();
            const queried = utils.queryNotificationElement("#notification");
            const button = utils.createElement("button");

            expect(queried).toBe(host);
            expect(button).toBeInstanceOf(HTMLButtonElement);
            expect(button.ownerDocument).toBe(document);
            expect(button.tagName).toBe("BUTTON");
        } finally {
            host.remove();
        }
    });

    it("fails clearly when the document provider is omitted", () => {
        expect.assertions(2);

        const utils = getShowUpdateNotificationRuntime(
            {} as unknown as ShowUpdateNotificationRuntimeScope
        );

        expect(() => utils.queryNotificationElement("#notification")).toThrow(
            "showUpdateNotification requires a document provider"
        );
        expect(() => utils.createElement("button")).toThrow(
            "showUpdateNotification requires a document provider"
        );
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(2);

        const utils = getShowUpdateNotificationRuntime({
            getDocument: () => undefined,
        });

        expect(() => utils.queryNotificationElement("#notification")).toThrow(
            "showUpdateNotification requires a document runtime"
        );
        expect(() => utils.createElement("button")).toThrow(
            "showUpdateNotification requires a document runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const querySelector = vi.fn<Document["querySelector"]>();
        const createElement = vi.fn<Document["createElement"]>();
        const utils = getShowUpdateNotificationRuntime({
            document: { createElement, querySelector },
        } as unknown as ShowUpdateNotificationRuntimeScope);

        expect(() => utils.queryNotificationElement("#notification")).toThrow(
            "showUpdateNotification requires a document provider"
        );
        expect(() => utils.createElement("button")).toThrow(
            "showUpdateNotification requires a document provider"
        );
        expect(querySelector).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
    });
});
