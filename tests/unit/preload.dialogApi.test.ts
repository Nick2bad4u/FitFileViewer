import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import { createPreloadDialogApiDomain } from "../../electron-app/preload/dialogApiDomain.js";
import { createElectronApiDialogDomain } from "../../electron-app/preload/electronApiDialogDomain.js";

describe("preload dialog API", () => {
    it("routes folder selection through the dialog preload domain", async () => {
        expect.assertions(2);

        const invokeCalls: Array<{
            args: unknown[];
            channel: GenericInvokeChannel;
            methodName: string;
        }> = [];
        const createSafeInvokeHandler = vi.fn(
            (channel: GenericInvokeChannel, methodName: string) =>
                async (...args: unknown[]) => {
                    invokeCalls.push({ args, channel, methodName });
                    return "openFolderDialog:result";
                }
        );
        const { openFolderDialog } = createPreloadDialogApiDomain({
            constants: {
                CHANNELS: {
                    DIALOG_OPEN_FOLDER: "dialog:openFolder",
                },
            },
            createSafeInvokeHandler,
        });

        await openFolderDialog();

        expect(createSafeInvokeHandler).toHaveBeenCalledWith(
            "dialog:openFolder",
            "openFolderDialog"
        );
        expect(invokeCalls).toStrictEqual([
            {
                args: [],
                channel: "dialog:openFolder",
                methodName: "openFolderDialog",
            },
        ]);
    });

    it("maps folder selection through the final electron dialog domain", () => {
        expect.assertions(1);

        const openFolderDialog = vi.fn();

        expect(
            createElectronApiDialogDomain({ openFolderDialog }).openFolderDialog
        ).toBe(openFolderDialog);
    });
});
