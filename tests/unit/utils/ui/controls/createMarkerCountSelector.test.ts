import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getThemeColors: vi.fn<() => Record<string, string>>(),
    showNotification: vi.fn<(message: string, type: string) => void>(),
    updateShownFilesList: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: mocks.getThemeColors,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/rendering/components/shownFilesListUpdater.js"),
    () => ({
        updateShownFilesList: mocks.updateShownFilesList,
    })
);

import { createMarkerCountSelector } from "../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js";
import {
    getMapMarkerCount,
    resetMapMarkerCount,
    setMapMarkerCount,
} from "../../../../../electron-app/utils/maps/state/mapMarkerCountState.js";

function resetFixture(): void {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.body.replaceChildren();
    resetMapMarkerCount();
    mocks.getThemeColors.mockReturnValue({
        primary: "#2563eb",
        surface: "#ffffff",
    });
}

function getSelect(container: HTMLElement): HTMLSelectElement {
    const select = container.querySelector<HTMLSelectElement>(
        "#marker-count-select"
    );
    if (!select) {
        throw new Error("Missing marker count select");
    }

    return select;
}

function requireElement<T extends Element>(
    element: T | null,
    label: string
): T {
    if (!element) {
        throw new Error(`Missing ${label}`);
    }

    return element;
}

function getMarkerCountSelectorState(container: HTMLElement) {
    const icon = requireElement(
            container.querySelector("svg.icon"),
            "marker count icon"
        ),
        label = requireElement(
            container.querySelector("label"),
            "marker count label"
        ),
        labelText = requireElement(
            label.querySelector("span"),
            "marker count label text"
        ),
        select = getSelect(container);

    return {
        containerClass: container.className,
        iconAriaHidden: icon.getAttribute("aria-hidden"),
        iconFocusable: icon.getAttribute("focusable"),
        iconRectFills: Array.from(icon.querySelectorAll("rect"), (rect) =>
            rect.getAttribute("fill")
        ),
        iconRectStrokes: Array.from(icon.querySelectorAll("rect"), (rect) =>
            rect.getAttribute("stroke")
        ),
        iconSize: {
            height: icon.getAttribute("height"),
            viewBox: icon.getAttribute("viewBox"),
            width: icon.getAttribute("width"),
        },
        labelClass: label.className,
        labelFor: label.getAttribute("for"),
        labelText: labelText.textContent,
        options: Array.from(select.options, (option) => ({
            text: option.textContent,
            value: option.value,
        })),
        selectClass: select.className,
        selectId: select.id,
        selectValue: select.value,
    };
}

function dispatchChange(select: HTMLSelectElement): void {
    select.dispatchEvent(new Event("change"));
}

function dispatchWheel(select: HTMLSelectElement, deltaY: number): void {
    select.dispatchEvent(
        new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            deltaY,
        })
    );
}

describe(createMarkerCountSelector, () => {
    it("creates the selector with the default marker count and themed icon", () => {
        expect.assertions(3);

        resetFixture();

        try {
            const container = createMarkerCountSelector();

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(getMarkerCountSelectorState(container)).toEqual({
                containerClass: "map-action-btn marker-count-container",
                iconAriaHidden: "true",
                iconFocusable: "false",
                iconRectFills: [
                    "#ffffff",
                    "#ffffff",
                    "#ffffff",
                    "#ffffff",
                ],
                iconRectStrokes: [
                    "#2563eb",
                    "#2563eb",
                    "#2563eb",
                    "#2563eb",
                ],
                iconSize: {
                    height: "18",
                    viewBox: "0 0 20 20",
                    width: "18",
                },
                labelClass: "marker-count-label",
                labelFor: "marker-count-select",
                labelText: "Data Points:",
                options: [
                    { text: "10", value: "10" },
                    { text: "25", value: "25" },
                    { text: "50", value: "50" },
                    { text: "100", value: "100" },
                    { text: "200", value: "200" },
                    { text: "500", value: "500" },
                    { text: "1000", value: "1000" },
                    { text: "All", value: "all" },
                ],
                selectClass: "marker-count-select",
                selectId: "marker-count-select",
                selectValue: "50",
            });
            expect(getMapMarkerCount()).toBe(50);
        } finally {
            resetFixture();
        }
    });

    it("uses all markers when the global count is zero", () => {
        expect.assertions(2);

        resetFixture();
        setMapMarkerCount(0);

        try {
            const select = getSelect(createMarkerCountSelector());

            expect(select.value).toBe("all");
            expect(getMapMarkerCount()).toBe(0);
        } finally {
            resetFixture();
        }
    });

    it("falls back to the default for invalid global counts", () => {
        expect.assertions(2);

        resetFixture();
        setMapMarkerCount(999);

        try {
            const select = getSelect(createMarkerCountSelector());

            expect(select.value).toBe("50");
            expect(getMapMarkerCount()).toBe(50);
        } finally {
            resetFixture();
        }
    });

    it("updates globals, callback, and shown file list on changes", () => {
        expect.assertions(5);

        resetFixture();
        const onChange = vi.fn<(count: number) => void>();

        try {
            const select = getSelect(createMarkerCountSelector(onChange));
            select.value = "200";

            dispatchChange(select);

            expect(getMapMarkerCount()).toBe(200);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(200);
            expect(mocks.updateShownFilesList).toHaveBeenCalledOnce();

            select.value = "all";
            dispatchChange(select);

            expect(getMapMarkerCount()).toBe(0);
            expect(onChange).toHaveBeenLastCalledWith(0);
        } finally {
            resetFixture();
        }
    });

    it("steps through marker counts with the mouse wheel", () => {
        expect.assertions(4);

        resetFixture();
        const onChange = vi.fn<(count: number) => void>();

        try {
            const select = getSelect(createMarkerCountSelector(onChange));

            dispatchWheel(select, 1);

            expect(select.value).toBe("100");
            expect(getMapMarkerCount()).toBe(100);

            dispatchWheel(select, -1);

            expect(select.value).toBe("50");
            expect(onChange).toHaveBeenLastCalledWith(50);
        } finally {
            resetFixture();
        }
    });

    it("notifies when marker count changes fail", () => {
        expect.assertions(3);

        resetFixture();
        const error = new Error("callback failed");
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const onChange = vi.fn<(count: number) => void>(() => {
            throw error;
        });

        try {
            const select = getSelect(createMarkerCountSelector(onChange));
            select.value = "25";

            dispatchChange(select);

            expect(getMapMarkerCount()).toBe(25);
            expect(errorSpy).toHaveBeenCalledWith(
                "[mapActionButtons] Error in marker count change:",
                error
            );
            expect(mocks.showNotification).toHaveBeenCalledExactlyOnceWith(
                "Failed to update marker count",
                "error"
            );
        } finally {
            resetFixture();
        }
    });

    it("returns an empty fallback container when creation fails", () => {
        expect.assertions(3);

        resetFixture();
        const error = new Error("theme failed");
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        mocks.getThemeColors.mockImplementation(() => {
            throw error;
        });

        try {
            const container = createMarkerCountSelector();

            expect(container.children).toHaveLength(0);
            expect(errorSpy).toHaveBeenCalledWith(
                "[mapActionButtons] Error creating marker count selector:",
                error
            );
            expect(mocks.showNotification).toHaveBeenCalledExactlyOnceWith(
                "Failed to create marker count selector",
                "error"
            );
        } finally {
            resetFixture();
        }
    });
});
