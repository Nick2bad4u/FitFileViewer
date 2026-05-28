import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getThemeColors: vi.fn<() => Record<string, string>>(),
    showNotification: vi.fn<(message: string, type: string) => void>(),
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

import { createMarkerCountSelector } from "../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js";

type MarkerCountGlobal = typeof globalThis & {
    mapMarkerCount?: number;
    updateShownFilesList?: () => void;
};

function getGlobal(): MarkerCountGlobal {
    return globalThis as MarkerCountGlobal;
}

function resetFixture(): void {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.body.replaceChildren();
    delete getGlobal().mapMarkerCount;
    delete getGlobal().updateShownFilesList;
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
        expect.assertions(8);

        resetFixture();

        try {
            const container = createMarkerCountSelector();
            const select = getSelect(container);
            const firstRect = container.querySelector("svg.icon rect");

            expect(container.className).toBe(
                "map-action-btn marker-count-container"
            );
            expect(container.querySelector("label")?.textContent).toBe(
                "Data Points:"
            );
            expect(select.value).toBe("50");
            expect(getGlobal().mapMarkerCount).toBe(50);
            expect(
                [...select.options].map((option) => option.value)
            ).toStrictEqual([
                "10",
                "25",
                "50",
                "100",
                "200",
                "500",
                "1000",
                "all",
            ]);
            expect([...select.options].at(-1)?.textContent).toBe("All");
            expect(firstRect?.getAttribute("fill")).toBe("#ffffff");
            expect(firstRect?.getAttribute("stroke")).toBe("#2563eb");
        } finally {
            resetFixture();
        }
    });

    it("uses all markers when the global count is zero", () => {
        expect.assertions(2);

        resetFixture();
        getGlobal().mapMarkerCount = 0;

        try {
            const select = getSelect(createMarkerCountSelector());

            expect(select.value).toBe("all");
            expect(getGlobal().mapMarkerCount).toBe(0);
        } finally {
            resetFixture();
        }
    });

    it("falls back to the default for invalid global counts", () => {
        expect.assertions(2);

        resetFixture();
        getGlobal().mapMarkerCount = 999;

        try {
            const select = getSelect(createMarkerCountSelector());

            expect(select.value).toBe("50");
            expect(getGlobal().mapMarkerCount).toBe(50);
        } finally {
            resetFixture();
        }
    });

    it("updates globals, callback, and shown file list on changes", () => {
        expect.assertions(5);

        resetFixture();
        const onChange = vi.fn<(count: number) => void>();
        const updateShownFilesList = vi.fn<() => void>();
        getGlobal().updateShownFilesList = updateShownFilesList;

        try {
            const select = getSelect(createMarkerCountSelector(onChange));
            select.value = "200";

            dispatchChange(select);

            expect(getGlobal().mapMarkerCount).toBe(200);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(200);
            expect(updateShownFilesList).toHaveBeenCalledOnce();

            select.value = "all";
            dispatchChange(select);

            expect(getGlobal().mapMarkerCount).toBe(0);
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
            expect(getGlobal().mapMarkerCount).toBe(100);

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

            expect(getGlobal().mapMarkerCount).toBe(25);
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
