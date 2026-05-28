import { describe, expect, it, vi } from "vitest";

import {
    setupCreditsMarquee,
    teardownCreditsMarquee,
} from "../../../../../electron-app/utils/ui/layout/enhanceCreditsSection.js";

type ResizeObserverConstructor = typeof ResizeObserver;

class MockResizeObserver {
    static readonly instances: MockResizeObserver[] = [];

    readonly callback: ResizeObserverCallback;
    readonly disconnect = vi.fn<() => void>();
    readonly observe = vi.fn<(target: Element) => void>();

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        MockResizeObserver.instances.push(this);
    }
}

function resetFixture(): void {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.body.replaceChildren();
    teardownCreditsMarquee();
    MockResizeObserver.instances.length = 0;
}

function createCreditsSection(): {
    footer: HTMLElement;
    section: HTMLElement;
} {
    const section = document.createElement("div");
    section.className = "credits-section";
    const footer = document.createElement("footer");
    footer.textContent = "Fit File Viewer credits";
    section.append(footer);
    document.body.append(section);

    return { footer, section };
}

function setReadonlyLayoutNumber(
    element: HTMLElement,
    property: "clientWidth" | "scrollWidth",
    value: number
): void {
    Object.defineProperty(element, property, {
        configurable: true,
        value,
    });
}

describe(setupCreditsMarquee, () => {
    it("activates marquee styling when footer content overflows", () => {
        expect.assertions(8);

        resetFixture();
        const originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver =
            MockResizeObserver as unknown as ResizeObserverConstructor;
        const { footer, section } = createCreditsSection();
        setReadonlyLayoutNumber(section, "clientWidth", 100);
        setReadonlyLayoutNumber(footer, "scrollWidth", 180);

        try {
            setupCreditsMarquee();

            const [observer] = MockResizeObserver.instances;
            observer?.callback([], observer as unknown as ResizeObserver);

            expect(observer?.observe).toHaveBeenCalledWith(section);
            expect(observer?.observe).toHaveBeenCalledWith(footer);
            expect([...footer.classList]).toContain("credits-marquee");
            expect([...section.classList]).toContain(
                "credits-section--marquee-active"
            );
            expect(
                footer.style.getPropertyValue("--credits-scroll-distance")
            ).toBe("112px");
            expect(
                footer.style.getPropertyValue("--credits-scroll-duration")
            ).toBe("16s");

            teardownCreditsMarquee();

            expect(observer?.disconnect).toHaveBeenCalledOnce();
            expect([...footer.classList]).not.toContain("credits-marquee");
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
            resetFixture();
        }
    });

    it("clears marquee styling when content does not overflow", () => {
        expect.assertions(4);

        resetFixture();
        const originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver =
            MockResizeObserver as unknown as ResizeObserverConstructor;
        const { footer, section } = createCreditsSection();
        setReadonlyLayoutNumber(section, "clientWidth", 200);
        setReadonlyLayoutNumber(footer, "scrollWidth", 120);
        footer.classList.add("credits-marquee");
        section.classList.add("credits-section--marquee-active");
        footer.style.setProperty("--credits-scroll-distance", "10px");
        footer.style.setProperty("--credits-scroll-duration", "10s");

        try {
            setupCreditsMarquee();

            const [observer] = MockResizeObserver.instances;
            observer?.callback([], observer as unknown as ResizeObserver);

            expect([...footer.classList]).not.toContain("credits-marquee");
            expect([...section.classList]).not.toContain(
                "credits-section--marquee-active"
            );
            expect(
                footer.style.getPropertyValue("--credits-scroll-distance")
            ).toBe("");
            expect(
                footer.style.getPropertyValue("--credits-scroll-duration")
            ).toBe("");
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
            resetFixture();
        }
    });

    it("uses resize listener fallback when ResizeObserver is unavailable", () => {
        expect.assertions(3);

        resetFixture();
        const originalResizeObserver = globalThis.ResizeObserver;
        const addSpy = vi.spyOn(window, "addEventListener");
        const removeSpy = vi.spyOn(window, "removeEventListener");
        globalThis.ResizeObserver =
            undefined as unknown as ResizeObserverConstructor;
        createCreditsSection();

        try {
            setupCreditsMarquee();

            expect(addSpy).toHaveBeenCalledWith(
                "resize",
                expect.any(Function),
                expect.objectContaining({ passive: true })
            );

            teardownCreditsMarquee();

            expect(removeSpy).toHaveBeenCalledWith(
                "resize",
                expect.any(Function)
            );
            expect(MockResizeObserver.instances).toHaveLength(0);
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
            resetFixture();
        }
    });

    it("warns and continues when a cleanup callback fails", () => {
        expect.assertions(2);

        resetFixture();
        const originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver =
            undefined as unknown as ResizeObserverConstructor;
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const error = new Error("cleanup failed");
        vi.spyOn(window, "removeEventListener").mockImplementation(() => {
            throw error;
        });
        createCreditsSection();

        try {
            setupCreditsMarquee();
            teardownCreditsMarquee();

            expect(warnSpy).toHaveBeenCalledWith(
                "[creditsMarquee] Failed to clean up observer:",
                error
            );
            expect(document.querySelectorAll(".credits-section")).toHaveLength(
                1
            );
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
            resetFixture();
        }
    });
});
