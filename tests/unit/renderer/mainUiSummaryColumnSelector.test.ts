import { afterEach, describe, expect, it, vi } from "vitest";

import { createMainUiSummaryColumnSelectorHandler } from "../../../electron-app/renderer/mainUiSummaryColumnSelector.js";
import {
    getMainUiSummaryColumnSelectorRuntime,
    type MainUiSummaryColumnSelectorRuntime,
    type MainUiSummaryColumnSelectorRuntimeScope,
    type MainUiSummaryColumnSelectorTimer,
} from "../../../electron-app/renderer/mainUiSummaryColumnSelectorRuntime.js";

function createRuntime({
    gearButton,
    summaryTab,
    timer = 5 as MainUiSummaryColumnSelectorTimer,
}: {
    gearButton?: HTMLElement | null;
    summaryTab?: HTMLElement | null;
    timer?: MainUiSummaryColumnSelectorTimer;
} = {}): MainUiSummaryColumnSelectorRuntime {
    return {
        getSummaryGearButton: vi.fn(() => gearButton ?? null),
        getSummaryTab: vi.fn(() => summaryTab ?? null),
        setTimeout: vi.fn((callback: () => void) => {
            callback();
            return timer;
        }),
    };
}

describe("main UI summary column selector", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.unstubAllGlobals();
    });

    it("clicks the summary tab before opening the delayed gear selector", () => {
        expect.assertions(6);

        const summaryTab = document.createElement("button");
        const gearButton = document.createElement("button");
        summaryTab.onclick = () => {
            summaryTab.dataset.clicked = "true";
        };
        gearButton.onclick = () => {
            gearButton.dataset.clicked = "true";
        };
        const runtime = createRuntime({ gearButton, summaryTab });
        const logMainUi = vi.fn();
        const registerTimer = vi.fn();
        const summaryTabClick = vi.spyOn(summaryTab, "click");
        const gearButtonClick = vi.spyOn(gearButton, "click");
        const handler = createMainUiSummaryColumnSelectorHandler({
            delay: 150,
            gearButtonSelector: ".summary-gear-btn",
            logMainUi,
            registerTimer,
            runtime,
            summaryTabId: "tab-summary",
        });

        handler();

        expect({
            gearClicked: gearButton.dataset.clicked,
            summaryClicked: summaryTab.dataset.clicked,
        }).toStrictEqual({
            gearClicked: "true",
            summaryClicked: "true",
        });
        expect(summaryTabClick).toHaveBeenCalledOnce();
        expect(gearButtonClick).toHaveBeenCalledOnce();
        expect(runtime.setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            150
        );
        expect(registerTimer).toHaveBeenCalledWith(5, {
            owner: "main-ui.summary-column-selector",
        });
        expect(logMainUi).not.toHaveBeenCalled();
    });

    it("does not click the summary tab when it is already active", () => {
        expect.assertions(3);

        const summaryTab = document.createElement("button");
        summaryTab.classList.add("active");
        const gearButton = document.createElement("button");
        summaryTab.onclick = () => {
            summaryTab.dataset.clicked = "true";
        };
        gearButton.onclick = () => {
            gearButton.dataset.clicked = "true";
        };
        const runtime = createRuntime({ gearButton, summaryTab });
        const summaryTabClick = vi.spyOn(summaryTab, "click");
        const handler = createMainUiSummaryColumnSelectorHandler({
            delay: 150,
            gearButtonSelector: ".summary-gear-btn",
            logMainUi: vi.fn(),
            registerTimer: vi.fn(),
            runtime,
            summaryTabId: "tab-summary",
        });

        handler();

        expect({
            gearClicked: gearButton.dataset.clicked,
            summaryClicked: summaryTab.dataset.clicked,
        }).toStrictEqual({
            gearClicked: "true",
            summaryClicked: undefined,
        });
        expect(summaryTabClick).not.toHaveBeenCalled();
        expect(runtime.setTimeout).toHaveBeenCalledOnce();
    });

    it("logs when the delayed gear button is missing", () => {
        expect.assertions(3);

        const logMainUi = vi.fn();
        const summaryTab = document.createElement("button");
        summaryTab.onclick = () => {
            summaryTab.dataset.clicked = "true";
        };
        const handler = createMainUiSummaryColumnSelectorHandler({
            delay: 150,
            gearButtonSelector: ".summary-gear-btn",
            logMainUi,
            registerTimer: vi.fn(),
            runtime: createRuntime({ summaryTab }),
            summaryTabId: "tab-summary",
        });

        handler();

        expect(summaryTab.dataset.clicked).toBe("true");
        expect(logMainUi).toHaveBeenCalledWith(
            "warn",
            "Summary gear button not found"
        );
        expect(logMainUi).toHaveBeenCalledOnce();
    });

    it("resolves DOM elements through the injected runtime scope", () => {
        expect.assertions(3);

        const summaryTab = document.createElement("button");
        summaryTab.id = "tab-summary";
        document.body.append(summaryTab);
        const gearButton = document.createElement("button");
        gearButton.className = "summary-gear-btn";
        document.body.append(gearButton);

        const runtime = getMainUiSummaryColumnSelectorRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.getSummaryTab("tab-summary")).toBe(summaryTab);
        expect(runtime.getSummaryGearButton(".summary-gear-btn")).toBe(
            gearButton
        );
        expect(runtime.getSummaryTab("missing")).toBeNull();

        document.body.replaceChildren();
    });

    it("uses renderer browser runtime providers for production defaults", () => {
        expect.assertions(4);

        const summaryTab = document.createElement("button");
        summaryTab.id = "tab-summary";
        document.body.append(summaryTab);
        const gearButton = document.createElement("button");
        gearButton.className = "summary-gear-btn";
        document.body.append(gearButton);
        const delayMs = Number("250");
        const timer = 51 as MainUiSummaryColumnSelectorTimer;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);

        vi.stubGlobal("setTimeout", setTimeout);

        const runtime = getMainUiSummaryColumnSelectorRuntime();
        const callback = vi.fn();

        expect(runtime.getSummaryTab("tab-summary")).toBe(summaryTab);
        expect(runtime.getSummaryGearButton(".summary-gear-btn")).toBe(
            gearButton
        );
        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
    });

    it("schedules through the injected timeout runtime", () => {
        expect.assertions(3);

        const callback = vi.fn();
        const timer = 42 as MainUiSummaryColumnSelectorTimer;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const runtime = getMainUiSummaryColumnSelectorRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
            getSetTimeout: () => setTimeout,
        });
        const scheduleTimeout = runtime.setTimeout.bind(runtime);

        expect(scheduleTimeout(callback, 250)).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, 250);
        expect(callback).not.toHaveBeenCalled();
    });

    it("fails clearly when the timeout runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMainUiSummaryColumnSelectorRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
        });

        expect(() => {
            runtime.setTimeout(() => {}, 250);
        }).toThrow("main UI summary selector requires setTimeout");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const summaryTab = document.createElement("button");
        summaryTab.id = "tab-summary";
        document.body.append(summaryTab);
        const gearButton = document.createElement("button");
        gearButton.className = "summary-gear-btn";
        document.body.append(gearButton);
        const legacyScope = {
            document,
            HTMLElement,
            setTimeout,
        } as unknown as MainUiSummaryColumnSelectorRuntimeScope;
        const runtime = getMainUiSummaryColumnSelectorRuntime(legacyScope);

        expect(runtime.getSummaryTab("tab-summary")).toBeNull();
        expect(runtime.getSummaryGearButton(".summary-gear-btn")).toBeNull();
        expect(() => runtime.setTimeout(() => {}, 250)).toThrow(
            "main UI summary selector requires setTimeout"
        );
        expect(document.getElementById("tab-summary")).toBe(summaryTab);

        document.body.replaceChildren();
    });
});
