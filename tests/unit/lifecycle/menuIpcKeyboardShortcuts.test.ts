// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    registerMenuIpcListeners,
    resetMenuIpcListenerStateForTests,
} from "../../../electron-app/utils/app/lifecycle/menuIpcListeners.js";
import type { RendererElectronApiScope } from "../../../electron-app/utils/runtime/electronApiRuntime.js";
import { closeKeyboardShortcutsModal } from "../../../electron-app/utils/ui/modals/keyboardShortcutsModal.js";

const modalFocusTrapMock = vi.hoisted(() => ({
    cleanup: vi.fn<() => void>(),
    createModalFocusTrap: vi.fn<() => () => void>(
        () => modalFocusTrapMock.cleanup
    ),
}));

vi.mock("../../../electron-app/utils/ui/modals/modalFocusTrap.js", () => ({
    createModalFocusTrap: modalFocusTrapMock.createModalFocusTrap,
}));

type MenuIpcChannel =
    | "menu-about"
    | "menu-export"
    | "menu-keyboard-shortcuts"
    | "menu-open-overlay"
    | "menu-restart-update"
    | "menu-save-as"
    | "open-accent-color-picker";

type MenuIpcCallback = (...args: unknown[]) => unknown;
type Unsubscribe = () => void;

type MenuElectronApi = {
    onMenuAbout: (callback: MenuIpcCallback) => Unsubscribe;
    onMenuExport: (callback: MenuIpcCallback) => Unsubscribe;
    onMenuKeyboardShortcuts: (callback: MenuIpcCallback) => Unsubscribe;
    onMenuOpenOverlay: (callback: MenuIpcCallback) => Unsubscribe;
    onMenuRestartUpdate: (callback: MenuIpcCallback) => Unsubscribe;
    onMenuSaveAs: (callback: MenuIpcCallback) => Unsubscribe;
    onOpenAccentColorPicker: (callback: MenuIpcCallback) => Unsubscribe;
    requestExport: () => void;
    requestSaveAs: () => void;
};

function createElectronApiScope(
    api: MenuElectronApi
): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function getRequiredHandler(
    handlers: Map<MenuIpcChannel, MenuIpcCallback>,
    channel: MenuIpcChannel
): MenuIpcCallback {
    const handler = handlers.get(channel);
    if (typeof handler !== "function") {
        throw new TypeError(`Missing IPC handler for ${channel}`);
    }

    return handler;
}

function getRequiredElement<TElement extends Element>(
    selector: string
): TElement {
    const element = document.querySelector<TElement>(selector);
    if (!element) {
        throw new TypeError(`Missing element for ${selector}`);
    }

    return element;
}

function resetKeyboardShortcutsFixture(): void {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.querySelector("#keyboard-shortcuts-modal")?.remove();
    document.querySelector("#keyboard-shortcuts-modal-styles")?.remove();
    for (const script of document.head.querySelectorAll(
        'script[src="./utils/keyboardShortcutsModal.js"]'
    )) {
        script.remove();
    }
    document.body.style.overflow = "";

    resetMenuIpcListenerStateForTests();
}

