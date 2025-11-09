import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupCreditsMarquee, teardownCreditsMarquee } from "../../../../utils/ui/layout/enhanceCreditsSection.js";

describe("enhanceCreditsSection", () => {
    const originalResizeObserver = global.ResizeObserver;
    const originalRequestAnimationFrame = global.requestAnimationFrame;
    const originalCancelAnimationFrame = global.cancelAnimationFrame;

    beforeEach(() => {
        document.body.innerHTML = "";
        vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
            cb(performance.now());
            return 1;
        });
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
        vi.stubGlobal(
            "ResizeObserver",
            vi.fn().mockImplementation(function ResizeObserverMock(callback: ResizeObserverCallback) {
                return {
                    disconnect: vi.fn(),
                    observe: () => callback([], {} as ResizeObserver),
                } as ResizeObserver;
            })
        );
    });

    afterEach(() => {
        teardownCreditsMarquee();
        document.body.innerHTML = "";
        if (originalResizeObserver) {
            vi.stubGlobal("ResizeObserver", originalResizeObserver);
        } else {
            Reflect.deleteProperty(globalThis as Record<string, unknown>, "ResizeObserver");
        }
        if (originalRequestAnimationFrame) {
            vi.stubGlobal("requestAnimationFrame", originalRequestAnimationFrame);
        } else {
            Reflect.deleteProperty(globalThis as Record<string, unknown>, "requestAnimationFrame");
        }
        if (originalCancelAnimationFrame) {
            vi.stubGlobal("cancelAnimationFrame", originalCancelAnimationFrame);
        } else {
            Reflect.deleteProperty(globalThis as Record<string, unknown>, "cancelAnimationFrame");
        }
        vi.restoreAllMocks();
    });

    it("applies marquee class and custom properties when content overflows", () => {
        document.body.innerHTML = `
            <div class="credits-section" style="width: 200px;">
                <footer>Some lengthy credits text that should overflow the container width significantly.</footer>
            </div>
        `;

        const section = document.querySelector(".credits-section") as HTMLElement;
        const footer = section.querySelector("footer") as HTMLElement;

        Object.defineProperty(section, "clientWidth", { configurable: true, value: 180 });
        Object.defineProperty(footer, "scrollWidth", { configurable: true, value: 420 });

        setupCreditsMarquee();

        expect(footer.classList.contains("credits-marquee")).toBe(true);
        expect(section.classList.contains("credits-section--marquee-active")).toBe(true);
        expect(footer.style.getPropertyValue("--credits-scroll-distance")).toBe("272px");
        expect(footer.style.getPropertyValue("--credits-scroll-duration")).not.toBe("");
    });

    it("does not apply marquee styling when content fits the container", () => {
        document.body.innerHTML = `
            <div class="credits-section" style="width: 500px;">
                <footer>Short text</footer>
            </div>
        `;

        const section = document.querySelector(".credits-section") as HTMLElement;
        const footer = section.querySelector("footer") as HTMLElement;

        Object.defineProperty(section, "clientWidth", { configurable: true, value: 400 });
        Object.defineProperty(footer, "scrollWidth", { configurable: true, value: 320 });

        setupCreditsMarquee();

        expect(footer.classList.contains("credits-marquee")).toBe(false);
        expect(section.classList.contains("credits-section--marquee-active")).toBe(false);
        expect(footer.style.getPropertyValue("--credits-scroll-distance")).toBe("");
    });
});
