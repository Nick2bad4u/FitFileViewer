import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getElectronApiHooksFromValue,
    getElectronApiStartupHooks,
    probeDevelopmentMode,
    registerStartupElectronHooks,
} from "../../../electron-app/renderer/electronApiStartupHooks.js";
import {
    registerRendererElectronApiCandidate,
    resetRendererElectronApiCandidate,
} from "../../../electron-app/utils/runtime/electronApiRuntime.js";

describe("renderer Electron API startup hooks", () => {
    afterEach(() => {
        resetRendererElectronApiCandidate();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

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
        expect(getElectronApiStartupHooks({})).toBeNull();
    });

    it("ignores the registered Electron API candidate without an explicit scope", () => {
        expect.assertions(1);

        const checkForUpdates = vi.fn<() => void>();
        const recentFiles = vi.fn<() => Promise<string[]>>();
        registerRendererElectronApiCandidate({
            checkForUpdates,
            recentFiles,
        });

        expect(getElectronApiStartupHooks({})).toBeNull();
    });

    it("ignores ambient Electron API globals without a registered candidate", () => {
        expect.assertions(1);

        const checkForUpdates = vi.fn<() => void>();
        const recentFiles = vi.fn<() => Promise<string[]>>();
        vi.stubGlobal("electronAPI", {
            checkForUpdates,
            recentFiles,
        });

        expect(getElectronApiStartupHooks()).toBeNull();
    });

    it("reads startup hooks through provider scopes", () => {
        expect.assertions(3);

        const checkForUpdates = vi.fn<() => void>();
        const recentFiles = vi.fn<() => Promise<string[]>>();
        const electronApiScope = {
            getElectronAPI: () => ({
                checkForUpdates,
                recentFiles,
            }),
        };
        const getElectronApiScope = vi.fn(() => electronApiScope);

        expect(getElectronApiStartupHooks({ getElectronApiScope })).toEqual(
            expect.objectContaining({
                checkForUpdates,
                recentFiles,
            })
        );
        expect(getElectronApiScope).toHaveBeenCalledOnce();
        expect(checkForUpdates).not.toHaveBeenCalled();
    });

    it("ignores direct Electron API provider scopes", () => {
        expect.assertions(1);

        const checkForUpdates = vi.fn<() => void>();
        const recentFiles = vi.fn<() => Promise<string[]>>();

        expect(
            getElectronApiStartupHooks({
                getElectronAPI: () => ({
                    checkForUpdates,
                    recentFiles,
                }),
            } as unknown as Parameters<typeof getElectronApiStartupHooks>[0])
        ).toBeNull();
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
