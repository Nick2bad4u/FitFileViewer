import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi";
import { createFileApi } from "../../electron-app/preload/fileApi.js";

function createApi() {
    const invokeCalls: Array<{
        args: unknown[];
        channel: GenericInvokeChannel;
        methodName: string;
    }> = [];
    const createSafeInvokeHandler = vi.fn(
        (channel: GenericInvokeChannel, methodName: string) =>
            async (...args: unknown[]) => {
                invokeCalls.push({ args, channel, methodName });
                return `${methodName}:result`;
            }
    );

    return {
        api: createFileApi({
            channels: {
                DIALOG_OPEN_FILE: "dialog:openFile",
                DIALOG_OPEN_OVERLAY_FILES: "dialog:openOverlayFiles",
                FILE_READ: "file:read",
                FIT_DECODE: "fit:decode",
                FIT_PARSE: "fit:parse",
                RECENT_FILES_ADD: "recentFiles:add",
                RECENT_FILES_APPROVE: "recentFiles:approve",
                RECENT_FILES_GET: "recentFiles:get",
            },
            createSafeInvokeHandler,
        }),
        createSafeInvokeHandler,
        invokeCalls,
    };
}

describe("preload file API", () => {
    it("routes file, FIT parser, and recent-file methods through expected IPC channels", async () => {
        expect.assertions(2);

        const { api, invokeCalls } = createApi();
        const fitBuffer = new ArrayBuffer(8);

        await api.addRecentFile("C:/rides/a.fit");
        await api.approveRecentFile("C:/rides/a.fit");
        await api.decodeFitFile(fitBuffer);
        await api.openFile();
        await api.openFileDialog();
        await api.openOverlayDialog();
        await api.parseFitFile(fitBuffer);
        await api.readFile("C:/rides/a.fit");
        await api.recentFiles();

        expect(api.openFileDialog).toBe(api.openFile);
        expect(invokeCalls).toStrictEqual([
            {
                args: ["C:/rides/a.fit"],
                channel: "recentFiles:add",
                methodName: "addRecentFile",
            },
            {
                args: ["C:/rides/a.fit"],
                channel: "recentFiles:approve",
                methodName: "approveRecentFile",
            },
            {
                args: [fitBuffer],
                channel: "fit:decode",
                methodName: "decodeFitFile",
            },
            {
                args: [],
                channel: "dialog:openFile",
                methodName: "openFile",
            },
            {
                args: [],
                channel: "dialog:openFile",
                methodName: "openFile",
            },
            {
                args: [],
                channel: "dialog:openOverlayFiles",
                methodName: "openOverlayDialog",
            },
            {
                args: [fitBuffer],
                channel: "fit:parse",
                methodName: "parseFitFile",
            },
            {
                args: ["C:/rides/a.fit"],
                channel: "file:read",
                methodName: "readFile",
            },
            {
                args: [],
                channel: "recentFiles:get",
                methodName: "recentFiles",
            },
        ]);
    });

    it("creates one native open-file handler for both open file aliases", () => {
        expect.assertions(1);

        const { createSafeInvokeHandler } = createApi();

        expect(createSafeInvokeHandler.mock.calls).toEqual(
            expect.arrayContaining([["dialog:openFile", "openFile"]])
        );
    });
});
