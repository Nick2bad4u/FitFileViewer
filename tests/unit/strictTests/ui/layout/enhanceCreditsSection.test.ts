import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    setupCreditsMarquee,
    teardownCreditsMarquee,
} from "../../../../../electron-app/utils/ui/layout/enhanceCreditsSection.js";
import {
    getCreditsMarqueeRuntime,
    type CreditsMarqueeRuntime,
} from "../../../../../electron-app/utils/ui/layout/enhanceCreditsSectionRuntime.js";

describe("enhanceCreditsSection", () => {
    let runtime: CreditsMarqueeRuntime;

    function renderCreditsFixture(text: string, width: string) {
        const section = document.createElement("div");
        section.className = "credits-section";
        section.style.width = width;

        const footer = document.createElement("footer");
        footer.textContent = text;
        section.append(footer);
        document.body.replaceChildren(section);

        return { footer, section };
    }

    beforeEach(() => {
        document.body.replaceChildren();
        runtime = getCreditsMarqueeRuntime({
            cancelAnimationFrame: vi.fn(),
            document,
            HTMLElement,
            MutationObserver,
            requestAnimationFrame: (callback: FrameRequestCallback) => {
                callback(performance.now());
                return 1;
            },
            ResizeObserver: vi
                .fn<(callback: ResizeObserverCallback) => ResizeObserver>()
                .mockImplementation(function ResizeObserverMock(callback) {
                    const observer = {
                        disconnect: vi.fn<() => void>(),
                        observe: () => {
                            callback([], observer);
                        },
                        unobserve: vi.fn<() => void>(),
                    } as ResizeObserver;

                    return observer;
                }),
        });
    });

    afterEach(() => {
        teardownCreditsMarquee();
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("applies marquee class and custom properties when content overflows", () => {
        expect.assertions(4);

        const { footer, section } = renderCreditsFixture(
            "Some lengthy credits text that should overflow the container width significantly.",
            "200px"
        );

        Object.defineProperty(section, "clientWidth", {
            configurable: true,
            value: 180,
        });
        Object.defineProperty(footer, "scrollWidth", {
            configurable: true,
            value: 420,
        });

        setupCreditsMarquee(runtime);

        expect(footer.classList.contains("credits-marquee")).toBe(true);
        expect(
            section.classList.contains("credits-section--marquee-active")
        ).toBe(true);
        expect(footer.style.getPropertyValue("--credits-scroll-distance")).toBe(
            "272px"
        );
        expect(
            footer.style.getPropertyValue("--credits-scroll-duration")
        ).not.toBe("");
    });

    it("does not apply marquee styling when content fits the container", () => {
        expect.assertions(3);

        const { footer, section } = renderCreditsFixture("Short text", "500px");

        Object.defineProperty(section, "clientWidth", {
            configurable: true,
            value: 400,
        });
        Object.defineProperty(footer, "scrollWidth", {
            configurable: true,
            value: 320,
        });

        setupCreditsMarquee(runtime);

        expect(footer.classList.contains("credits-marquee")).toBe(false);
        expect(
            section.classList.contains("credits-section--marquee-active")
        ).toBe(false);
        expect(footer.style.getPropertyValue("--credits-scroll-distance")).toBe(
            ""
        );
    });
});
