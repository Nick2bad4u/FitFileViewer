// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerThemeChangedHandler } from "../../../../electron-app/main/menu/registerThemeChangedHandler.js";

type MainProcessIpcEventChannel = "theme-changed";
type ThemeChangedListener = (event?: unknown, ...args: unknown[]) => unknown;
type RegisterThemeChangedHandlerOptions = Parameters<
    typeof registerThemeChangedHandler
>[0];

describe("registerThemeChangedHandler", () => {
    let listener: ThemeChangedListener | undefined;
    let persisted: Record<string, unknown>;
    let menuCalls: unknown[][];

    beforeEach(() => {
        listener = undefined;
        persisted = {};
        menuCalls = [];
    });

    function registerDefaultHandler(
        overrides: Partial<RegisterThemeChangedHandlerOptions> = {}
    ): void {
        registerThemeChangedHandler({
            browserWindowRef: () => ({
                fromWebContents: (sender) =>
                    sender === "sender"
                        ? ({ marker: "main-window" } as never)
                        : null,
            }),
            constants: {
                DEFAULT_THEME: "light",
                SETTINGS_CONFIG_NAME: "settings",
            },
            createConf: ({ name }) => ({
                set: (key, value) => {
                    persisted[`${name}:${key}`] = value;
                },
            }),
            getLoadedFitFilePath: () => "C:/loaded.fit",
            registerIpcListener: (
                channel: MainProcessIpcEventChannel,
                registeredListener: ThemeChangedListener
            ) => {
                if (channel === "theme-changed") {
                    listener = registeredListener;
                }
            },
            safeCreateAppMenu: (...args) => {
                menuCalls.push(args);
            },
            validateWindow: () => true,
            ...overrides,
        });
    }

    function getListener(): ThemeChangedListener {
        if (typeof listener !== "function") {
            throw new TypeError("theme-changed listener was not registered");
        }

        return listener;
    }

    it("no-ops when listener registration is unavailable", () => {
        expect.assertions(1);

        registerThemeChangedHandler({
            browserWindowRef: () => null,
            registerIpcListener:
                undefined as unknown as RegisterThemeChangedHandlerOptions["registerIpcListener"],
            safeCreateAppMenu: () => void 0,
            validateWindow: () => true,
        });

        expect(listener).toBeUndefined();
    });

    it("persists normalized themes and refreshes the app menu", () => {
        expect.assertions(2);

        registerDefaultHandler();

        getListener()({ sender: "sender" }, "system");

        expect(persisted).toStrictEqual({
            "settings:theme": "auto",
        });
        expect(menuCalls).toStrictEqual([
            [
                { marker: "main-window" },
                "system",
                "C:/loaded.fit",
            ],
        ]);
    });

    it("uses the default menu theme without persisting invalid theme payloads", () => {
        expect.assertions(2);

        registerDefaultHandler();

        getListener()({ sender: "sender" }, "");

        expect(persisted).toStrictEqual({});
        expect(menuCalls).toStrictEqual([
            [
                { marker: "main-window" },
                "light",
                "C:/loaded.fit",
            ],
        ]);
    });

    it("skips persistence and menu refresh when the sender window is unavailable", () => {
        expect.assertions(2);

        registerDefaultHandler();

        getListener()({ sender: "other" }, "dark");

        expect(persisted).toStrictEqual({});
        expect(menuCalls).toStrictEqual([]);
    });

    it("continues refreshing the menu when persistence fails", () => {
        expect.assertions(2);

        registerDefaultHandler({
            createConf: () => {
                throw new Error("settings failed");
            },
        });

        getListener()({ sender: "sender" }, "dark");

        expect(persisted).toStrictEqual({});
        expect(menuCalls).toStrictEqual([
            [
                { marker: "main-window" },
                "dark",
                "C:/loaded.fit",
            ],
        ]);
    });

    it("validates the sender window before persisting or refreshing the menu", () => {
        expect.assertions(4);

        const validateWindow = vi.fn<() => boolean>(() => false);

        registerDefaultHandler({ validateWindow });

        getListener()({ sender: "sender" }, "dark");

        expect(validateWindow).toHaveBeenCalledOnce();
        expect(validateWindow).toHaveBeenCalledWith(
            { marker: "main-window" },
            "theme-changed event"
        );
        expect(persisted).toStrictEqual({});
        expect(menuCalls).toStrictEqual([]);
    });
});
