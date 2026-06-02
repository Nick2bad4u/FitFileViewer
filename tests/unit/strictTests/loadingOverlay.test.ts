// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock theme colors to keep DOM deterministic
vi.mock(
    import("../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: vi.fn<
            () => {
                background: string;
                border: string;
                primary: string;
                textPrimary: string;
                textSecondary: string;
            }
        >(() => ({
            background: "#000000",
            border: "#222222",
            primary: "#00ff00",
            textPrimary: "#ffffff",
            textSecondary: "#aaaaaa",
        })),
    })
);

function getRequiredElementById<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing expected element: #${id}`);
    }
    return element as T;
}

describe("loading overlay strict", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("creates overlay on first show with text and filename", async () => {
        expect.assertions(4);

        const { LoadingOverlay } =
            await import("../../../electron-app/utils/ui/components/LoadingOverlay.js");

        LoadingOverlay.show("Loading 1 / 10 files...", "example.fit");

        const overlay = getRequiredElementById("fitfile-loading-overlay");
        expect(overlay.id).toBe("fitfile-loading-overlay");
        expect(overlay.style.position).toBe("fixed");

        const text = getRequiredElementById("fitfile-loading-text");
        expect(text.textContent).toBe("Loading 1 / 10 files...");

        const file = getRequiredElementById("fitfile-loading-filename");
        expect(file.textContent).toBe("File: example.fit");
    });

    it("reuses existing overlay and updates text only", async () => {
        expect.assertions(6);

        const { LoadingOverlay } =
            await import("../../../electron-app/utils/ui/components/LoadingOverlay.js");

        LoadingOverlay.show("Step 1", "first.fit");
        const first = getRequiredElementById("fitfile-loading-overlay");
        expect(first.id).toBe("fitfile-loading-overlay");
        expect(
            document.querySelectorAll("#fitfile-loading-overlay")
        ).toHaveLength(1);

        LoadingOverlay.show("Step 2");
        const second = document.getElementById("fitfile-loading-overlay");
        expect(second).toBe(first);

        const text = getRequiredElementById("fitfile-loading-text");
        expect(text.textContent).toBe("Step 2");

        const file = getRequiredElementById("fitfile-loading-filename");
        // When no filename provided, it should clear the filename text
        expect(file.textContent).not.toBe("File: first.fit");
        expect(file.textContent).toBe("");
    });

    it("hide removes the overlay from DOM", async () => {
        expect.assertions(2);

        const { LoadingOverlay } =
            await import("../../../electron-app/utils/ui/components/LoadingOverlay.js");

        LoadingOverlay.show("Working...");
        expect(
            document.querySelectorAll("#fitfile-loading-overlay")
        ).toHaveLength(1);

        LoadingOverlay.hide();
        expect({
            overlayCount: document.querySelectorAll("#fitfile-loading-overlay")
                .length,
        }).toEqual({
            overlayCount: 0,
        });
    });
});
