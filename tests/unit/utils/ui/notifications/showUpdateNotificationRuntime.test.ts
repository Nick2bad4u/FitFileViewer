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

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(2);

        const utils = getShowUpdateNotificationRuntime({});

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
            "showUpdateNotification requires a document runtime"
        );
        expect(() => utils.createElement("button")).toThrow(
            "showUpdateNotification requires a document runtime"
        );
        expect(querySelector).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
    });
});
