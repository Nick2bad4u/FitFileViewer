import { describe, expect, it, vi } from "vitest";
import {
    registerMenuIpcListeners,
    resetMenuIpcListenerStateForTests,
} from "../../../../../electron-app/utils/app/lifecycle/menuIpcListeners.js";
import { openFileSelector } from "../../../../../electron-app/utils/files/import/openFileSelector.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

const keyboardShortcutsModalMock = vi.hoisted(() => ({
    moduleHasExport: true,
    showKeyboardShortcutsModal:
        vi.fn<
            (options?: { electronApiScope?: RendererElectronApiScope }) => void
        >(),
}));
const accentColorPickerMock = vi.hoisted(() => ({
    moduleHasExport: true,
    openAccentColorPicker: vi.fn<() => void>(() => {
        document.body.dataset["accentColorPicker"] = "opened";
    }),
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

vi.mock(
    import("../../../../../electron-app/ui/modals/accentColorPicker.js"),
    () => ({
        get openAccentColorPicker() {
            return accentColorPickerMock.moduleHasExport
                ? accentColorPickerMock.openAccentColorPicker
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
    onMenuAbout: ReturnType<typeof vi.fn<(callback: TestMenuHandler) => void>>;
    onMenuExport: ReturnType<typeof vi.fn<(callback: TestMenuHandler) => void>>;
    onMenuKeyboardShortcuts: ReturnType<
        typeof vi.fn<(callback: TestMenuHandler) => void>
    >;
    onMenuOpenOverlay: ReturnType<
        typeof vi.fn<(callback: TestMenuHandler) => void>
    >;
    onMenuRestartUpdate: ReturnType<
        typeof vi.fn<(callback: TestMenuHandler) => void>
    >;
    onMenuSaveAs: ReturnType<typeof vi.fn<(callback: TestMenuHandler) => void>>;
    onOpenAccentColorPicker: ReturnType<
        typeof vi.fn<(callback: TestMenuHandler) => void>
    >;
    requestExport: ReturnType<typeof vi.fn<() => void>>;
    requestSaveAs: ReturnType<typeof vi.fn<() => void>>;
};

type MenuFixture = {
    debugMenuLog: ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;
    electronApiScope: RendererElectronApiScope;
    handlers: Map<TestMenuChannel, TestMenuHandler>;
    menuApi: TestMenuElectronAPI;
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
    trackUnsubscribe: ReturnType<typeof vi.fn<(value: unknown) => void>>;
};

const openFileSelectorMock = vi.mocked(openFileSelector);

function cleanupFixture(): void {
    resetMenuIpcListenerStateForTests();
    document.head.replaceChildren();
    openFileSelectorMock.mockReset();
    accentColorPickerMock.moduleHasExport = true;
    accentColorPickerMock.openAccentColorPicker.mockReset();
    keyboardShortcutsModalMock.moduleHasExport = true;
    keyboardShortcutsModalMock.showKeyboardShortcutsModal.mockReset();
    vi.restoreAllMocks();
}

function setupFixture(): MenuFixture {
    const handlers = new Map<TestMenuChannel, TestMenuHandler>();
    const register =
        (channel: TestMenuChannel) =>
        (callback: TestMenuHandler): void => {
            handlers.set(channel, callback);
        };
    const electronAPI: TestMenuElectronAPI = {
        installUpdate: vi.fn<() => void>(),
        onMenuAbout: vi.fn(register("menu-about")),
        onMenuExport: vi.fn(register("menu-export")),
        onMenuKeyboardShortcuts: vi.fn(register("menu-keyboard-shortcuts")),
        onMenuOpenOverlay: vi.fn(register("menu-open-overlay")),
        onMenuRestartUpdate: vi.fn(register("menu-restart-update")),
        onMenuSaveAs: vi.fn(register("menu-save-as")),
        onOpenAccentColorPicker: vi.fn(register("open-accent-color-picker")),
        requestExport: vi.fn<() => void>(),
        requestSaveAs: vi.fn<() => void>(),
    };
    const electronApiScope: RendererElectronApiScope = {
        getElectronAPI: () => electronAPI,
    };
    const fixture: MenuFixture = {
        debugMenuLog: vi.fn<(...args: unknown[]) => void>(),
        electronApiScope,
        handlers,
        menuApi: electronAPI,
        showAboutModal:
            vi.fn<
                (
                    html?: string,
                    options?: { electronApiScope?: RendererElectronApiScope }
                ) => void
            >(),
        showNotification:
            vi.fn<
                (message: string, type?: string, durationMs?: number) => void
            >(),
        trackUnsubscribe: vi.fn<(value: unknown) => void>(),
    };

    vi.spyOn(console, "error").mockImplementation(() => {});
    openFileSelectorMock.mockResolvedValue(undefined);

    registerMenuIpcListeners({
        debugMenuLog: fixture.debugMenuLog,
        electronApiScope,
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
    it("rejects malformed scoped menu APIs without registering handlers", () => {
        expect.assertions(3);

        const handlers = new Map<TestMenuChannel, TestMenuHandler>();
        const getElectronAPI = vi.fn<() => unknown>(() => ({
            onMenuAbout: "menu-about",
            onMenuExport: (callback: TestMenuHandler) => {
                handlers.set("menu-export", callback);
            },
        }));
        const trackUnsubscribe = vi.fn<(value: unknown) => void>();

        try {
            registerMenuIpcListeners({
                debugMenuLog: vi.fn<(...args: unknown[]) => void>(),
                electronApiScope: { getElectronAPI },
                isTestEnvironment: true,
                showAboutModal: vi.fn(),
                showNotification: vi.fn(),
                trackUnsubscribe,
            });

            expect(getElectronAPI).toHaveBeenCalledOnce();
            expect(handlers.size).toBe(0);
            expect(trackUnsubscribe).not.toHaveBeenCalled();
        } finally {
            cleanupFixture();
        }
    });

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

    it("runs update, forwarding, about, and accent picker handlers", async () => {
        expect.assertions(6);

        const fixture = setupFixture();

        try {
            getRequiredHandler(fixture.handlers, "menu-restart-update")();
            getRequiredHandler(fixture.handlers, "menu-save-as")();
            getRequiredHandler(fixture.handlers, "menu-export")();
            getRequiredHandler(fixture.handlers, "menu-about")();
            await getRequiredHandler(
                fixture.handlers,
                "open-accent-color-picker"
            )();

            expect(fixture.menuApi.installUpdate).toHaveBeenCalledOnce();
            expect(fixture.menuApi.requestSaveAs).toHaveBeenCalledOnce();
            expect(fixture.menuApi.requestExport).toHaveBeenCalledOnce();
            expect(fixture.showAboutModal).toHaveBeenCalledOnce();
            expect(document.body.dataset["accentColorPicker"]).toBe("opened");
            expect(
                accentColorPickerMock.openAccentColorPicker
            ).toHaveBeenCalledOnce();
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

    it("loads and caches the keyboard shortcuts module presenter", async () => {
        expect.assertions(3);

        const fixture = setupFixture();

        try {
            await getRequiredHandler(
                fixture.handlers,
                "menu-keyboard-shortcuts"
            )();

            expect(
                keyboardShortcutsModalMock.showKeyboardShortcutsModal
            ).toHaveBeenCalledExactlyOnceWith({
                electronApiScope: fixture.electronApiScope,
            });
            expect("showKeyboardShortcutsModal" in globalThis).toBe(false);
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
                expectedFallbackHtml,
                { electronApiScope: fixture.electronApiScope }
            );
            expect(fixture.debugMenuLog).toHaveBeenCalledWith(
                "Keyboard shortcuts modal module loaded, but showKeyboardShortcutsModal is unavailable"
            );
        } finally {
            cleanupFixture();
        }
    });
});
