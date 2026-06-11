import { describe, expect, it, vi } from "vitest";

import {
    __resetStateManagerForTests,
} from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererActiveTab,
    setRendererActiveTab,
} from "../../../../../electron-app/utils/state/domain/rendererActiveTabState.js";
import {
    registerRendererElectronApiCandidate,
    resetRendererElectronApiCandidate,
} from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";
import { initFitBrowserFeatureGate } from "../../../../../electron-app/utils/ui/browser/initFitBrowserFeatureGate.js";

type FitBrowserFeatureGateListener = (enabled: boolean) => void;

interface TestElectronApi {
    isFitBrowserEnabled: ReturnType<typeof vi.fn<() => Promise<boolean>>>;
    onFitBrowserEnabledChanged?: ReturnType<
        typeof vi.fn<(callback: FitBrowserFeatureGateListener) => void>
    >;
}

const waitForFeatureGateLoad = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
};

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

function installElectronApi(api: TestElectronApi | undefined): void {
    if (api === undefined) {
        resetRendererElectronApiCandidate();
        return;
    }

    registerRendererElectronApiCandidate(api);
}

async function runWithBrowserTabFixture(
    scenario: (fixture: {
        readonly button: HTMLElement;
        readonly content: HTMLElement;
    }) => Promise<void> | void
): Promise<void> {
    try {
        resetRendererElectronApiCandidate();
        __resetStateManagerForTests();
        const fixture = getBrowserTabElements();

        await scenario(fixture);
    } finally {
        resetRendererElectronApiCandidate();
        document.body.replaceChildren();
        vi.restoreAllMocks();
    }
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
            setRendererActiveTab("browser", { source: "test" });

            initFitBrowserFeatureGate();
            await waitForFeatureGateLoad();

            expect(api.isFitBrowserEnabled).toHaveBeenCalledOnce();
            expect(button.style.display).toBe("none");
            expect(content.style.display).toBe("none");
            expect(getRendererActiveTab()).toBe("map");
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
            expect(getRendererActiveTab()).toBe("summary");
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

    it("reacts to Browser enabled-state events", async () => {
        expect.assertions(4);

        await runWithBrowserTabFixture(async ({ button, content }) => {
            let listener: FitBrowserFeatureGateListener | undefined;
            const onFitBrowserEnabledChanged: TestElectronApi["onFitBrowserEnabledChanged"] =
                vi.fn<(callback: FitBrowserFeatureGateListener) => void>(
                    (callback) => {
                        listener = callback;
                    }
                );
            installElectronApi({
                isFitBrowserEnabled: vi
                    .fn<() => Promise<boolean>>()
                    .mockResolvedValue(true),
                onFitBrowserEnabledChanged,
            });

            initFitBrowserFeatureGate();
            await waitForFeatureGateLoad();

            expect(onFitBrowserEnabledChanged).toHaveBeenCalledWith(
                expect.any(Function)
            );
            expect(button.style.display).toBe("");

            listener?.(false);

            expect(content.style.display).toBe("none");

            listener?.(true);

            expect(content.style.display).toBe("");
        });
    });
});
