import { describe, expect, it, vi } from "vitest";

import type {
    GenericSendChannel,
    IpcResponsePayload,
} from "../../electron-app/shared/ipc";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi";
import { createPreloadSourceRequire } from "../vitest/helpers/preloadSourceRequire";

interface MenuEventApiModule {
    createMenuEventApi: (options: {
        channels: {
            DECODER_OPTIONS_CHANGED: string;
            EXPORT_FILE: string;
            INSTALL_UPDATE: "install-update";
            MENU_ABOUT: string;
            MENU_CHECK_FOR_UPDATES: "menu-check-for-updates";
            MENU_EXPORT: "menu-export";
            MENU_KEYBOARD_SHORTCUTS: string;
            MENU_OPEN_FILE: string;
            MENU_OPEN_OVERLAY: string;
            MENU_PRINT: string;
            MENU_RESTART_UPDATE: string;
            MENU_SAVE_AS: "menu-save-as";
            OPEN_ACCENT_COLOR_PICKER: string;
            OPEN_RECENT_FILE: string;
            OPEN_SUMMARY_COLUMN_SELECTOR: string;
            SET_FONT_SIZE: string;
            SET_FULLSCREEN: "set-fullscreen";
            SET_HIGH_CONTRAST: string;
            SET_THEME: string;
            SHOW_NOTIFICATION: string;
            THEME_CHANGED: "theme-changed";
            UNLOAD_FIT_FILE: string;
        };
        createSafeEventHandler: (
            channel: string,
            methodName: string,
            transform?: (...args: IpcResponsePayload[]) => IpcResponsePayload
        ) => (callback: (...args: unknown[]) => unknown) => () => void;
        createSafeSendHandler: (
            channel: GenericSendChannel,
            methodName: string
        ) => (...args: unknown[]) => void;
    }) => Pick<
        ElectronAPI,
        | "checkForUpdates"
        | "installUpdate"
        | "onMenuAbout"
        | "onMenuOpenFile"
        | "onOpenRecentFile"
        | "onSetTheme"
        | "requestExport"
        | "requestSaveAs"
        | "sendThemeChanged"
        | "setFullScreen"
    >;
}

const requireFromTest = createPreloadSourceRequire(import.meta.url);
const { createMenuEventApi } = requireFromTest(
    "../../electron-app/preload/menuEventApi.js"
) as MenuEventApiModule;

function createApi() {
    const eventHandlers: Array<{
        channel: string;
        methodName: string;
        transform?: (...args: IpcResponsePayload[]) => IpcResponsePayload;
    }> = [];
    const sendCalls: Array<{
        args: unknown[];
        channel: GenericSendChannel;
        methodName: string;
    }> = [];
    const createSafeEventHandler = vi.fn(
        (
            channel: string,
            methodName: string,
            transform?: (...args: IpcResponsePayload[]) => IpcResponsePayload
        ) =>
            (_callback: (...args: unknown[]) => unknown) => {
                eventHandlers.push({ channel, methodName, transform });
                return () => undefined;
            }
    );
    const createSafeSendHandler = vi.fn(
        (channel: GenericSendChannel, methodName: string) =>
            (...args: unknown[]) => {
                sendCalls.push({ args, channel, methodName });
            }
    );

    return {
        api: createMenuEventApi({
            channels: {
                DECODER_OPTIONS_CHANGED: "decoder-options-changed",
                EXPORT_FILE: "export-file",
                INSTALL_UPDATE: "install-update",
                MENU_ABOUT: "menu-about",
                MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
                MENU_EXPORT: "menu-export",
                MENU_KEYBOARD_SHORTCUTS: "menu-keyboard-shortcuts",
                MENU_OPEN_FILE: "menu-open-file",
                MENU_OPEN_OVERLAY: "menu-open-overlay",
                MENU_PRINT: "menu-print",
                MENU_RESTART_UPDATE: "menu-restart-update",
                MENU_SAVE_AS: "menu-save-as",
                OPEN_ACCENT_COLOR_PICKER: "open-accent-color-picker",
                OPEN_RECENT_FILE: "open-recent-file",
                OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
                SET_FONT_SIZE: "set-font-size",
                SET_FULLSCREEN: "set-fullscreen",
                SET_HIGH_CONTRAST: "set-high-contrast",
                SET_THEME: "set-theme",
                SHOW_NOTIFICATION: "show-notification",
                THEME_CHANGED: "theme-changed",
                UNLOAD_FIT_FILE: "unload-fit-file",
            },
            createSafeEventHandler,
            createSafeSendHandler,
        }),
        eventHandlers,
        sendCalls,
    };
}

describe("preload menu event API", () => {
    it("routes send methods through expected IPC channels", () => {
        expect.assertions(1);

        const { api, sendCalls } = createApi();

        api.checkForUpdates();
        api.installUpdate();
        api.requestExport();
        api.requestSaveAs();
        api.sendThemeChanged("dark");
        api.setFullScreen(true);

        expect(sendCalls).toStrictEqual([
            {
                args: [],
                channel: "menu-check-for-updates",
                methodName: "checkForUpdates",
            },
            {
                args: [],
                channel: "install-update",
                methodName: "installUpdate",
            },
            { args: [], channel: "menu-export", methodName: "requestExport" },
            { args: [], channel: "menu-save-as", methodName: "requestSaveAs" },
            {
                args: ["dark"],
                channel: "theme-changed",
                methodName: "sendThemeChanged",
            },
            {
                args: [true],
                channel: "set-fullscreen",
                methodName: "setFullScreen",
            },
        ]);
    });

    it("registers menu events and keeps payload transforms explicit", () => {
        expect.assertions(3);

        const { api, eventHandlers } = createApi();

        api.onMenuAbout(vi.fn());
        api.onMenuOpenFile(vi.fn());
        api.onOpenRecentFile(vi.fn());
        api.onSetTheme(vi.fn());

        expect(
            eventHandlers.map(({ channel, methodName }) => ({
                channel,
                methodName,
            }))
        ).toStrictEqual([
            { channel: "menu-about", methodName: "onMenuAbout" },
            { channel: "menu-open-file", methodName: "onMenuOpenFile" },
            { channel: "open-recent-file", methodName: "onOpenRecentFile" },
            { channel: "set-theme", methodName: "onSetTheme" },
        ]);
        expect(eventHandlers[2]?.transform?.("C:/rides/a.fit")).toBe(
            "C:/rides/a.fit"
        );
        expect(eventHandlers[3]?.transform?.("dark")).toBe("dark");
    });
});
