import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    applyTheme: vi.fn<(theme: string, withTransition?: boolean) => void>(),
    createAppIconElement: vi.fn<() => SVGSVGElement>(),
    getEffectiveAccentColor: vi.fn<(theme: string) => string>(),
    getEffectiveTheme: vi.fn<(theme: string) => "dark" | "light">(),
    injectModalStyles: vi.fn<() => void>(),
    isValidHexColor: vi.fn<(color: unknown) => color is string>(),
    loadTheme: vi.fn<() => "auto" | "dark" | "light">(),
    resetAccentColor: vi.fn<(theme: string) => string>(),
    sendThemeChanged: vi.fn<(theme: string) => void>(),
    setAccentColor: vi.fn<(color: string, theme: string) => boolean>(),
    setRendererTheme:
        vi.fn<(theme: string, options?: Record<string, unknown>) => void>(),
}));

vi.mock(
    import("../../../../electron-app/utils/state/domain/rendererThemeState.js"),
    () => ({
        setRendererTheme: mocks.setRendererTheme,
    })
);

vi.mock(
    import("../../../../electron-app/utils/theming/core/accentColor.js"),
    () => ({
        getEffectiveAccentColor: mocks.getEffectiveAccentColor,
        isValidHexColor: mocks.isValidHexColor,
        resetAccentColor: mocks.resetAccentColor,
        setAccentColor: mocks.setAccentColor,
    })
);

vi.mock(import("../../../../electron-app/utils/theming/core/theme.js"), () => ({
    THEME_MODES: {
        AUTO: "auto",
        DARK: "dark",
        LIGHT: "light",
    },
    applyTheme: mocks.applyTheme,
    getEffectiveTheme: mocks.getEffectiveTheme,
    loadTheme: mocks.loadTheme,
}));

