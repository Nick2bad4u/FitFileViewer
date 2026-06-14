// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type IpcHandler = (event: unknown, ...args: unknown[]) => unknown;
type MainProcessStateManagerModule = {
    mainProcessState: {
        set: (
            path: string,
            value: unknown,
            options?: Record<string, unknown>
        ) => void;
    };
};

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

async function loadMainProcessStateWithIpc(): Promise<{
    handlers: Map<string, IpcHandler>;
    mainProcessState: MainProcessStateManagerModule["mainProcessState"];
}> {
    const handlers = new Map<string, IpcHandler>();
    const ipcMain = {
        handle: vi.fn((channel: string, handler: IpcHandler) => {
            handlers.set(channel, handler);
        }),
        removeHandler: vi.fn(),
    };
    const { setElectronOverride } =
        await import("../../../../electron-app/main/runtime/electronAccess.js");

    setElectronOverride({ ipcMain });

    const { mainProcessState } =
        (await import("../../../../electron-app/utils/state/integration/mainProcessStateManager.js")) as unknown as MainProcessStateManagerModule;

    return { handlers, mainProcessState };
}

describe("mainProcessStateManager IPC state reads", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = "test";
    });

    afterEach(async () => {
        process.env.NODE_ENV = originalNodeEnv;
        const { setElectronOverride } =
            await import("../../../../electron-app/main/runtime/electronAccess.js");
        setElectronOverride(null);
        vi.restoreAllMocks();
    });

    it("requires explicit renderer-readable state paths", async () => {
        expect.assertions(7);

        const { handlers, mainProcessState } =
            await loadMainProcessStateWithIpc();
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
