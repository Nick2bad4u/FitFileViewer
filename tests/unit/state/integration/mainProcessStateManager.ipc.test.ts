// @vitest-environment node
import { createRequire } from "node:module";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type IpcHandler = (event: unknown, ...args: unknown[]) => unknown;
type ElectronAccessModule = {
    setElectronOverride?: (override: unknown) => void;
};
type MainProcessStateManagerModule = {
    mainProcessState: {
        set: (
            path: string,
            value: unknown,
            options?: Record<string, unknown>
        ) => void;
    };
};

const requireCjs = createRequire(import.meta.url);

function clearMainProcessStateRequireCache(): void {
    for (const modulePath of [
        "../../../../electron-app/main/runtime/electronAccess",
        "../../../../electron-app/main/ipc/ipcRegistry",
        "../../../../electron-app/utils/state/integration/mainProcessStateManager",
    ]) {
        delete requireCjs.cache[requireCjs.resolve(modulePath)];
    }
}

function getRequiredHandler(
    handlers: Map<string, IpcHandler>,
    channel: string
): IpcHandler {
    const handler = handlers.get(channel);
    if (typeof handler !== "function") {
        throw new TypeError(`Missing IPC handler for ${channel}`);
    }

    return handler;
}

function loadMainProcessStateWithIpc(): {
    handlers: Map<string, IpcHandler>;
    mainProcessState: MainProcessStateManagerModule["mainProcessState"];
} {
    const handlers = new Map<string, IpcHandler>();
    const ipcMain = {
        handle: vi.fn((channel: string, handler: IpcHandler) => {
            handlers.set(channel, handler);
        }),
        removeHandler: vi.fn(),
    };
    const electronAccess = requireCjs(
        "../../../../electron-app/main/runtime/electronAccess"
    ) as ElectronAccessModule;

    electronAccess.setElectronOverride?.({ ipcMain });

    const { mainProcessState } = requireCjs(
        "../../../../electron-app/utils/state/integration/mainProcessStateManager"
    ) as MainProcessStateManagerModule;

    return { handlers, mainProcessState };
}

describe("mainProcessStateManager IPC state reads", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = "test";
        clearMainProcessStateRequireCache();
    });

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        try {
            const electronAccess = requireCjs(
                "../../../../electron-app/main/runtime/electronAccess"
            ) as ElectronAccessModule;
            electronAccess.setElectronOverride?.(null);
        } catch {
            /* ignore */
        }
        clearMainProcessStateRequireCache();
        vi.restoreAllMocks();
    });

    it("requires explicit renderer-readable state paths", () => {
        expect.assertions(7);

        const { handlers, mainProcessState } = loadMainProcessStateWithIpc();
        const getMainState = getRequiredHandler(handlers, "main-state:get");
        const listenToMainState = getRequiredHandler(
            handlers,
            "main-state:listen"
        );
        const unlistenFromMainState = getRequiredHandler(
            handlers,
            "main-state:unlisten"
        );

        mainProcessState.set("loadedFitFilePath", "C:/activities/ride.fit", {
            source: "test",
        });
        mainProcessState.set("gyazoServerPort", 4321, { source: "test" });
        const event = {
            sender: {
                isDestroyed: () => false,
                send: vi.fn(),
            },
        };

        expect(getMainState(event, undefined)).toBeUndefined();
        expect(getMainState(event, "")).toBeUndefined();
        expect(getMainState(event, "gyazoServerPort")).toBeUndefined();
        expect(getMainState(event, "loadedFitFilePath")).toBe(
            "C:/activities/ride.fit"
        );
        expect(listenToMainState(event, "*")).toBe(false);
        expect(listenToMainState(event, "gyazoServerPort")).toBe(false);
        expect(unlistenFromMainState(event, "*")).toBe(false);
    });
});
