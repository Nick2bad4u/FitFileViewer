import { describe, expect, it, vi } from "vitest";

const initializerMocks = vi.hoisted(() => ({
    initFilenameAutoScroll: vi.fn<() => void>(),
    initFitBrowserFeatureGate: vi.fn<() => void>(),
    initQuickColorSwitcher: vi.fn<() => void>(),
    initUnifiedControlBar: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../utils/ui/browser/initFitBrowserFeatureGate.js"),
    () => ({
        initFitBrowserFeatureGate: initializerMocks.initFitBrowserFeatureGate,
    })
);

vi.mock(import("../../../../utils/ui/quickColorSwitcher.js"), () => ({
    initQuickColorSwitcher: initializerMocks.initQuickColorSwitcher,
}));

vi.mock(import("../../../../utils/ui/unifiedControlBar.js"), () => ({
    initFilenameAutoScroll: initializerMocks.initFilenameAutoScroll,
    initUnifiedControlBar: initializerMocks.initUnifiedControlBar,
}));

const { runStartupInitializers } = await import(
    "../../../../utils/ui/initStartup.js"
);

describe("initStartup", () => {
    it("runs startup initializers on DOMContentLoaded", () => {
        expect.assertions(5);

        expect(() => runStartupInitializers()).not.toThrow();

        expect(initializerMocks.initQuickColorSwitcher).toHaveBeenCalledOnce();
        expect(initializerMocks.initUnifiedControlBar).toHaveBeenCalledOnce();
        expect(initializerMocks.initFilenameAutoScroll).toHaveBeenCalledOnce();
        expect(
            initializerMocks.initFitBrowserFeatureGate
        ).toHaveBeenCalledOnce();
    });
});