vi.mock(
    import("../../../../electron-app/utils/ui/events/eventListenerManager.js"),
    () => ({
        addEventListenerWithCleanup: (
            element: EventTarget,
            eventType: string,
            handler: EventListener
        ) => {
            const controller = new AbortController();
            element.addEventListener(eventType, handler, {
                signal: controller.signal,
            });
            return () => controller.abort();
        },
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/icons/iconFactory.js"),
    () => ({
        createAppIconElement: mocks.createAppIconElement,
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/modals/injectModalStyles.js"),
    () => ({
        injectModalStyles: mocks.injectModalStyles,
    })
);

import {
    closeSettingsModal,
    showSettingsModal,
} from "../../../../electron-app/utils/ui/settingsModal.js";
import type { RendererElectronApiScope } from "../../../../electron-app/utils/runtime/electronApiRuntime.js";

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function change(element: HTMLElement): void {
    element.dispatchEvent(new Event("change", { bubbles: true }));
}

function input(element: HTMLElement): void {
    element.dispatchEvent(new Event("input", { bubbles: true }));
}

function click(element: HTMLElement): void {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function keydown(event: KeyboardEvent): void {
    document.dispatchEvent(event);
}

function getRequiredElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Missing expected element: ${selector}`);
    }
    return element;
}

function resetFixture(): RendererElectronApiScope {
    vi.useFakeTimers();
    vi.clearAllMocks();
    document.body.replaceChildren();
    document.head.replaceChildren();

    mocks.createAppIconElement.mockReturnValue(
        document.createElementNS("http://www.w3.org/2000/svg", "svg")
    );
    mocks.getEffectiveAccentColor.mockReturnValue("#3b82f6");
    mocks.getEffectiveTheme.mockReturnValue("dark");
    mocks.isValidHexColor.mockImplementation(
        (color): color is string =>
            typeof color === "string" && /^#[\da-f]{6}$/i.test(color)
    );
    mocks.loadTheme.mockReturnValue("dark");
    mocks.resetAccentColor.mockReturnValue("#3b82f6");
    mocks.setAccentColor.mockReturnValue(true);
    return createElectronApiScope({
        sendThemeChanged: mocks.sendThemeChanged,
    });
}

function cleanupFixture(): void {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.replaceChildren();
    document.head.replaceChildren();
}

describe("settingsModal", () => {
    it("creates the modal, injects styles, and keeps menu hooks module-scoped", async () => {
        expect.assertions(14);

        const electronApiScope = resetFixture();

        try {
            await showSettingsModal({ electronApiScope });
            await vi.dynamicImportSettled();
            vi.runOnlyPendingTimers();

            const modal = getRequiredElement<HTMLElement>("#settings-modal");
            const modalTitle = getRequiredElement<HTMLElement>(".modal-title");

            expect(modal.style.display).toBe("flex");
            expect(modal.getAttribute("role")).toBe("dialog");
            expect(modal.getAttribute("aria-modal")).toBe("true");
            expect(modal.getAttribute("aria-labelledby")).toBe(
                "settings-modal-title"
            );
            expect(modal.classList).not.toContain("closing");
            expect(modalTitle.textContent).toBe("Settings");
            expect(modalTitle.id).toBe("settings-modal-title");
            expect(document.activeElement).toBe(
                getRequiredElement<HTMLButtonElement>("#settings-modal-close")
            );
            expect(
                getRequiredElement<HTMLSelectElement>("#theme-select").value
            ).toBe("dark");
            expect(
                getRequiredElement<HTMLInputElement>("#accent-color-text").value
            ).toBe("#3b82f6");
            expect(
                document.querySelectorAll("#settings-modal-styles")
            ).toHaveLength(1);
            expect(mocks.injectModalStyles).toHaveBeenCalledOnce();
            expect(globalThis.showSettingsModal).toBeUndefined();
            expect(globalThis.closeSettingsModal).toBeUndefined();
        } finally {
            cleanupFixture();
        }
    });

    it("hides the modal after the close animation delay", async () => {
        expect.assertions(4);

        const electronApiScope = resetFixture();

        try {
            const launcher = document.createElement("button");
            launcher.type = "button";
            document.body.append(launcher);
            launcher.focus();

            await showSettingsModal({ electronApiScope });
            await vi.dynamicImportSettled();

            const modal = getRequiredElement<HTMLElement>("#settings-modal");

            closeSettingsModal();

            expect(modal.classList.contains("show")).toBe(false);
            expect(modal.style.display).toBe("flex");

            vi.advanceTimersByTime(300);

            expect(modal.style.display).toBe("none");
            expect(document.activeElement).toBe(launcher);
        } finally {
            cleanupFixture();
        }
    });

    it("keeps tab focus inside the open modal", async () => {
        expect.assertions(4);

        const electronApiScope = resetFixture();

        try {
            await showSettingsModal({ electronApiScope });
            await vi.dynamicImportSettled();

            const closeButton = getRequiredElement<HTMLButtonElement>(
                "#settings-modal-close"
            );
            const footerCloseButton = getRequiredElement<HTMLButtonElement>(
                "#settings-close-btn"
            );

            expect(document.activeElement).toBe(closeButton);

            keydown(
                new KeyboardEvent("keydown", {
                    key: "Tab",
                    shiftKey: true,
                })
            );

            expect(document.activeElement).toBe(footerCloseButton);

            keydown(new KeyboardEvent("keydown", { key: "Tab" }));

            expect(document.activeElement).toBe(closeButton);

            document.body.focus();
            keydown(new KeyboardEvent("keydown", { key: "Tab" }));

            expect(document.activeElement).toBe(closeButton);
        } finally {
            cleanupFixture();
        }
    });

    it("persists theme and accent control changes through the expected services", async () => {
        expect.assertions(7);

        const electronApiScope = resetFixture();

        try {
            await showSettingsModal({ electronApiScope });
            await vi.dynamicImportSettled();

            const themeSelect =
                getRequiredElement<HTMLSelectElement>("#theme-select");
            themeSelect.value = "light";
            mocks.getEffectiveTheme.mockReturnValue("light");
            change(themeSelect);

            expect(mocks.setRendererTheme).toHaveBeenCalledWith("light", {
                source: "settingsModal:theme-select",
            });
            expect(mocks.sendThemeChanged).toHaveBeenCalledWith("light");

            const colorPicker = getRequiredElement<HTMLInputElement>(
                "#accent-color-picker"
            );
            const colorText =
                getRequiredElement<HTMLInputElement>("#accent-color-text");
            colorPicker.value = "#ef4444";
            input(colorPicker);

            expect(colorText.value).toBe("#ef4444");
            expect(mocks.setAccentColor).toHaveBeenLastCalledWith(
                "#ef4444",
                "light"
            );

            colorText.value = "10b981";
            input(colorText);

            expect(colorText.value).toBe("#10b981");
            expect(colorPicker.value).toBe("#10b981");

            click(getRequiredElement<HTMLButtonElement>("#reset-accent-color"));

            expect(mocks.resetAccentColor).toHaveBeenCalledWith("light");
        } finally {
            cleanupFixture();
        }
    });

    it("ignores array-shaped Electron API candidates when syncing theme changes", async () => {
        expect.assertions(3);

        resetFixture();
        const sendThemeChanged = vi.fn<(theme: string) => void>();
        const api = [] as unknown[] & Record<string, unknown>;
        api["sendThemeChanged"] = sendThemeChanged;
        const electronApiScope = createElectronApiScope(api);

        try {
            await showSettingsModal({ electronApiScope });
            await vi.dynamicImportSettled();

            const themeSelect =
                getRequiredElement<HTMLSelectElement>("#theme-select");
            themeSelect.value = "light";
            change(themeSelect);

            expect(themeSelect.value).toBe("light");
            expect(mocks.setRendererTheme).toHaveBeenCalledWith("light", {
                source: "settingsModal:theme-select",
            });
            expect(sendThemeChanged).not.toHaveBeenCalled();
        } finally {
            cleanupFixture();
        }
    });

    it("ignores inaccessible Electron API theme-change properties when syncing theme changes", async () => {
        expect.assertions(2);

        resetFixture();
        const electronApiScope = createElectronApiScope(
            Object.defineProperty({}, "sendThemeChanged", {
                get() {
                    throw new Error("blocked theme property");
                },
            })
        );

        try {
            await showSettingsModal({ electronApiScope });
            await vi.dynamicImportSettled();

            const themeSelect =
                getRequiredElement<HTMLSelectElement>("#theme-select");
            themeSelect.value = "light";
            change(themeSelect);

            expect(themeSelect.value).toBe("light");
            expect(mocks.setRendererTheme).toHaveBeenCalledWith("light", {
                source: "settingsModal:theme-select",
            });
        } finally {
            cleanupFixture();
        }
    });
});
