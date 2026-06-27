// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerDevtoolsInjectMenuHandler } from "../../../../electron-app/main/menu/registerDevtoolsInjectMenuHandler.js";

type DevtoolsInjectMenuHandler = (
    event?: unknown,
    ...args: unknown[]
) => unknown;
type GenericInvokeChannel = "devtools-inject-menu";
type RegisterDevtoolsInjectMenuHandlerOptions = Parameters<
    typeof registerDevtoolsInjectMenuHandler
>[0];

describe("registerDevtoolsInjectMenuHandler", () => {
    let handler: DevtoolsInjectMenuHandler | undefined;
    let menuCalls: unknown[][];
    let logCalls: unknown[][];

    beforeEach(() => {
        handler = undefined;
        menuCalls = [];
        logCalls = [];
    });

    function registerDefaultHandler(
        overrides: Partial<RegisterDevtoolsInjectMenuHandlerOptions> = {}
    ): {
        readonly safeCreateAppMenu: ReturnType<typeof vi.fn>;
        readonly validateDevtoolsInjectMenuPayload: ReturnType<typeof vi.fn>;
    } {
        const safeCreateAppMenu = vi.fn((...args: unknown[]) => {
            menuCalls.push(args);
        });
        const validateDevtoolsInjectMenuPayload = vi.fn(() => ({
            fitFilePath: "C:/rides/current.fit",
            theme: "dark",
        }));

        registerDevtoolsInjectMenuHandler({
            browserWindowRef: () => ({
                fromWebContents: (sender) =>
                    sender === "sender"
                        ? ({ marker: "main-window" } as never)
                        : null,
            }),
            constants: {
                DEFAULT_THEME: "light",
            },
            isDevtoolsMenuInjectionAllowed: () => true,
            logWithContext: (...args) => {
                logCalls.push(args);
            },
            registerIpcHandle: (
                channel: GenericInvokeChannel,
                registeredHandler: DevtoolsInjectMenuHandler
            ) => {
                if (channel === "devtools-inject-menu") {
                    handler = registeredHandler;
                }
            },
            safeCreateAppMenu,
            validateDevtoolsInjectMenuPayload,
            ...overrides,
        });

        return {
            safeCreateAppMenu:
                (overrides.safeCreateAppMenu as typeof safeCreateAppMenu) ??
                safeCreateAppMenu,
            validateDevtoolsInjectMenuPayload:
                (overrides.validateDevtoolsInjectMenuPayload as typeof validateDevtoolsInjectMenuPayload) ??
                validateDevtoolsInjectMenuPayload,
        };
    }

    function getHandler(): DevtoolsInjectMenuHandler {
        if (typeof handler !== "function") {
            throw new TypeError(
                "devtools-inject-menu handler was not registered"
            );
        }

        return handler;
    }

    it("no-ops when handle registration is unavailable", () => {
        expect.assertions(1);

        registerDevtoolsInjectMenuHandler({
            browserWindowRef: () => null,
            isDevtoolsMenuInjectionAllowed: () => true,
            registerIpcHandle:
                undefined as unknown as RegisterDevtoolsInjectMenuHandlerOptions["registerIpcHandle"],
            safeCreateAppMenu: () => void 0,
        });

        expect(handler).toBeUndefined();
    });

    it("blocks menu injection outside development before payload validation", () => {
        expect.assertions(4);

        const { safeCreateAppMenu, validateDevtoolsInjectMenuPayload } =
            registerDefaultHandler({
                isDevtoolsMenuInjectionAllowed: () => false,
            });

        const result = getHandler()({ sender: "sender" }, "dark", "C:/x.fit");

        expect(result).toBe(false);
        expect(validateDevtoolsInjectMenuPayload).not.toHaveBeenCalled();
        expect(safeCreateAppMenu).not.toHaveBeenCalled();
        expect(logCalls).toStrictEqual([
            ["warn", "Blocked devtools menu injection outside development"],
        ]);
    });

    it("blocks invalid menu injection payloads", () => {
        expect.assertions(4);

        const validationError = new TypeError("bad payload");
        const { safeCreateAppMenu, validateDevtoolsInjectMenuPayload } =
            registerDefaultHandler({
                validateDevtoolsInjectMenuPayload: vi.fn(() => {
                    throw validationError;
                }),
            });

        const result = getHandler()(
            { sender: "sender" },
            "broken",
            "not-a-fit"
        );

        expect(result).toBe(false);
        expect(validateDevtoolsInjectMenuPayload).toHaveBeenCalledWith(
            "broken",
            "not-a-fit"
        );
        expect(safeCreateAppMenu).not.toHaveBeenCalled();
        expect(logCalls).toStrictEqual([
            [
                "warn",
                "Blocked devtools menu injection with invalid payload",
                { error: "bad payload" },
            ],
        ]);
    });

    it("creates the app menu for valid development requests", () => {
        expect.assertions(4);

        const { safeCreateAppMenu, validateDevtoolsInjectMenuPayload } =
            registerDefaultHandler();

        const result = getHandler()(
            { sender: "sender" },
            "system",
            "C:/rides/current.fit"
        );

        expect(result).toBe(true);
        expect(validateDevtoolsInjectMenuPayload).toHaveBeenCalledWith(
            "system",
            "C:/rides/current.fit"
        );
        expect(safeCreateAppMenu).toHaveBeenCalledWith(
            { marker: "main-window" },
            "dark",
            "C:/rides/current.fit"
        );
        expect(logCalls).toStrictEqual([
            [
                "info",
                "Manual menu injection requested",
                {
                    fitFilePath: "C:/rides/current.fit",
                    theme: "dark",
                },
            ],
        ]);
    });

    it("uses the default theme and skips menu creation when no sender window exists", () => {
        expect.assertions(3);

        const { safeCreateAppMenu } = registerDefaultHandler({
            validateDevtoolsInjectMenuPayload: vi.fn(() => ({
                fitFilePath: null,
                theme: null,
            })),
        });

        const result = getHandler()({ sender: "other" }, null, null);

        expect(result).toBe(true);
        expect(safeCreateAppMenu).not.toHaveBeenCalled();
        expect(logCalls).toStrictEqual([
            [
                "info",
                "Manual menu injection requested",
                {
                    fitFilePath: null,
                    theme: "light",
                },
            ],
        ]);
    });
});
