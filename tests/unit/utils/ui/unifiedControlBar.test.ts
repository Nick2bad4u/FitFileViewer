import { describe, expect, it, vi } from "vitest";
import {
    initFilenameAutoScroll,
    initUnifiedControlBar,
} from "../../../../electron-app/utils/ui/unifiedControlBar.js";

type ObservedMutation = {
    options: MutationObserverInit;
    target: Node;
};

function setElementWidth(
    element: HTMLElement,
    property: "offsetWidth" | "scrollWidth",
    value: number
): void {
    Object.defineProperty(element, property, {
        configurable: true,
        value,
    });
}

function cleanupDomAndMocks(): void {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
    document.head.replaceChildren();
    vi.useRealTimers();
}

function getFilenameScrollState(
    filenameElement: HTMLElement & {
        __ffvFilenameAutoScrollState?: { timers?: unknown[] };
    },
    filenameText: HTMLElement
) {
    return {
        classList: [...filenameElement.classList],
        scrollDistance:
            filenameText.style.getPropertyValue("--scroll-distance"),
        timerCount:
            filenameElement.__ffvFilenameAutoScrollState?.timers?.length,
    };
}

describe(initUnifiedControlBar, () => {
    it("moves existing controls into one toolbar once the startup delay elapses", () => {
        expect.assertions(7);

        vi.useFakeTimers();

        const originalColorParent = document.createElement("section");
        const originalFullscreenParent = document.createElement("section");
        const colorSwitcher = document.createElement("div");
        const fullscreenWrapper = document.createElement("div");
        colorSwitcher.id = "quick-color-switcher";
        fullscreenWrapper.id = "global-fullscreen-btn-wrapper";
        originalColorParent.append(colorSwitcher);
        originalFullscreenParent.append(fullscreenWrapper);
        document.body.append(originalColorParent, originalFullscreenParent);

        try {
            initUnifiedControlBar();
            vi.advanceTimersByTime(199);

            expect(document.querySelector(".app-control-bar")).toBeNull();

            vi.advanceTimersByTime(1);

            const toolbar =
                document.querySelector<HTMLElement>(".app-control-bar");

            expect(toolbar).toBeInstanceOf(HTMLElement);
            expect(toolbar?.getAttribute("role")).toBe("toolbar");
            expect(toolbar?.getAttribute("aria-label")).toBe(
                "Application controls"
            );
            expect(toolbar?.children[0]).toBe(colorSwitcher);
            expect(toolbar?.children[1]).toBe(fullscreenWrapper);

            initUnifiedControlBar();

            expect({
                originalColorParentChildren:
                    originalColorParent.children.length,
                toolbarCount:
                    document.querySelectorAll(".app-control-bar").length,
            }).toEqual({
                originalColorParentChildren: 0,
                toolbarCount: 1,
            });
        } finally {
            cleanupDomAndMocks();
        }
    });

    it("retries until delayed controls are available", () => {
        expect.assertions(3);

        vi.useFakeTimers();

        try {
            initUnifiedControlBar();
            vi.advanceTimersByTime(200);

            const colorSwitcher = document.createElement("div");
            const fullscreenWrapper = document.createElement("div");
            colorSwitcher.className = "quick-color-switcher";
            fullscreenWrapper.className = "fullscreen-btn-wrapper";
            document.body.append(colorSwitcher, fullscreenWrapper);

            vi.advanceTimersByTime(100);

            const toolbar =
                document.querySelector<HTMLElement>(".app-control-bar");

            expect(toolbar).toBeInstanceOf(HTMLElement);
            expect(toolbar?.children[0]).toBe(colorSwitcher);
            expect(toolbar?.children[1]).toBe(fullscreenWrapper);
        } finally {
            cleanupDomAndMocks();
        }
    });
});

describe(initFilenameAutoScroll, () => {
    it("enables filename scrolling and records observer cleanup state", () => {
        expect.assertions(4);

        vi.useFakeTimers();

        const observed: ObservedMutation[] = [];
        const disconnect = vi.fn<() => void>();
        const mutationObserverConstructor =
            vi.fn<(callback: MutationCallback) => void>();

        class MutationObserverMock implements MutationObserver {
            constructor(callback: MutationCallback) {
                mutationObserverConstructor(callback);
            }

            disconnect(): void {
                disconnect();
            }

            observe(target: Node, options: MutationObserverInit): void {
                observed.push({ options, target });
            }

            takeRecords(): MutationRecord[] {
                return [];
            }
        }

        vi.stubGlobal("MutationObserver", MutationObserverMock);

        const container = document.createElement("div");
        const filenameElement = document.createElement("div") as HTMLElement & {
            __ffvFilenameAutoScrollState?: unknown;
        };
        const label = document.createElement("span");
        const filenameText = document.createElement("span");
        filenameElement.id = "active_file_name";
        label.className = "active-label";
        filenameText.className = "filename-text";
        filenameElement.append(label, filenameText);
        container.append(filenameElement);
        document.body.append(container);
        setElementWidth(container, "offsetWidth", 180);
        setElementWidth(label, "offsetWidth", 20);
        setElementWidth(filenameText, "scrollWidth", 300);

        try {
            initFilenameAutoScroll();
            vi.advanceTimersByTime(200);

            expect(mutationObserverConstructor).toHaveBeenCalledOnce();
            expect(observed).toStrictEqual([
                {
                    options: {
                        characterData: true,
                        childList: true,
                        subtree: true,
                    },
                    target: filenameElement,
                },
            ]);
            expect(
                getFilenameScrollState(filenameElement, filenameText)
            ).toStrictEqual({
                classList: ["scrolling"],
                scrollDistance: "218px",
                timerCount: 2,
            });

            initFilenameAutoScroll();

            expect(disconnect).toHaveBeenCalledOnce();
        } finally {
            cleanupDomAndMocks();
        }
    });

    it("removes the scrolling class when the filename fits its container", () => {
        expect.assertions(3);

        vi.useFakeTimers();

        const mutationObserverConstructor =
            vi.fn<(callback: MutationCallback) => void>();
        const disconnect = vi.fn<() => void>();
        const observe = vi.fn<() => void>();

        class MutationObserverMock implements MutationObserver {
            constructor(callback: MutationCallback) {
                mutationObserverConstructor(callback);
            }

            disconnect(): void {
                disconnect();
            }

            observe(): void {
                observe();
            }

            takeRecords(): MutationRecord[] {
                return [];
            }
        }

        vi.stubGlobal("MutationObserver", MutationObserverMock);

        const container = document.createElement("div");
        const filenameElement = document.createElement("div");
        const filenameText = document.createElement("span");
        filenameElement.id = "active_file_name";
        filenameElement.className = "scrolling";
        filenameText.className = "filename-text";
        filenameElement.append(filenameText);
        container.append(filenameElement);
        document.body.append(container);
        setElementWidth(container, "offsetWidth", 500);
        setElementWidth(filenameText, "scrollWidth", 100);

        try {
            initFilenameAutoScroll();
            vi.advanceTimersByTime(500);

            expect(mutationObserverConstructor).toHaveBeenCalledOnce();
            expect(
                getFilenameScrollState(filenameElement, filenameText)
            ).toStrictEqual({
                classList: [],
                scrollDistance: "",
                timerCount: 2,
            });
            expect(filenameElement.classList.contains("scrolling")).not.toBe(
                true
            );
        } finally {
            cleanupDomAndMocks();
        }
    });
});
