import { describe, expect, it, vi } from "vitest";
import { registerMenuIpcListeners } from "../../../../../utils/app/lifecycle/menuIpcListeners.js";
import { openFileSelector } from "../../../../../utils/files/import/openFileSelector.js";

vi.mock(
    import("../../../../../utils/files/import/openFileSelector.js"),
    () => ({
        openFileSelector: vi.fn<() => Promise<void>>(),
    })
);

type TestMenuChannel =
    | "menu-about"
    | "menu-export"
    | "menu-keyboard-shortcuts"
    | "menu-open-overlay"
    | "menu-restart-update"
    | "menu-save-as"
    | "open-accent-color-picker";

type TestMenuHandler = (...args: unknown[]) => unknown;

type TestMenuElectronAPI = {
    installUpdate: ReturnType<typeof vi.fn<() => void>>;
    onIpc: ReturnType<
        typeof vi.fn<
            (channel: TestMenuChannel, callback: TestMenuHandler) => () => void
        >
    >;
    send: ReturnType<typeof vi.fn<(channel: string) => void>>;
};

type MenuIpcTestGlobal = typeof globalThis & {
    __ffvMenuForwardRegistry?: Set<string>;
    electronAPI?: TestMenuElectronAPI;
    showAccentColorPicker?: () => void;
    showKeyboardShortcutsModal?: () => void;
};

type MenuFixture = {
    debugMenuLog: ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;
    electronAPI: TestMenuElectronAPI;
    handlers: Map<TestMenuChannel, TestMenuHandler>;
    showAboutModal: ReturnType<typeof vi.fn<(html?: string) => void>>;
    showNotification: ReturnType<
        typeof vi.fn<
            (message: string, type?: string, durationMs?: number) => void
        >
    >;
    trackUnsubscribe: ReturnType<typeof vi.fn<(value: unknown) => void>>;
};

const openFileSelectorMock = vi.mocked(openFileSelector);

function cleanupFixture(): void {
    const holder = globalThis as MenuIpcTestGlobal;
    delete holder.__ffvMenuForwardRegistry;
    delete holder.electronAPI;
    delete holder.showAccentColorPicker;
    delete holder.showKeyboardShortcutsModal;
    document.head.replaceChildren();
    openFileSelectorMock.mockReset();
    vi.restoreAllMocks();
}

function setupFixture(): MenuFixture {
    const handlers = new Map<TestMenuChannel, TestMenuHandler>();
    const electronAPI: TestMenuElectronAPI = {
        installUpdate: vi.fn<() => void>(),
        onIpc: vi.fn<
            (channel: TestMenuChannel, callback: TestMenuHandler) => () => void
        >((channel: TestMenuChannel, callback: TestMenuHandler) => {
            handlers.set(channel, callback);
            return vi.fn<() => void>();
        }),
        send: vi.fn<(channel: string) => void>(),
    };
    const fixture: MenuFixture = {
        debugMenuLog: vi.fn<(...args: unknown[]) => void>(),
        electronAPI,
        handlers,
        showAboutModal: vi.fn<(html?: string) => void>(),
        showNotification:
            vi.fn<
                (message: string, type?: string, durationMs?: number) => void
            >(),
        trackUnsubscribe: vi.fn<(value: unknown) => void>(),
    };

    vi.spyOn(console, "error").mockImplementation(() => {});
    (globalThis as MenuIpcTestGlobal).electronAPI = electronAPI;
    openFileSelectorMock.mockResolvedValue(undefined);

    registerMenuIpcListeners({
        debugMenuLog: fixture.debugMenuLog,
        isTestEnvironment: true,
        showAboutModal: fixture.showAboutModal,
        showNotification: fixture.showNotification,
        trackUnsubscribe: fixture.trackUnsubscribe,
    });

    return fixture;
}

