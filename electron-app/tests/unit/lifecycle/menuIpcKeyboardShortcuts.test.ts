// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { registerMenuIpcListeners } from "../../../utils/app/lifecycle/menuIpcListeners.js";

type MenuSendChannel = "menu-export" | "menu-save-as";
type MenuIpcChannel =
    | MenuSendChannel
    | "menu-about"
    | "menu-keyboard-shortcuts"
    | "menu-open-overlay"
    | "menu-restart-update"
    | "open-accent-color-picker";

type MenuIpcCallback = (...args: unknown[]) => unknown;
type Unsubscribe = () => void;

type MenuElectronApi = {
    onIpc: (channel: MenuIpcChannel, callback: MenuIpcCallback) => Unsubscribe;
    send: (channel: MenuSendChannel) => void;
};

type MenuTestGlobal = typeof globalThis & {
    __ffvMenuForwardRegistry?: Set<MenuSendChannel>;
    closeKeyboardShortcutsModal?: () => void;
    electronAPI?: MenuElectronApi;
    showKeyboardShortcutsModal?: () => void;
};

function getTestGlobal(): MenuTestGlobal {
    return globalThis as MenuTestGlobal;
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
    document.querySelector("#keyboard-shortcuts-modal")?.remove();
    document.querySelector("#keyboard-shortcuts-modal-styles")?.remove();
    for (const script of document.head.querySelectorAll(
        'script[src="./utils/keyboardShortcutsModal.js"]'
    )) {
        script.remove();
    }
    document.body.style.overflow = "";

    const testGlobal = getTestGlobal();
    delete testGlobal.__ffvMenuForwardRegistry;
    delete testGlobal.closeKeyboardShortcutsModal;
    delete testGlobal.electronAPI;
    delete testGlobal.showKeyboardShortcutsModal;
}

function registerTestMenuListeners(): {
    handlers: Map<MenuIpcChannel, MenuIpcCallback>;
    showAboutModal: ReturnType<typeof vi.fn<(html?: string) => void>>;
    showNotification: ReturnType<
        typeof vi.fn<
            (message: string, type?: string, durationMs?: number) => void
        >
    >;
} {
    const handlers = new Map<MenuIpcChannel, MenuIpcCallback>();
    const unsubscribe = vi.fn<Unsubscribe>();
    const onIpc = vi.fn<
        (channel: MenuIpcChannel, callback: MenuIpcCallback) => Unsubscribe
    >((channel, callback) => {
        handlers.set(channel, callback);
        return unsubscribe;
    });
    const debugMenuLog = vi.fn<(...args: unknown[]) => void>();
    const showAboutModal = vi.fn<(html?: string) => void>();
    const showNotification =
        vi.fn<(message: string, type?: string, durationMs?: number) => void>();
    const trackUnsubscribe = vi.fn<(maybeUnsubscribe: unknown) => void>();

    getTestGlobal().electronAPI = {
        onIpc,
        send: vi.fn<(channel: MenuSendChannel) => void>(),
    };

    registerMenuIpcListeners({
        debugMenuLog,
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
        expect.assertions(7);

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

            expect(modal.style.display).toBe("flex");
            expect([...modal.classList]).toContain("show");
            expect(
                document.querySelectorAll(".shortcuts-category")
            ).toHaveLength(3);
            expect(
                document.head.querySelectorAll(
                    'script[src="./utils/keyboardShortcutsModal.js"]'
                )
            ).toHaveLength(0);
            expect(getTestGlobal().showKeyboardShortcutsModal).toBeTypeOf(
                "function"
            );
            expect(showAboutModal).toHaveBeenCalledTimes(0);
            expect(showNotification).toHaveBeenCalledTimes(0);
        } finally {
            resetKeyboardShortcutsFixture();
        }
    });
});
