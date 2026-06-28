import { describe, expect, it, vi } from "vitest";

import { createRendererElectronMenuActionHandlers } from "../../../electron-app/renderer/electronMenuActionHandlers.js";

describe("electronMenuActionHandlers", () => {
    it("clicks the file input for open-file menu actions", () => {
        expect.assertions(2);
        const fileInput = {
            click: vi.fn<() => void>(),
        } as unknown as HTMLInputElement;
        const { onMenuAction, onThemeChanged } =
            createRendererElectronMenuActionHandlers({
                applyTheme: vi.fn<(theme: string) => void>(),
                getFileInput: vi.fn<() => HTMLInputElement | null>(
                    () => fileInput
                ),
                logRenderer:
                    vi.fn<(level: "warn", ...args: unknown[]) => void>(),
                showAboutModal: vi.fn<() => void>(),
            });

        onMenuAction("open-file");

        expect(fileInput.click).toHaveBeenCalledOnce();
        expect(onThemeChanged).toBeTypeOf("function");
    });

    it("opens the about modal through resolved core modules", async () => {
        expect.assertions(1);
        let aboutModalOpened = false;
        const showAboutModal = (): void => {
            aboutModalOpened = true;
        };
        const { onMenuAction } = createRendererElectronMenuActionHandlers({
            applyTheme: vi.fn<(theme: string) => void>(),
            getFileInput: vi.fn<() => HTMLInputElement | null>(() => null),
            logRenderer: vi.fn<(level: "warn", ...args: unknown[]) => void>(),
            showAboutModal,
        });

        onMenuAction("about");
        await Promise.resolve();

        expect(aboutModalOpened).toBe(true);
    });

    it("applies theme changes through resolved core modules", async () => {
        expect.assertions(1);
        let appliedTheme = "";
        const applyTheme = (theme: string): void => {
            appliedTheme = theme;
        };
        const { onThemeChanged } = createRendererElectronMenuActionHandlers({
            applyTheme,
            getFileInput: vi.fn<() => HTMLInputElement | null>(() => null),
            logRenderer: vi.fn<(level: "warn", ...args: unknown[]) => void>(),
            showAboutModal: vi.fn<() => void>(),
        });

        onThemeChanged("dark");
        await Promise.resolve();

        expect(appliedTheme).toBe("dark");
    });

    it("logs theme and about failures without throwing", async () => {
        expect.assertions(2);
        const error = new Error("boom");
        const warningMessages: string[] = [];
        const logRenderer = (_level: "warn", message: unknown): void => {
            warningMessages.push(String(message));
        };
        const applyTheme = (): void => {
            throw error;
        };
        const showAboutModal = (): void => {
            throw error;
        };
        const { onMenuAction, onThemeChanged } =
            createRendererElectronMenuActionHandlers({
                applyTheme,
                getFileInput: vi.fn<() => HTMLInputElement | null>(() => null),
                logRenderer,
                showAboutModal,
            });

        onThemeChanged("dark");
        onMenuAction("about");
        await Promise.resolve();
        await Promise.resolve();

        expect(warningMessages).toContain("[Renderer] Failed to apply theme:");
        expect(warningMessages).toContain(
            "[Renderer] Failed to show about modal:"
        );
    });
});