function getRequiredHandler(
    handlers: Map<TestMenuChannel, TestMenuHandler>,
    channel: TestMenuChannel
): TestMenuHandler {
    const handler = handlers.get(channel);
    if (handler === undefined) {
        throw new Error(`Missing handler for ${channel}`);
    }

    return handler;
}

describe(registerMenuIpcListeners, () => {
    it("registers the expected menu IPC channels", () => {
        expect.assertions(2);

        const fixture = setupFixture();

        try {
            expect([...fixture.handlers.keys()].sort()).toStrictEqual([
                "menu-about",
                "menu-export",
                "menu-keyboard-shortcuts",
                "menu-open-overlay",
                "menu-restart-update",
                "menu-save-as",
                "open-accent-color-picker",
            ]);
            expect(fixture.trackUnsubscribe).toHaveBeenCalledTimes(7);
        } finally {
            cleanupFixture();
        }
    });

    it("runs update, forwarding, about, and accent picker handlers", () => {
        expect.assertions(4);

        const fixture = setupFixture();
        let accentPickerOpened = false;
        (globalThis as MenuIpcTestGlobal).showAccentColorPicker = () => {
            accentPickerOpened = true;
        };

        try {
            getRequiredHandler(fixture.handlers, "menu-restart-update")();
            getRequiredHandler(fixture.handlers, "menu-save-as")();
            getRequiredHandler(fixture.handlers, "menu-about")();
            getRequiredHandler(fixture.handlers, "open-accent-color-picker")();

            expect(fixture.electronAPI.installUpdate).toHaveBeenCalledOnce();
            expect(fixture.electronAPI.send).toHaveBeenCalledWith(
                "menu-save-as"
            );
            expect(fixture.showAboutModal).toHaveBeenCalledOnce();
            expect({ accentPickerOpened }).toStrictEqual({
                accentPickerOpened: true,
            });
        } finally {
            cleanupFixture();
        }
    });

    it("reports overlay selector failures", async () => {
        expect.assertions(2);

        openFileSelectorMock.mockRejectedValueOnce(new Error("fail"));
        const fixture = setupFixture();

        try {
            await getRequiredHandler(fixture.handlers, "menu-open-overlay")();

            expect(fixture.showNotification).toHaveBeenCalledExactlyOnceWith(
                "Failed to open overlay selector.",
                "error",
                3000
            );
            expect(console.error).not.toHaveBeenCalled();
        } finally {
            cleanupFixture();
        }
    });

    it("loads the keyboard shortcut script when the global modal is missing", () => {
        expect.assertions(3);

        const fixture = setupFixture();
        const showKeyboardShortcutsModal = vi.fn<() => void>();

        try {
            getRequiredHandler(fixture.handlers, "menu-keyboard-shortcuts")();

            const script = document.head.querySelector(
                "script[src='./utils/keyboardShortcutsModal.js']"
            );
            (globalThis as MenuIpcTestGlobal).showKeyboardShortcutsModal =
                showKeyboardShortcutsModal;
            script?.dispatchEvent(new Event("load"));

            expect(script).toBeInstanceOf(HTMLScriptElement);
            expect(fixture.debugMenuLog).toHaveBeenCalledWith(
                "Script loaded successfully"
            );
            expect(showKeyboardShortcutsModal).toHaveBeenCalledOnce();
        } finally {
            cleanupFixture();
        }
    });

    it("shows fallback keyboard shortcut HTML when the script fails", () => {
        expect.assertions(2);

        const fixture = setupFixture();

        try {
            getRequiredHandler(fixture.handlers, "menu-keyboard-shortcuts")();

            const script = document.head.querySelector(
                "script[src='./utils/keyboardShortcutsModal.js']"
            );
            script?.dispatchEvent(new Event("error"));

            expect(script).toBeInstanceOf(HTMLScriptElement);
            expect(fixture.showAboutModal).toHaveBeenCalledWith(
                expect.stringContaining("Keyboard Shortcuts")
            );
        } finally {
            cleanupFixture();
        }
    });
});
