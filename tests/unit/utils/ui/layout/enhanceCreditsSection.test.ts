import { describe, expect, it, vi } from "vitest";

import {
    setupCreditsMarquee,
    teardownCreditsMarquee,
} from "../../../../../electron-app/utils/ui/layout/enhanceCreditsSection.js";
import {
    getCreditsMarqueeRuntime,
    type CreditsMarqueeRuntime,
} from "../../../../../electron-app/utils/ui/layout/enhanceCreditsSectionRuntime.js";

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

function createTestRuntime(
    options: {
        ResizeObserver?: ResizeObserverConstructor | undefined;
    } = {}
): CreditsMarqueeRuntime {
    const ResizeObserverConstructor =
        "ResizeObserver" in options
            ? options.ResizeObserver
            : (MockResizeObserver as unknown as ResizeObserverConstructor);

    return getCreditsMarqueeRuntime({
        getAbortController: () => AbortController,
        getCancelAnimationFrame: () => undefined,
        getDocument: () => document,
        getEventTarget: () => window,
        getHTMLElement: () => HTMLElement,
        getMutationObserver: () => MutationObserver,
        getRequestAnimationFrame: () => undefined,
        getResizeObserver: () => ResizeObserverConstructor,
    });
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

function getCreditsMarqueeState(footer: HTMLElement, section: HTMLElement) {
    return {
        footerClasses: [...footer.classList],
        scrollDistance: footer.style.getPropertyValue(
            "--credits-scroll-distance"
        ),
        scrollDuration: footer.style.getPropertyValue(
            "--credits-scroll-duration"
        ),
        sectionClasses: [...section.classList],
    };
}

describe(setupCreditsMarquee, () => {
    it("activates marquee styling when footer content overflows", () => {
        expect.assertions(5);

        resetFixture();
        const runtime = createTestRuntime();
        const { footer, section } = createCreditsSection();
        setReadonlyLayoutNumber(section, "clientWidth", 100);
        setReadonlyLayoutNumber(footer, "scrollWidth", 180);

        try {
            setupCreditsMarquee(runtime);

            const [observer] = MockResizeObserver.instances;
            observer?.callback([], observer as unknown as ResizeObserver);

            expect(observer?.observe).toHaveBeenCalledWith(section);
            expect(observer?.observe).toHaveBeenCalledWith(footer);
            expect(getCreditsMarqueeState(footer, section)).toStrictEqual({
                footerClasses: ["credits-marquee"],
                scrollDistance: "112px",
                scrollDuration: "16s",
                sectionClasses: [
                    "credits-section",
                    "credits-section--marquee-active",
                ],
            });

            teardownCreditsMarquee();

            expect(observer?.disconnect).toHaveBeenCalledOnce();
            expect(getCreditsMarqueeState(footer, section)).toStrictEqual({
                footerClasses: [],
                scrollDistance: "",
                scrollDuration: "",
                sectionClasses: ["credits-section"],
            });
        } finally {
            resetFixture();
        }
    });

    it("clears marquee styling when content does not overflow", () => {
        expect.assertions(1);

        resetFixture();
        const runtime = createTestRuntime();
        const { footer, section } = createCreditsSection();
        setReadonlyLayoutNumber(section, "clientWidth", 200);
        setReadonlyLayoutNumber(footer, "scrollWidth", 120);
        footer.classList.add("credits-marquee");
        section.classList.add("credits-section--marquee-active");
        footer.style.setProperty("--credits-scroll-distance", "10px");
        footer.style.setProperty("--credits-scroll-duration", "10s");

        try {
            setupCreditsMarquee(runtime);

            const [observer] = MockResizeObserver.instances;
            observer?.callback([], observer as unknown as ResizeObserver);

            expect(getCreditsMarqueeState(footer, section)).toStrictEqual({
                footerClasses: [],
                scrollDistance: "",
                scrollDuration: "",
                sectionClasses: ["credits-section"],
            });
        } finally {
            resetFixture();
        }
    });

    it("uses resize listener fallback when ResizeObserver is unavailable", () => {
        expect.assertions(3);

        resetFixture();
        const addSpy = vi.spyOn(window, "addEventListener");
        const removeSpy = vi.spyOn(window, "removeEventListener");
        const runtime = createTestRuntime({ ResizeObserver: undefined });
        createCreditsSection();

        try {
            setupCreditsMarquee(runtime);

            const addResizeCall = addSpy.mock.calls.find(
                ([type]) => type === "resize"
            );
            const resizeHandler = addResizeCall?.[1];
            const resizeOptions = addResizeCall?.[2];
            const resizeSignal =
                resizeOptions instanceof Object && "signal" in resizeOptions
                    ? resizeOptions.signal
                    : null;
            expect({
                handlerType: typeof resizeHandler,
                options:
                    resizeOptions instanceof Object
                        ? {
                              passive: resizeOptions.passive,
                              signalIsAbortSignal:
                                  resizeSignal instanceof AbortSignal,
                          }
                        : resizeOptions,
                type: addResizeCall?.[0],
            }).toStrictEqual({
                handlerType: "function",
                options: {
                    passive: true,
                    signalIsAbortSignal: true,
                },
                type: "resize",
            });

            teardownCreditsMarquee();

            expect(removeSpy).toHaveBeenCalledWith("resize", resizeHandler);
            expect(MockResizeObserver.instances).toHaveLength(0);
        } finally {
            resetFixture();
        }
    });

    it("warns and continues when a cleanup callback fails", () => {
        expect.assertions(2);

        resetFixture();
        const runtime = createTestRuntime({ ResizeObserver: undefined });
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const error = new Error("cleanup failed");
        vi.spyOn(window, "removeEventListener").mockImplementation(() => {
            throw error;
        });
        createCreditsSection();

        try {
            setupCreditsMarquee(runtime);
            teardownCreditsMarquee();

            expect(warnSpy).toHaveBeenCalledWith(
                "[creditsMarquee] Failed to clean up observer:",
                error
            );
            expect(document.querySelectorAll(".credits-section")).toHaveLength(
                1
            );
        } finally {
            resetFixture();
        }
    });
});
