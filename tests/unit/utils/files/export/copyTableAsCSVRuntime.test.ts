import { afterEach, describe, expect, it, vi } from "vitest";

import { getCopyTableAsCSVRuntime } from "../../../../../electron-app/utils/files/export/copyTableAsCSVRuntime.js";

const originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(
    document,
    "execCommand"
);

function installExecCommand(result: boolean): ReturnType<typeof vi.fn> {
    const execCommand = vi.fn<NonNullable<Document["execCommand"]>>(
        () => result
    );
    Object.defineProperty(document, "execCommand", {
        configurable: true,
        value: execCommand,
    });
    return execCommand;
}

function restoreExecCommand(): void {
    if (originalExecCommandDescriptor) {
        Object.defineProperty(
            document,
            "execCommand",
            originalExecCommandDescriptor
        );
        return;
    }

    Reflect.deleteProperty(document, "execCommand");
}

describe("getCopyTableAsCSVRuntime", () => {
    afterEach(() => {
        document.body.replaceChildren();
        restoreExecCommand();
        vi.restoreAllMocks();
    });

    it("writes text through the injected browser clipboard", async () => {
        expect.assertions(2);

        const writeText = vi.fn<(text: string) => Promise<void>>();
        const view = getCopyTableAsCSVRuntime({
            navigator: { clipboard: { writeText } },
        });

        await expect(view.copyTextUsingBrowserClipboard("a,b")).resolves.toBe(
            true
        );
        expect(writeText).toHaveBeenCalledWith("a,b");
    });

    it("returns false when browser clipboard writing is unavailable or denied", async () => {
        expect.assertions(2);

        await expect(
            getCopyTableAsCSVRuntime({}).copyTextUsingBrowserClipboard("a,b")
        ).resolves.toBe(false);
        await expect(
            getCopyTableAsCSVRuntime({
                navigator: {
                    clipboard: {
                        writeText: () => {
                            throw new Error("denied");
                        },
                    },
                },
            }).copyTextUsingBrowserClipboard("a,b")
        ).resolves.toBe(false);
    });

    it("copies text through the injected legacy document command", () => {
        expect.assertions(4);

        const execCommand = installExecCommand(true);
        const view = getCopyTableAsCSVRuntime({ document });

        view.copyTextUsingLegacyExecCommand("a,b", {
            opacity: "0",
            position: "fixed",
        });

        expect(execCommand).toHaveBeenCalledWith("copy");
        expect(document.querySelector("textarea")).toBeNull();
        expect(document.body.children).toHaveLength(0);
        expect(execCommand).toHaveBeenCalledOnce();
    });

    it("removes the legacy textarea when copy fails", () => {
        expect.assertions(2);

        installExecCommand(false);
        const view = getCopyTableAsCSVRuntime({ document });

        expect(() => view.copyTextUsingLegacyExecCommand("a,b", {})).toThrow(
            "execCommand('copy') returned false"
        );
        expect(document.querySelector("textarea")).toBeNull();
    });
});
