import { describe, expect, it, vi } from "vitest";
import { createPanelController } from "../../../../../../utils/ui/controls/dataPointFilterControl/panelController.js";

interface PanelFixture {
    cleanup: () => void;
    container: HTMLDivElement;
    metricSelect: HTMLSelectElement;
    panel: HTMLDivElement;
    toggleButton: HTMLButtonElement;
}

function createFixture(): PanelFixture {
    const container = document.createElement("div");
    container.className = "data-point-filter-control";

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.setAttribute("aria-expanded", "false");

    const metricSelect = document.createElement("select");
    metricSelect.append(document.createElement("option"));

    const panel = document.createElement("div");
    panel.hidden = true;

    container.append(toggleButton, metricSelect);
    document.body.replaceChildren(container);

    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(
        (callback: FrameRequestCallback) => {
            callback(0);
            return 1;
        }
    );
    vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {});

    return {
        cleanup: () => {
            vi.restoreAllMocks();
            document.body.replaceChildren();
        },
        container,
        metricSelect,
        panel,
        toggleButton,
    };
}

function setRect(element: HTMLElement, rect: Partial<DOMRect>): void {
    const defaultRect = {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    } satisfies DOMRect;

    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
        ...defaultRect,
        ...rect,
    });
}

describe(createPanelController, () => {
    it("opens and positions the panel beside the toggle button", () => {
        expect.assertions(8);

        const {
            cleanup,
            container,
            metricSelect,
            panel,
            toggleButton,
        } = createFixture();
        setRect(toggleButton, {
            bottom: 120,
            height: 40,
            left: 100,
            top: 80,
            width: 80,
        });
        setRect(panel, {
            height: 120,
            width: 200,
        });

        try {
            const { openPanel } = createPanelController({
                container,
                metricSelect,
                panel,
                toggleButton,
                viewportPadding: 12,
            });

            expect(() => openPanel()).not.toThrow();

            expect(panel.parentElement).toBe(document.body);
            expect(panel.hidden ? "hidden" : "visible").toBe("visible");
            expect([...container.classList]).toContain(
                "data-point-filter-control--open"
            );
            expect(toggleButton.getAttribute("aria-expanded")).toBe("true");
            expect(panel.style.left).toBe("40px");
            expect(panel.style.top).toBe("132px");
            expect(document.activeElement).toBe(metricSelect);
        } finally {
            cleanup();
        }
    });

    it("closes the panel and clears transient positioning state", () => {
        expect.assertions(7);

        const {
            cleanup,
            container,
            metricSelect,
            panel,
            toggleButton,
        } = createFixture();
        setRect(toggleButton, {
            bottom: 120,
            left: 100,
            top: 80,
            width: 80,
        });
        setRect(panel, {
            height: 120,
            width: 200,
        });

        try {
            const { closePanel, openPanel } = createPanelController({
                container,
                metricSelect,
                panel,
                toggleButton,
                viewportPadding: 12,
            });

            openPanel();
            closePanel();

            expect(panel.hidden ? "hidden" : "visible").toBe("hidden");
            expect([...container.classList]).not.toContain(
                "data-point-filter-control--open"
            );
            expect(toggleButton.getAttribute("aria-expanded")).toBe("false");
            expect(panel.style.left).toBe("");
            expect(panel.style.top).toBe("");
            expect(panel.style.opacity).toBe("");
            expect(
                panel.style.getPropertyValue(
                    "--data-point-filter-arrow-offset"
                )
            ).toBe("");
        } finally {
            cleanup();
        }
    });

    it("does not close when clicks stay inside the panel", () => {
        expect.assertions(2);

        const {
            cleanup,
            container,
            metricSelect,
            panel,
            toggleButton,
        } = createFixture();
        setRect(toggleButton, {
            bottom: 120,
            left: 100,
            top: 80,
            width: 80,
        });
        setRect(panel, {
            height: 120,
            width: 200,
        });

        try {
            const { openPanel } = createPanelController({
                container,
                metricSelect,
                panel,
                toggleButton,
                viewportPadding: 12,
            });

            openPanel();
            panel.dispatchEvent(
                new MouseEvent("mousedown", { bubbles: true })
            );

            expect(panel.hidden ? "hidden" : "visible").toBe("visible");
            expect(toggleButton.getAttribute("aria-expanded")).toBe("true");
        } finally {
            cleanup();
        }
    });

    it("closes when clicking outside the panel and container", () => {
        expect.assertions(2);

        const {
            cleanup,
            container,
            metricSelect,
            panel,
            toggleButton,
        } = createFixture();
        setRect(toggleButton, {
            bottom: 120,
            left: 100,
            top: 80,
            width: 80,
        });
        setRect(panel, {
            height: 120,
            width: 200,
        });

        const outside = document.createElement("button");
        document.body.append(outside);

        try {
            const { openPanel } = createPanelController({
                container,
                metricSelect,
                panel,
                toggleButton,
                viewportPadding: 12,
            });

            openPanel();
            outside.dispatchEvent(
                new MouseEvent("mousedown", { bubbles: true })
            );

            expect(panel.hidden ? "hidden" : "visible").toBe("hidden");
            expect(toggleButton.getAttribute("aria-expanded")).toBe("false");
        } finally {
            cleanup();
        }
    });
});
