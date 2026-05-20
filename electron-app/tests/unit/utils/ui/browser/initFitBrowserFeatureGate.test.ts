import { describe, expect, it, vi } from "vitest";

import {
    __resetStateManagerForTests,
    getState,
    setState,
} from "../../../../../utils/state/core/stateManager.js";
import { initFitBrowserFeatureGate } from "../../../../../utils/ui/browser/initFitBrowserFeatureGate.js";

type FitBrowserFeatureGateListener = (
    eventOrEnabled: unknown,
    enabledMaybe?: unknown
) => void;

type TestElectronApi = {
    isFitBrowserEnabled: ReturnType<typeof vi.fn<() => Promise<boolean>>>;
    onIpc?: ReturnType<
        typeof vi.fn<
            (
                channel: "fit-browser-enabled-changed",
                callback: FitBrowserFeatureGateListener
            ) => void
        >
    >;
};

type MutableGlobal = typeof globalThis & {
    electronAPI?: unknown;
};

const waitForFeatureGateLoad = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
};

async function runWithBrowserTabFixture(
    callback: (fixture: {
        readonly button: HTMLElement;
        readonly content: HTMLElement;
    }) => Promise<void> | void
): Promise<void> {
    try {
        __resetStateManagerForTests();
        const fixture = getBrowserTabElements();

        await callback(fixture);
    } finally {
        Reflect.deleteProperty(globalThis as MutableGlobal, "electronAPI");
        document.body.replaceChildren();
        vi.restoreAllMocks();
    }
}

function installElectronApi(api: TestElectronApi | undefined): void {
    if (api === undefined) {
        Reflect.deleteProperty(globalThis, "electronAPI");
        return;
    }

    Object.defineProperty(globalThis, "electronAPI", {
        configurable: true,
        value: api,
        writable: true,
    });
}

function getBrowserTabElements(): {
    readonly button: HTMLElement;
    readonly content: HTMLElement;
} {
    document.body.replaceChildren();

    const button = document.createElement("button");
    button.id = "tab_browser";
    button.type = "button";
    button.textContent = "Browser";

    const content = document.createElement("section");
    content.id = "content_browser";

    document.body.append(button, content);

    return { button, content };
}

describe(initFitBrowserFeatureGate, () => {
    it("does nothing when the preload API is unavailable", async () => {
        expect.assertions(2);

        await runWithBrowserTabFixture(({ button, content }) => {
            installElectronApi(undefined);

            initFitBrowserFeatureGate();

            expect(button.style.display).toBe("");
            expect(content.style.display).toBe("");
        });
    });

    it("hides the browser tab and switches active browser state away when disabled", async () => {
        expect.assertions(4);

        await runWithBrowserTabFixture(async ({ button, content }) => {
            const api: TestElectronApi = {
                isFitBrowserEnabled: vi
                    .fn<() => Promise<boolean>>()
                    .mockResolvedValue(false),
            };
            installElectronApi(api);
            setState("ui.activeTab", "browser", { source: "test" });

            initFitBrowserFeatureGate();
            await waitForFeatureGateLoad();

            expect(api.isFitBrowserEnabled).toHaveBeenCalledOnce();
            expect(button.style.display).toBe("none");
            expect(content.style.display).toBe("none");
            expect(getState("ui.activeTab")).toBe("map");
        });
    });

    it("shows the browser tab when enabled by the main-process setting", async () => {
        expect.assertions(3);

        await runWithBrowserTabFixture(async ({ button, content }) => {
            button.style.display = "none";
            content.style.display = "none";
            installElectronApi({
                isFitBrowserEnabled: vi
                    .fn<() => Promise<boolean>>()
                    .mockResolvedValue(true),
            });

            initFitBrowserFeatureGate();
            await waitForFeatureGateLoad();

            expect(button.style.display).toBe("");
            expect(content.style.display).toBe("");
            expect(getState("ui.activeTab")).not.toBe("map");
        });
    });

    it("fails closed when the main-process setting cannot be read", async () => {
        expect.assertions(2);

        await runWithBrowserTabFixture(async ({ button, content }) => {
            installElectronApi({
                isFitBrowserEnabled: vi
                    .fn<() => Promise<boolean>>()
                    .mockRejectedValue(new Error("ipc unavailable")),
            });

            initFitBrowserFeatureGate();
            await waitForFeatureGateLoad();

            expect(button.style.display).toBe("none");
            expect(content.style.display).toBe("none");
        });
    });

    it("reacts to menu toggle IPC events", async () => {
        expect.assertions(4);

        await runWithBrowserTabFixture(async ({ button, content }) => {
            let listener: FitBrowserFeatureGateListener | undefined;
            const onIpc: TestElectronApi["onIpc"] = vi.fn<
                (
                    channel: "fit-browser-enabled-changed",
                    callback: FitBrowserFeatureGateListener
                ) => void
            >((channel, callback) => {
                listener = callback;
            });
            installElectronApi({
                isFitBrowserEnabled: vi
                    .fn<() => Promise<boolean>>()
                    .mockResolvedValue(true),
                onIpc,
            });

            initFitBrowserFeatureGate();
            await waitForFeatureGateLoad();

            expect(onIpc).toHaveBeenCalledWith(
                "fit-browser-enabled-changed",
                expect.any(Function)
            );
            expect(button.style.display).toBe("");

            listener?.({}, false);

            expect(content.style.display).toBe("none");

            listener?.(true);

            expect(content.style.display).toBe("");
        });
    });
});
