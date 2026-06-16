import { beforeEach, describe, expect, it, vi } from "vitest";

const initializerMocks = vi.hoisted(() => {
    const startupCalls: string[] = [];

    return {
        initFilenameAutoScroll: vi.fn<() => void>(() => {
            startupCalls.push("filenameAutoScroll");
        }),
        initFitBrowserFeatureGate: vi.fn<() => void>(() => {
            startupCalls.push("fitBrowserFeatureGate");
        }),
        initQuickColorSwitcher: vi.fn<() => void>(() => {
            startupCalls.push("quickColorSwitcher");
        }),
        initUnifiedControlBar: vi.fn<() => void>(() => {
            startupCalls.push("unifiedControlBar");
        }),
        startupCalls,
    };
});

vi.mock(
    import("../../../../electron-app/utils/ui/browser/initFitBrowserFeatureGate.js"),
    () => ({
        initFitBrowserFeatureGate: initializerMocks.initFitBrowserFeatureGate,
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/quickColorSwitcher.js"),
    () => ({
        initQuickColorSwitcher: initializerMocks.initQuickColorSwitcher,
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/unifiedControlBar.js"),
    () => ({
        initFilenameAutoScroll: initializerMocks.initFilenameAutoScroll,
        initUnifiedControlBar: initializerMocks.initUnifiedControlBar,
    })
);

const { registerStartupInitializers, runStartupInitializers } =
    await import("../../../../electron-app/utils/ui/initStartup.js");

describe("initStartup", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        initializerMocks.startupCalls.length = 0;
    });

    it("runs startup initializers on DOMContentLoaded", () => {
        expect.assertions(6);

        runStartupInitializers();

        expect(initializerMocks.startupCalls).toEqual([
            "quickColorSwitcher",
            "unifiedControlBar",
            "filenameAutoScroll",
            "fitBrowserFeatureGate",
        ]);
        expect(initializerMocks.startupCalls).not.toContain(
            "unknownInitializer"
        );
        expect(initializerMocks.initQuickColorSwitcher).toHaveBeenCalledOnce();
        expect(initializerMocks.initUnifiedControlBar).toHaveBeenCalledOnce();
        expect(initializerMocks.initFilenameAutoScroll).toHaveBeenCalledOnce();
        expect(
            initializerMocks.initFitBrowserFeatureGate
        ).toHaveBeenCalledOnce();
    });

    it("registers startup initializers through an injected document target", () => {
        expect.assertions(3);

        const documentTarget = new EventTarget();
        const cleanup = registerStartupInitializers({
            getDocumentTarget: () => documentTarget,
        });

        documentTarget.dispatchEvent(new Event("DOMContentLoaded"));
        cleanup?.();
        documentTarget.dispatchEvent(new Event("DOMContentLoaded"));

        expect(typeof cleanup).toBe("function");
        expect(initializerMocks.startupCalls).toEqual([
            "quickColorSwitcher",
            "unifiedControlBar",
            "filenameAutoScroll",
            "fitBrowserFeatureGate",
        ]);
        expect(
            initializerMocks.initFitBrowserFeatureGate
        ).toHaveBeenCalledOnce();
    });

    it("skips registration when no document target is available", () => {
        expect.assertions(2);

        const cleanup = registerStartupInitializers({
            getDocumentTarget: () => undefined,
        });

        expect(cleanup).toBeUndefined();
        expect(initializerMocks.startupCalls).toEqual([]);
    });
});
