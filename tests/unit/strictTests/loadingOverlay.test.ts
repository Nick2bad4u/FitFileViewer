/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors to keep DOM deterministic
vi.mock("../../../electron-app/utils/charts/theming/getThemeColors.js", () => ({
    getThemeColors: vi.fn(() => ({
        background: "#000000",
        textPrimary: "#ffffff",
        textSecondary: "#aaaaaa",
        border: "#222222",
        primary: "#00ff00",
    })),
}));

describe("LoadingOverlay strict", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("creates overlay on first show with text and filename", async () => {
        const { LoadingOverlay } =
            await import("../../../electron-app/utils/ui/components/LoadingOverlay.js");

        LoadingOverlay.show("Loading 1 / 10 files...", "example.fit");

        const overlay = document.getElementById("fitfile-loading-overlay");
        expect(overlay?.id).toBe("fitfile-loading-overlay");
        expect(overlay?.style.position).toBe("fixed");

        const text = document.getElementById("fitfile-loading-text");
        expect(text?.textContent).toBe("Loading 1 / 10 files...");

        const file = document.getElementById("fitfile-loading-filename");
        expect(file?.textContent).toBe("File: example.fit");
    });

    it("reuses existing overlay and updates text only", async () => {
        const { LoadingOverlay } =
            await import("../../../electron-app/utils/ui/components/LoadingOverlay.js");

        LoadingOverlay.show("Step 1", "first.fit");
        const first = document.getElementById("fitfile-loading-overlay");
        expect(first?.id).toBe("fitfile-loading-overlay");
        expect(
            document.querySelectorAll("#fitfile-loading-overlay")
        ).toHaveLength(1);

        LoadingOverlay.show("Step 2");
        const second = document.getElementById("fitfile-loading-overlay");
        expect(second).toBe(first);

        const text = document.getElementById("fitfile-loading-text");
        expect(text?.textContent).toBe("Step 2");

        const file = document.getElementById("fitfile-loading-filename");
        // When no filename provided, it should clear the filename text
        expect(file?.textContent).not.toBe("File: first.fit");
        expect(file?.textContent).toBe("");
    });

    it("hide removes the overlay from DOM", async () => {
        const { LoadingOverlay } =
            await import("../../../electron-app/utils/ui/components/LoadingOverlay.js");

        LoadingOverlay.show("Working...");
        expect(
            document.querySelectorAll("#fitfile-loading-overlay")
        ).toHaveLength(1);

        LoadingOverlay.hide();
        expect(
            document.querySelectorAll("#fitfile-loading-overlay")
        ).toHaveLength(0);
    });
});
