import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getMissingRendererDomElementGroups,
    validateRendererDomElements,
} from "../../../electron-app/renderer/domStartupValidation.js";

afterEach(() => {
    document.body.innerHTML = "";
});

describe("renderer DOM startup validation", () => {
    it("accepts the app DOM ids used by the production shell", () => {
        expect.assertions(2);

        document.body.innerHTML = `
            <button id="open_file_btn"></button>
            <div id="notification"></div>
            <div id="loading_overlay"></div>
        `;
        const logRenderer =
            vi.fn<(level: "warn", ...args: unknown[]) => void>();

        expect(validateRendererDomElements(document, logRenderer)).toBe(true);
        expect(logRenderer).not.toHaveBeenCalled();
    });

    it("accepts legacy test harness id aliases", () => {
        expect.assertions(1);

        document.body.innerHTML = `
            <input id="fileInput" />
            <div id="notification-container"></div>
            <div id="loading"></div>
        `;

        expect(getMissingRendererDomElementGroups(document)).toStrictEqual([]);
    });

    it("logs missing groups while keeping minimal harnesses non-fatal", () => {
        expect.assertions(3);

        const logRenderer =
            vi.fn<(level: "warn", ...args: unknown[]) => void>();

        expect(validateRendererDomElements(document, logRenderer)).toBe(true);
        expect(getMissingRendererDomElementGroups(document)).toStrictEqual([
            "Open File button",
            "Notification container",
            "Loading overlay",
        ]);
        expect(logRenderer).toHaveBeenCalledWith(
            "warn",
            "[Renderer] Some UI elements were not found:",
            "Open File button, Notification container, Loading overlay"
        );
    });
});
