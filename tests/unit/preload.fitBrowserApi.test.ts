import { describe, expect, it, vi } from "vitest";

import type { FitBrowserInvokeChannel } from "../../electron-app/shared/ipc";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi";
import { createFitBrowserApi } from "../../electron-app/preload/fitBrowserApi.js";

function createApi() {
    const invokeCalls: Array<{
        args: unknown[];
        channel: FitBrowserInvokeChannel;
        methodName: string;
    }> = [];
    const eventHandlers: Array<{
        channel: string;
        methodName: string;
        transform?: (...args: unknown[]) => boolean;
    }> = [];
    const createSafeInvokeHandler = vi.fn(
        (channel: FitBrowserInvokeChannel, methodName: string) =>
            async (...args: unknown[]) => {
                invokeCalls.push({ args, channel, methodName });
                return `${methodName}:result`;
            }
    );
    const createSafeEventHandler = vi.fn(
        (
            channel: string,
            methodName: string,
            transform?: (...args: unknown[]) => boolean
        ) =>
            (_callback: (...args: unknown[]) => unknown) => {
                eventHandlers.push({ channel, methodName, transform });
                return () => undefined;
            }
    );

    return {
        api: createFitBrowserApi({
            channels: {
                FIT_BROWSER_ENABLED_CHANGED: "fit-browser-enabled-changed",
                FIT_BROWSER_GET_FOLDER: "browser:getFolder",
                FIT_BROWSER_IS_ENABLED: "browser:isEnabled",
                FIT_BROWSER_LIST_FOLDER: "browser:listFolder",
                FIT_BROWSER_SET_ENABLED: "browser:setEnabled",
                FIT_BROWSER_SET_FOLDER: "browser:setFolder",
            },
            createSafeEventHandler,
            createSafeInvokeHandler,
        }),
        createSafeEventHandler,
        createSafeInvokeHandler,
        eventHandlers,
        invokeCalls,
    };
}

describe("preload FIT browser API", () => {
    it("routes Browser tab invoke methods through the expected IPC channels", async () => {
        expect.assertions(4);

        const { api, createSafeInvokeHandler, invokeCalls } = createApi();

        await expect(api.getFitBrowserFolder()).resolves.toBe(
            "getFitBrowserFolder:result"
        );
        await expect(api.isFitBrowserEnabled()).resolves.toBe(
            "isFitBrowserEnabled:result"
        );
        await api.listFitBrowserFolder();
        await api.listFitBrowserFolder("2026");
        await api.setFitBrowserEnabled(true);
        await api.setFitBrowserFolder("C:/rides");

        expect(createSafeInvokeHandler.mock.calls).toStrictEqual([
            ["browser:listFolder", "listFitBrowserFolder"],
            ["browser:getFolder", "getFitBrowserFolder"],
            ["browser:isEnabled", "isFitBrowserEnabled"],
            ["browser:setEnabled", "setFitBrowserEnabled"],
            ["browser:setFolder", "setFitBrowserFolder"],
        ]);
        expect(invokeCalls).toStrictEqual([
            {
                args: [],
                channel: "browser:getFolder",
                methodName: "getFitBrowserFolder",
            },
            {
                args: [],
                channel: "browser:isEnabled",
                methodName: "isFitBrowserEnabled",
            },
            {
                args: [""],
                channel: "browser:listFolder",
                methodName: "listFitBrowserFolder",
            },
            {
                args: ["2026"],
                channel: "browser:listFolder",
                methodName: "listFitBrowserFolder",
            },
            {
                args: [true],
                channel: "browser:setEnabled",
                methodName: "setFitBrowserEnabled",
            },
            {
                args: ["C:/rides"],
                channel: "browser:setFolder",
                methodName: "setFitBrowserFolder",
            },
        ]);
    });

    it("coerces Browser enabled events to a strict boolean", () => {
        expect.assertions(3);

        const { api, eventHandlers } = createApi();

        api.onFitBrowserEnabledChanged(vi.fn());

        expect(eventHandlers).toHaveLength(1);
        expect(eventHandlers[0]).toMatchObject({
            channel: "fit-browser-enabled-changed",
            methodName: "onFitBrowserEnabledChanged",
        });
        expect({
            falseValue: eventHandlers[0]?.transform?.(false),
            truthyString: eventHandlers[0]?.transform?.("true"),
            trueValue: eventHandlers[0]?.transform?.(true),
        }).toStrictEqual({
            falseValue: false,
            truthyString: false,
            trueValue: true,
        });
    });

    it("rejects malformed Browser folder and enabled arguments before IPC", async () => {
        expect.assertions(5);

        const { api, invokeCalls } = createApi();

        await expect(
            api.listFitBrowserFolder(42 as unknown as string)
        ).rejects.toThrow("listFitBrowserFolder: relPath must be a string");
        await expect(
            api.setFitBrowserEnabled("true" as unknown as boolean)
        ).rejects.toThrow("setFitBrowserEnabled: enabled must be a boolean");
        await expect(api.setFitBrowserFolder("")).rejects.toThrow(
            "setFitBrowserFolder: folder must be a non-empty string"
        );
        await expect(api.setFitBrowserFolder("   ")).rejects.toThrow(
            "setFitBrowserFolder: folder must be a non-empty string"
        );
        expect(invokeCalls).toStrictEqual([]);
    });
});
