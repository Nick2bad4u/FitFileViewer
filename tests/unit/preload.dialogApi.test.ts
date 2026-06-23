import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import { createPreloadDialogApiDomain } from "../../electron-app/preload/dialogApiDomain.js";
import { createElectronApiDialogDomain } from "../../electron-app/preload/electronApiDialogDomain.js";

describe("preload dialog API", () => {
    it("routes native dialogs through the dialog preload domain", async () => {
        expect.assertions(3);

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
        const dialogApi = createPreloadDialogApiDomain({
            constants: {
                CHANNELS: {
                    DIALOG_OPEN_FILE: "dialog:openFile",
                    DIALOG_OPEN_FOLDER: "dialog:openFolder",
                    DIALOG_OPEN_OVERLAY_FILES: "dialog:openOverlayFiles",
                },
            },
            createSafeInvokeHandler,
        });

        await dialogApi.openFile();
        await dialogApi.openFileDialog();
        await dialogApi.openFolderDialog();
        await dialogApi.openOverlayDialog();

        expect(dialogApi.openFileDialog).toBe(dialogApi.openFile);
        expect(createSafeInvokeHandler.mock.calls).toEqual([
            ["dialog:openFile", "openFile"],
            ["dialog:openFolder", "openFolderDialog"],
            ["dialog:openOverlayFiles", "openOverlayDialog"],
        ]);
        expect(invokeCalls).toStrictEqual([
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
                channel: "dialog:openFolder",
                methodName: "openFolderDialog",
            },
            {
                args: [],
                channel: "dialog:openOverlayFiles",
                methodName: "openOverlayDialog",
            },
        ]);
    });

    it("maps native dialogs through the final electron dialog domain", () => {
        expect.assertions(1);

        const openFile = vi.fn();
        const openFolderDialog = vi.fn();
        const openOverlayDialog = vi.fn();

        expect(
            createElectronApiDialogDomain({
                openFile,
                openFileDialog: openFile,
                openFolderDialog,
                openOverlayDialog,
            })
        ).toStrictEqual({
            openFile,
            openFileDialog: openFile,
            openFolderDialog,
            openOverlayDialog,
        });
    });
});
