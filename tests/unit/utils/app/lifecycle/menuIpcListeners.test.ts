import { describe, expect, it, vi } from "vitest";
import { registerMenuIpcListeners } from "../../../../../electron-app/utils/app/lifecycle/menuIpcListeners.js";
import { openFileSelector } from "../../../../../electron-app/utils/files/import/openFileSelector.js";

const keyboardShortcutsModalMock = vi.hoisted(() => ({
    moduleHasExport: true,
    showKeyboardShortcutsModal: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/files/import/openFileSelector.js"),
    () => ({
        openFileSelector: vi.fn<() => Promise<void>>(),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/modals/keyboardShortcutsModal.js"),
    () => ({
        get showKeyboardShortcutsModal() {
            return keyboardShortcutsModalMock.moduleHasExport
                ? keyboardShortcutsModalMock.showKeyboardShortcutsModal
                : undefined;
        },
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
    keyboardShortcutsModalMock.moduleHasExport = true;
    keyboardShortcutsModalMock.showKeyboardShortcutsModal.mockReset();
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

    it("loads the keyboard shortcuts module when the global modal is missing", async () => {
        expect.assertions(3);

        const fixture = setupFixture();

        try {
            await getRequiredHandler(
                fixture.handlers,
                "menu-keyboard-shortcuts"
            )();

            expect(
                keyboardShortcutsModalMock.showKeyboardShortcutsModal
            ).toHaveBeenCalledOnce();
            expect(
                (globalThis as MenuIpcTestGlobal).showKeyboardShortcutsModal
            ).toBe(keyboardShortcutsModalMock.showKeyboardShortcutsModal);
            expect(fixture.debugMenuLog).toHaveBeenCalledWith(
                "Keyboard shortcuts modal not loaded, importing dynamically..."
            );
        } finally {
            cleanupFixture();
        }
    });

    it("shows fallback keyboard shortcut HTML when the module has no presenter", async () => {
        expect.assertions(3);

        keyboardShortcutsModalMock.moduleHasExport = false;
        const fixture = setupFixture();
        let fallbackHtml: string | undefined;
        fixture.showAboutModal.mockImplementation((html?: string) => {
            fallbackHtml = html;
        });

        try {
            await getRequiredHandler(
                fixture.handlers,
                "menu-keyboard-shortcuts"
            )();

            const expectedFallbackHtml =
                "<h2>Keyboard Shortcuts</h2><ul class=\"shortcut-list\"><li class='shortcut-list-item'><strong>Open File:</strong> <span class='shortcut-key'>Ctrl+O</span></li><li class='shortcut-list-item'><strong>Save As:</strong> <span class='shortcut-key'>Ctrl+S</span></li><li class='shortcut-list-item'><strong>Print:</strong> <span class='shortcut-key'>Ctrl+P</span></li><li class='shortcut-list-item'><strong>Close Window:</strong> <span class='shortcut-key'>Ctrl+W</span></li><li class='shortcut-list-item'><strong>Reload:</strong> <span class='shortcut-key'>Ctrl+R</span></li><li class='shortcut-list-item'><strong>Toggle DevTools:</strong> <span class='shortcut-key'>Ctrl+Shift+I</span></li><li class='shortcut-list-item'><strong>Toggle Fullscreen:</strong> <span class='shortcut-key'>F11</span></li><li class='shortcut-list-item'><strong>Export:</strong> <span class='shortcut-key'>No default</span></li><li class='shortcut-list-item'><strong>Theme: Dark/Light:</strong> <span class='shortcut-key'>Settings > Theme</span></li></ul>";
            expect(fallbackHtml).toBe(expectedFallbackHtml);
            expect(fixture.showAboutModal).toHaveBeenCalledWith(
                expectedFallbackHtml
            );
            expect(fixture.debugMenuLog).toHaveBeenCalledWith(
                "Keyboard shortcuts modal module loaded, but showKeyboardShortcutsModal is unavailable"
            );
        } finally {
            cleanupFixture();
        }
    });
});
