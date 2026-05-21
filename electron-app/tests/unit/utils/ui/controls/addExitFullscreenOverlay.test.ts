import { describe, expect, it, vi } from "vitest";

import { addExitFullscreenOverlay } from "../../../../../utils/ui/controls/addExitFullscreenOverlay.js";

const EXIT_BUTTON_SELECTOR = ".exit-fullscreen-overlay";

function getExitButton(container: HTMLElement): HTMLButtonElement {
    const button =
        container.querySelector<HTMLButtonElement>(EXIT_BUTTON_SELECTOR);
    if (!button) {
        throw new Error("Missing exit fullscreen overlay button");
    }
    return button;
}

function resetDocument(): void {
    document.body.replaceChildren();
    vi.restoreAllMocks();
}

function setFullscreenElement(element: Element | null): void {
    Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: element,
    });
}

function setExitFullscreen(
    implementation: () => Promise<void>
): ReturnType<typeof vi.fn<() => Promise<void>>> {
    const exitFullscreen = vi.fn<() => Promise<void>>(implementation);
    Object.defineProperty(document, "exitFullscreen", {
        configurable: true,
        value: exitFullscreen,
    });

    return exitFullscreen;
}

describe(addExitFullscreenOverlay, () => {
    it("adds an accessible themed exit button to the container", () => {
        expect.assertions(9);

        resetDocument();
        const container = document.createElement("section");

        try {
            addExitFullscreenOverlay(container);

            const button = getExitButton(container);
            const icon = button.querySelector(".fullscreen-exit-icon");
            const svg = button.querySelector("svg.inline-svg");

            expect(button.type).toBe("button");
            expect(button.title).toBe("Exit Fullscreen");
            expect(button.getAttribute("aria-label")).toBe("Exit Fullscreen");
            expect([...button.classList]).toStrictEqual([
                "exit-fullscreen-overlay",
                "themed-btn",
                "exit-fullscreen-btn",
            ]);
            expect(icon?.getAttribute("aria-hidden")).toBe("true");
            expect(svg?.getAttribute("viewBox")).toBe("0 0 28 28");
            expect(svg?.querySelector("title")?.textContent).toBe(
                "Exit Fullscreen Icon"
            );
            expect(svg?.querySelectorAll("path")).toHaveLength(4);
            expect(container.children).toHaveLength(1);
        } finally {
            resetDocument();
        }
    });

    it("does not add duplicate overlays", () => {
        expect.assertions(2);

        resetDocument();
        const debugSpy = vi
            .spyOn(console, "debug")
            .mockImplementation(() => {});
        const container = document.createElement("section");

        try {
            addExitFullscreenOverlay(container);
            addExitFullscreenOverlay(container);

            expect(
                container.querySelectorAll(EXIT_BUTTON_SELECTOR)
            ).toHaveLength(1);
            expect(debugSpy).toHaveBeenCalledWith(
                "[addExitFullscreenOverlay] Overlay already exists, skipping creation"
            );
        } finally {
            resetDocument();
        }
    });

    it("rejects invalid containers", () => {
        expect.assertions(1);

        resetDocument();

        try {
            expect(() => {
                addExitFullscreenOverlay(null as unknown as HTMLElement);
            }).toThrow(TypeError);
        } finally {
            resetDocument();
        }
    });

    it("exits fullscreen and stops click propagation", async () => {
        expect.assertions(3);

        resetDocument();
        const container = document.createElement("section");
        const fullscreenElement = document.createElement("div");
        const exitFullscreen = setExitFullscreen(() => Promise.resolve());
        setFullscreenElement(fullscreenElement);

        try {
            document.body.append(container);
            addExitFullscreenOverlay(container);

            const event = new MouseEvent("click", { bubbles: true });
            const stopPropagationSpy = vi.spyOn(event, "stopPropagation");
            const button = getExitButton(container);

            button.dispatchEvent(event);
            await Promise.resolve();

            expect(stopPropagationSpy).toHaveBeenCalledOnce();
            expect(exitFullscreen).toHaveBeenCalledExactlyOnceWith();
            expect(container.querySelector(EXIT_BUTTON_SELECTOR)).toBe(button);
        } finally {
            resetDocument();
        }
    });

    it("logs a warning when no element is in fullscreen mode", () => {
        expect.assertions(3);

        resetDocument();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const container = document.createElement("section");
        setFullscreenElement(null);
        setExitFullscreen(() => Promise.resolve());

        try {
            document.body.append(container);
            addExitFullscreenOverlay(container);

            getExitButton(container).click();

            expect(getExitButton(container).parentElement).toBe(container);
            expect(warnSpy).toHaveBeenCalledWith(
                "[addExitFullscreenOverlay] No element is currently in fullscreen mode."
            );
            expect(document.exitFullscreen).not.toHaveBeenCalled();
        } finally {
            resetDocument();
        }
    });

    it("logs rejected fullscreen exit failures", async () => {
        expect.assertions(3);

        resetDocument();
        const error = new Error("Denied");
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const container = document.createElement("section");
        setFullscreenElement(document.createElement("div"));
        setExitFullscreen(() => Promise.reject(error));

        try {
            document.body.append(container);
            addExitFullscreenOverlay(container);

            getExitButton(container).click();
            await Promise.resolve();
            await Promise.resolve();

            expect(getExitButton(container).parentElement).toBe(container);
            expect(errorSpy).toHaveBeenCalledWith(
                "[addExitFullscreenOverlay] Failed to exit fullscreen mode:",
                error
            );
            expect(document.exitFullscreen).toHaveBeenCalledOnce();
        } finally {
            resetDocument();
        }
    });
});
