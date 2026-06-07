import { describe, expect, it, vi } from "vitest";

import {
    getElectronApiHooksFromValue,
    getElectronApiStartupHooks,
    probeDevelopmentMode,
    registerStartupElectronHooks,
} from "../../../electron-app/renderer/electronApiStartupHooks.js";

describe("renderer Electron API startup hooks", () => {
    it("extracts only callable startup hooks from an Electron API object", () => {
        expect.assertions(1);

        const checkForUpdates = vi.fn<() => void>();
        const isDevelopment = vi.fn<() => Promise<boolean>>();
        const onMenuAction = vi.fn<(callback: () => void) => void>();
        const onThemeChanged = vi.fn<(callback: () => void) => void>();
        const recentFiles = vi.fn<() => Promise<string[]>>();

        expect(
            getElectronApiHooksFromValue({
                checkForUpdates,
                isDevelopment,
                onMenuAction,
                onThemeChanged,
                recentFiles,
                ignored: "not-callable",
            })
        ).toStrictEqual({
            checkForUpdates,
            isDevelopment,
            onMenuAction,
            onThemeChanged,
            recentFiles,
        });
    });

    it("returns null when no Electron API object is present", () => {
        expect.assertions(2);

        expect(getElectronApiHooksFromValue(undefined)).toBeNull();
        expect(getElectronApiStartupHooks({} as typeof globalThis)).toBeNull();
    });

    it("wires menu and theme callbacks while isolating callback failures", async () => {
        expect.assertions(5);

        let menuCallback: ((action: unknown) => void) | undefined;
        let themeCallback: ((theme: string) => void) | undefined;
        const button = document.createElement("button");
        const click = vi.spyOn(button, "click");
        const showAboutModal = vi.fn<() => void>(() => {
            throw new Error("modal failed");
        });
        const applyTheme = vi.fn<(theme: string) => void>(() => {
            throw new Error("theme failed");
        });
        const isDevelopment = vi.fn<() => Promise<boolean>>(() =>
            Promise.resolve(true)
        );

        registerStartupElectronHooks(
            {
                checkForUpdates: undefined,
                isDevelopment,
                onMenuAction: (callback) => {
                    menuCallback = callback;
                },
                onThemeChanged: (callback) => {
                    themeCallback = callback;
                },
                recentFiles: undefined,
            },
            button,
            showAboutModal,
            applyTheme
        );

        menuCallback?.("open-file");
        menuCallback?.("about");
        themeCallback?.("dark");
        await Promise.resolve();

        expect(click).toHaveBeenCalledOnce();
        expect(showAboutModal).toHaveBeenCalledOnce();
        expect(applyTheme).toHaveBeenCalledWith("dark");
        expect(isDevelopment).toHaveBeenCalledOnce();
        expect({ menuCallback, themeCallback }).toStrictEqual({
            menuCallback: expect.any(Function),
            themeCallback: expect.any(Function),
        });
    });

    it("ignores optional development-mode probe failures", async () => {
        expect.assertions(2);

        const isDevelopment = vi.fn<() => Promise<boolean>>(() =>
            Promise.reject(new Error("not available"))
        );
        let unhandledRejectionObserved = false;
        const onUnhandledRejection = (): void => {
            unhandledRejectionObserved = true;
        };

        globalThis.addEventListener("unhandledrejection", onUnhandledRejection);
        try {
            probeDevelopmentMode({
                checkForUpdates: undefined,
                isDevelopment,
                onMenuAction: undefined,
                onThemeChanged: undefined,
                recentFiles: undefined,
            });
            await Promise.resolve();
        } finally {
            globalThis.removeEventListener(
                "unhandledrejection",
                onUnhandledRejection
            );
        }

        expect(unhandledRejectionObserved).toBe(false);
        expect(isDevelopment).toHaveBeenCalledOnce();
    });
});
