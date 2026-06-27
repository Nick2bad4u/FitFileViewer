// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerUpdateMenuHandlers } from "../../../../electron-app/main/menu/registerUpdateMenuHandlers.js";

type MainProcessIpcEventChannel =
    | "install-update"
    | "menu-check-for-updates"
    | "menu-restart-update";
type UpdateListener = (event?: unknown, ...args: unknown[]) => unknown;
type RegisterUpdateMenuHandlersOptions = Parameters<
    typeof registerUpdateMenuHandlers
>[0];

describe("registerUpdateMenuHandlers", () => {
    let listeners: Partial<Record<MainProcessIpcEventChannel, UpdateListener>>;
    let logCalls: unknown[][];
    let notifications: unknown[][];
    let messageBoxes: unknown[];

    beforeEach(() => {
        listeners = {};
        logCalls = [];
        notifications = [];
        messageBoxes = [];
    });

    function registerDefaultHandlers(
        overrides: Partial<RegisterUpdateMenuHandlersOptions> = {}
    ): {
        readonly checkForUpdates: ReturnType<typeof vi.fn>;
        readonly quitAndInstall: ReturnType<typeof vi.fn>;
        readonly resolveAutoUpdaterAsync: ReturnType<typeof vi.fn>;
        readonly updateActions: readonly string[];
    } {
        const updateActions: string[] = [];
        const checkForUpdates = vi.fn(() => {
            updateActions.push("check-for-updates");
        });
        const quitAndInstall = vi.fn(() => {
            updateActions.push("quit-and-install");
        });
        const resolveAutoUpdaterAsync = vi.fn(async () => ({
            checkForUpdates,
            quitAndInstall,
        }));

        registerUpdateMenuHandlers({
            browserWindowRef: () => ({
                fromWebContents: (sender) =>
                    sender === "sender"
                        ? ({ marker: "main-window" } as never)
                        : null,
            }),
            constants: {
                PLATFORMS: {
                    LINUX: "linux",
                },
            },
            dialogRef: () => ({
                showMessageBox: (options) => {
                    messageBoxes.push(options);
                },
            }),
            getProcessStringValue: () => "win32",
            isAutoUpdaterInitialized: () => true,
            isAutoUpdaterUpdateDownloaded: () => true,
            logWithContext: (...args) => {
                logCalls.push(args);
            },
            registerIpcListener: (
                channel: MainProcessIpcEventChannel,
                listener: UpdateListener
            ) => {
                listeners[channel] = listener;
            },
            resolveAutoUpdaterAsync,
            sendToRenderer: (...args) => {
                notifications.push(args);
            },
            ...overrides,
        });

        return {
            checkForUpdates,
            quitAndInstall,
            resolveAutoUpdaterAsync:
                (overrides.resolveAutoUpdaterAsync as typeof resolveAutoUpdaterAsync) ??
                resolveAutoUpdaterAsync,
            updateActions,
        };
    }

    function getListener(channel: MainProcessIpcEventChannel): UpdateListener {
        const listener = listeners[channel];
        if (typeof listener !== "function") {
            throw new TypeError(`${channel} listener was not registered`);
        }

        return listener;
    }

    it("no-ops when listener registration is unavailable", () => {
        expect.assertions(1);

        registerUpdateMenuHandlers({
            browserWindowRef: () => null,
            registerIpcListener:
                undefined as unknown as RegisterUpdateMenuHandlersOptions["registerIpcListener"],
        });

        expect(listeners).toStrictEqual({});
    });

    it("registers the update menu IPC listeners", () => {
        expect.assertions(1);

        registerDefaultHandlers();

        expect(Object.keys(listeners).sort()).toStrictEqual([
            "install-update",
            "menu-check-for-updates",
            "menu-restart-update",
        ]);
    });

    it("blocks install requests until an update is downloaded", () => {
        expect.assertions(4);

        const { quitAndInstall, resolveAutoUpdaterAsync } =
            registerDefaultHandlers({
                isAutoUpdaterUpdateDownloaded: () => false,
            });

        const result = getListener("install-update")({ sender: "sender" });

        expect(result).toBeUndefined();
        expect(resolveAutoUpdaterAsync).not.toHaveBeenCalled();
        expect(quitAndInstall).not.toHaveBeenCalled();
        expect(notifications).toStrictEqual([
            [
                { marker: "main-window" },
                "show-notification",
                "Update install is not available yet.",
                "error",
            ],
        ]);
    });

    it("blocks update checks until the updater is initialized", () => {
        expect.assertions(4);

        const { checkForUpdates, resolveAutoUpdaterAsync } =
            registerDefaultHandlers({
                isAutoUpdaterInitialized: () => false,
            });

        const result = getListener("menu-check-for-updates")({
            sender: "sender",
        });

        expect(result).toBeUndefined();
        expect(resolveAutoUpdaterAsync).not.toHaveBeenCalled();
        expect(checkForUpdates).not.toHaveBeenCalled();
        expect(logCalls).toStrictEqual([
            ["warn", "Blocked update check before updater initialization"],
        ]);
    });

    it("runs update actions when readiness checks pass", async () => {
        expect.assertions(3);

        const { checkForUpdates, quitAndInstall, updateActions } =
            registerDefaultHandlers();

        await getListener("menu-check-for-updates")({ sender: "sender" });
        await getListener("menu-restart-update")({ sender: "sender" });

        expect(updateActions).toStrictEqual([
            "check-for-updates",
            "quit-and-install",
        ]);
        expect(checkForUpdates).toHaveBeenCalledOnce();
        expect(quitAndInstall).toHaveBeenCalledOnce();
    });

    it("shows the Linux manual update fallback when install fails", async () => {
        expect.assertions(3);

        const failure = new Error("updater missing");
        registerDefaultHandlers({
            getProcessStringValue: () => "linux",
            resolveAutoUpdaterAsync: vi.fn(async () => {
                throw failure;
            }),
        });

        await getListener("install-update")({ sender: "sender" });

        expect(logCalls).toStrictEqual([
            [
                "error",
                "Error during quitAndInstall:",
                { error: "updater missing" },
            ],
        ]);
        expect(messageBoxes).toHaveLength(1);
        expect(messageBoxes[0]).toStrictEqual({
            message:
                "Your Linux Distro does not support auto-updating, please download and install the latest version manually from the website.",
            title: "Manual Update Required",
            type: "info",
        });
    });
});
