// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerFullscreenHandler } from "../../../../electron-app/main/menu/registerFullscreenHandler.js";

type MainProcessIpcEventChannel = "set-fullscreen";
type FullscreenListener = (event?: unknown, ...args: unknown[]) => unknown;
type RegisterFullscreenHandlerOptions = Parameters<
    typeof registerFullscreenHandler
>[0];

describe("registerFullscreenHandler", () => {
    let listener: FullscreenListener | undefined;

    beforeEach(() => {
        listener = undefined;
    });

    function registerDefaultHandler(
        overrides: Partial<RegisterFullscreenHandlerOptions> = {}
    ): {
        readonly setFullScreen: ReturnType<typeof vi.fn>;
        readonly validateWindow: ReturnType<typeof vi.fn<() => boolean>>;
    } {
        const setFullScreen = vi.fn();
        const win = { setFullScreen } as never;
        const validateWindow = vi.fn<() => boolean>(() => true);

        registerFullscreenHandler({
            browserWindowRef: () => ({ marker: "BrowserWindow" }) as never,
            registerIpcListener: (
                channel: MainProcessIpcEventChannel,
                registeredListener: FullscreenListener
            ) => {
                if (channel === "set-fullscreen") {
                    listener = registeredListener;
                }
            },
            resolveFocusedMainWindow: () => win,
            validateWindow,
            ...overrides,
        });

        return {
            setFullScreen,
            validateWindow:
                (overrides.validateWindow as typeof validateWindow) ??
                validateWindow,
        };
    }

    function getListener(): FullscreenListener {
        if (typeof listener !== "function") {
            throw new TypeError("set-fullscreen listener was not registered");
        }

        return listener;
    }

    it("no-ops when listener registration is unavailable", () => {
        expect.assertions(1);

        registerFullscreenHandler({
            browserWindowRef: () => null,
            registerIpcListener:
                undefined as unknown as RegisterFullscreenHandlerOptions["registerIpcListener"],
            validateWindow: () => true,
        });

        expect(listener).toBeUndefined();
    });

    it("sets fullscreen from truthy and falsey payloads", () => {
        expect.assertions(3);

        const { setFullScreen, validateWindow } = registerDefaultHandler();

        getListener()({}, 1);
        getListener()({}, 0);

        expect(validateWindow).toHaveBeenCalledTimes(2);
        expect(setFullScreen).toHaveBeenNthCalledWith(1, true);
        expect(setFullScreen).toHaveBeenNthCalledWith(2, false);
    });

    it("skips fullscreen updates when there is no focused window", () => {
        expect.assertions(2);

        const { setFullScreen, validateWindow } = registerDefaultHandler({
            resolveFocusedMainWindow: () => undefined,
        });

        getListener()({}, true);

        expect(validateWindow).not.toHaveBeenCalled();
        expect(setFullScreen).not.toHaveBeenCalled();
    });

    it("validates the focused window before changing fullscreen state", () => {
        expect.assertions(2);

        const { setFullScreen, validateWindow } = registerDefaultHandler({
            validateWindow: vi.fn<() => boolean>(() => false),
        });

        getListener()({}, true);

        expect(validateWindow).toHaveBeenCalledWith(
            expect.objectContaining({ setFullScreen }),
            "set-fullscreen event"
        );
        expect(setFullScreen).not.toHaveBeenCalled();
    });
});