function registerTestMenuListeners(): {
    handlers: Map<MenuIpcChannel, MenuIpcCallback>;
    showAboutModal: ReturnType<
        typeof vi.fn<
            (
                html?: string,
                options?: { electronApiScope?: RendererElectronApiScope }
            ) => void
        >
    >;
    showNotification: ReturnType<
        typeof vi.fn<
            (message: string, type?: string, durationMs?: number) => void
        >
    >;
} {
    const handlers = new Map<MenuIpcChannel, MenuIpcCallback>();
    const unsubscribe = vi.fn<Unsubscribe>();
    const register =
        (channel: MenuIpcChannel) =>
        (callback: MenuIpcCallback): Unsubscribe => {
            handlers.set(channel, callback);
            return unsubscribe;
        };
    const debugMenuLog = vi.fn<(...args: unknown[]) => void>();
    const showAboutModal =
        vi.fn<
            (
                html?: string,
                options?: { electronApiScope?: RendererElectronApiScope }
            ) => void
        >();
    const showNotification =
        vi.fn<(message: string, type?: string, durationMs?: number) => void>();
    const trackUnsubscribe = vi.fn<(maybeUnsubscribe: unknown) => void>();

    const electronApiScope = createElectronApiScope({
        onMenuAbout: vi.fn(register("menu-about")),
        onMenuExport: vi.fn(register("menu-export")),
        onMenuKeyboardShortcuts: vi.fn(register("menu-keyboard-shortcuts")),
        onMenuOpenOverlay: vi.fn(register("menu-open-overlay")),
        onMenuRestartUpdate: vi.fn(register("menu-restart-update")),
        onMenuSaveAs: vi.fn(register("menu-save-as")),
        onOpenAccentColorPicker: vi.fn(register("open-accent-color-picker")),
        requestExport: vi.fn<() => void>(),
        requestSaveAs: vi.fn<() => void>(),
    });

    registerMenuIpcListeners({
        debugMenuLog,
        electronApiScope,
        isTestEnvironment: true,
        showAboutModal,
        showNotification,
        trackUnsubscribe,
    });

    return {
        handlers,
        showAboutModal,
        showNotification,
    };
}

describe("menu keyboard shortcuts IPC listener", () => {
    it("imports the shortcuts modal module without injecting the legacy script", async () => {
        expect.assertions(5);

        resetKeyboardShortcutsFixture();

        try {
            const { handlers, showAboutModal, showNotification } =
                registerTestMenuListeners();
            const keyboardShortcutsHandler = getRequiredHandler(
                handlers,
                "menu-keyboard-shortcuts"
            );

            await keyboardShortcutsHandler();

            const modal = getRequiredElement<HTMLElement>(
                "#keyboard-shortcuts-modal"
            );

            expect({
                categoryCount: document.querySelectorAll(".shortcuts-category")
                    .length,
                legacyScriptCount: document.head.querySelectorAll(
                    'script[src="./utils/keyboardShortcutsModal.js"]'
                ).length,
                modalClasses: [...modal.classList],
                modalDisplay: modal.style.display,
            }).toStrictEqual({
                categoryCount: 3,
                legacyScriptCount: 0,
                modalClasses: [
                    "modal",
                    "fancy-modal",
                    "show",
                ],
                modalDisplay: "flex",
            });
            expect("showKeyboardShortcutsModal" in globalThis).toBe(false);
            expect(
                modalFocusTrapMock.createModalFocusTrap
            ).toHaveBeenCalledWith(
                modal,
                getRequiredElement("#shortcuts-modal-close")
            );
            expect(showAboutModal).toHaveBeenCalledTimes(0);
            expect(showNotification).toHaveBeenCalledTimes(0);
        } finally {
            resetKeyboardShortcutsFixture();
        }
    });

    it("cleans up the shortcuts modal focus trap and cancels stale close timers on reopen", async () => {
        expect.assertions(3);

        resetKeyboardShortcutsFixture();
        vi.useFakeTimers();

        try {
            const { handlers } = registerTestMenuListeners();
            const keyboardShortcutsHandler = getRequiredHandler(
                handlers,
                "menu-keyboard-shortcuts"
            );

            await keyboardShortcutsHandler();
            closeKeyboardShortcutsModal();

            expect(modalFocusTrapMock.cleanup).toHaveBeenCalledTimes(1);

            const modal = getRequiredElement<HTMLElement>(
                "#keyboard-shortcuts-modal"
            );

            await keyboardShortcutsHandler();
            await vi.runOnlyPendingTimersAsync();

            expect(
                modalFocusTrapMock.createModalFocusTrap
            ).toHaveBeenCalledTimes(2);
            expect(modal.style.display).toBe("flex");
        } finally {
            resetKeyboardShortcutsFixture();
        }
    });
});
