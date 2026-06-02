// @vitest-environment node

import { createRequire } from "node:module";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

type BrowserHandler = (
    event: unknown,
    ...args: unknown[]
) => Promise<unknown> | unknown;
type BrowserHandlersModule = {
    registerBrowserHandlers: (options: Record<string, unknown>) => void;
};
type ConfStore = {
    data: Map<string, boolean | string>;
    get: (
        key: string,
        fallback?: boolean | string | null
    ) => boolean | string | null;
    set: (key: string, value: boolean | string) => void;
};
type FileAccessPolicyModule = {
    __resetForTests?: () => void;
    isApprovedFilePath: (filePath: unknown) => boolean;
};

const requireCjs = createRequire(import.meta.url);

function createConfStore(): ConfStore {
    const data = new Map<string, boolean | string>();

    return {
        data,
        get: vi.fn((key: string, fallback?: boolean | string | null) =>
            data.has(key)
                ? (data.get(key) as boolean | string)
                : (fallback ?? null)
        ),
        set: vi.fn((key: string, value: boolean | string) => {
            data.set(key, value);
        }),
    };
}

function getHandler(
    handlers: Map<string, BrowserHandler>,
    channel: string
): BrowserHandler {
    const handler = handlers.get(channel);
    if (typeof handler !== "function") {
        throw new TypeError(`Handler not registered for ${channel}`);
    }

    return handler;
}

describe("registerBrowserHandlers", () => {
    beforeEach(() => {
        vi.resetModules();
        const policy = requireCjs(
            "../../../../electron-app/main/security/fileAccessPolicy.js"
        ) as FileAccessPolicyModule;
        policy.__resetForTests?.();
    });

    it("requires native-dialog trust before renderer-provided folders can become browser roots", async () => {
        expect.assertions(9);

        const handlers = new Map<string, BrowserHandler>();
        const conf = createConfStore();
        const ridesFolder = "C:\\rides";
        const rideFile = "C:\\rides\\Morning.fit";
        const registerBrowserHandlers = (
            requireCjs(
                "../../../../electron-app/main/ipc/registerBrowserHandlers.js"
            ) as BrowserHandlersModule
        ).registerBrowserHandlers;
        const policy = requireCjs(
            "../../../../electron-app/main/security/fileAccessPolicy.js"
        ) as FileAccessPolicyModule;

        registerBrowserHandlers({
            CONSTANTS: { SETTINGS_CONFIG_NAME: "fitfileviewer-test" },
            confModule: {
                Conf: function Conf() {
                    return conf;
                },
            },
            dialogRef: () => ({
                showOpenDialog: vi.fn(() =>
                    Promise.resolve({
                        canceled: false,
                        filePaths: [ridesFolder],
                    })
                ),
            }),
            fs: {
                promises: {
                    readdir: vi.fn(() =>
                        Promise.resolve([
                            {
                                isDirectory: () => false,
                                isFile: () => true,
                                name: "Morning.fit",
                            },
                        ])
                    ),
                    stat: vi.fn(() =>
                        Promise.resolve({ isDirectory: () => true })
                    ),
                },
            },
            logWithContext: vi.fn(),
            path: path.win32,
            registerIpcHandle: (channel: string, handler: BrowserHandler) => {
                handlers.set(channel, handler);
            },
        });

        await expect(
            getHandler(handlers, "browser:setFolder")({}, ridesFolder)
        ).resolves.toBe(false);
        expect(conf.data.get("fitBrowser.rootFolder")).toBeUndefined();

        await expect(
            getHandler(handlers, "dialog:openFolder")({})
        ).resolves.toBe(ridesFolder);
        expect(conf.data.get("fitBrowser.rootFolder")).toBe(ridesFolder);
        expect(conf.data.get("fitBrowser.rootFolderMode")).toBe("manual");

        await expect(
            getHandler(handlers, "browser:setFolder")({}, ridesFolder)
        ).resolves.toBe(true);

        await expect(
            getHandler(handlers, "browser:listFolder")({}, "")
        ).resolves.toStrictEqual({
            entries: [
                {
                    fullPath: rideFile,
                    kind: "file",
                    name: "Morning.fit",
                    relPath: "Morning.fit",
                },
            ],
            relPath: "",
            root: ridesFolder,
        });
        expect(policy.isApprovedFilePath(rideFile)).toBe(true);
        expect(policy.isApprovedFilePath("C:\\other\\Hidden.fit")).toBe(false);
    });
});
