/**
 * Specific test to reproduce and debug the disabled attribute bug This test
 * simulates the exact real-world scenario where disabled="" persists
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const { setTabButtonsEnabled } =
    await import("../../../electron-app/utils/ui/controls/enableTabButtons.js");

function createTabButton({
    active = false,
    ariaSelected,
    id,
    label,
    tabIndex,
}: {
    active?: boolean;
    ariaSelected: "false" | "true";
    id: string;
    label: string;
    tabIndex: "-1" | "0";
}): HTMLButtonElement {
    const button = document.createElement("button");

    button.className = active ? "tab-button active" : "tab-button";
    button.id = id;
    button.role = "tab";
    button.setAttribute("aria-selected", ariaSelected);
    button.tabIndex = Number.parseInt(tabIndex, 10);
    button.textContent = label;

    return button;
}

function createTabContainer(): HTMLDivElement {
    const container = document.createElement("div");

    container.className = "tab-container";
    container.replaceChildren(
        createTabButton({
            active: true,
            ariaSelected: "true",
            id: "tab-summary",
            label: "Summary",
            tabIndex: "0",
        }),
        createTabButton({
            ariaSelected: "false",
            id: "tab-chart",
            label: "Chart",
            tabIndex: "-1",
        }),
        createTabButton({
            ariaSelected: "false",
            id: "tab-map",
            label: "Map",
            tabIndex: "-1",
        }),
        createTabButton({
            ariaSelected: "false",
            id: "tab-table",
            label: "Data",
            tabIndex: "-1",
        })
    );

    return container;
}

function createAltFitButton(): HTMLButtonElement {
    const button = createTabButton({
        active: true,
        ariaSelected: "true",
        id: "tab-altfit",
        label: "Data",
        tabIndex: "0",
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const ellipse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "ellipse"
    );
    const firstPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );
    const secondPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    button.setAttribute("aria-disabled", "false");
    button.style.pointerEvents = "auto";
    button.style.cursor = "pointer";
    button.style.filter = "none";
    button.style.opacity = "1";
    button.setAttribute("disabled", "");

    svg.classList.add("tab-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    ellipse.setAttribute("cx", "12");
    ellipse.setAttribute("cy", "5");
    ellipse.setAttribute("rx", "9");
    ellipse.setAttribute("ry", "3");
    firstPath.setAttribute("d", "M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5");
    secondPath.setAttribute("d", "M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3");
    svg.replaceChildren(ellipse, firstPath, secondPath);
    button.prepend(svg);

    return button;
}

function getAltFitButton(): HTMLButtonElement {
    const button = document.querySelector<HTMLButtonElement>("#tab-altfit");

    if (!(button instanceof HTMLButtonElement)) {
        throw new TypeError("Expected tab-altfit to be a button");
    }

    return button;
}

describe("tab disabled attribute bug investigation", () => {
    let mockButtons: HTMLButtonElement[] = [];

    beforeEach(() => {
        // Create DOM exactly like the real app
        document.body.replaceChildren(createTabContainer());

        mockButtons = Array.from(document.querySelectorAll(".tab-button"));
    });

    afterEach(() => {
        document.body.replaceChildren();
        mockButtons = [];
    });

    it("should properly remove disabled attribute through direct DOM manipulation", () => {
        expect.hasAssertions();

        // Manually add disabled attribute like it appears in the real app
        mockButtons.forEach((button) => {
            button.setAttribute("disabled", "");
            button.disabled = true;
        });

        // Verify they're disabled
        mockButtons.forEach((button) => {
            expect(button.hasAttribute("disabled")).toBe(true);
            expect(button.disabled).toBe(true);
        });

        // Try to remove the disabled attribute
        mockButtons.forEach((button) => {
            button.disabled = false;
            button.removeAttribute("disabled");
        });

        // Check if removal worked
        mockButtons.forEach((button) => {
            expect(button.disabled).toBe(false);
            expect(button.hasAttribute("disabled")).toBe(false);
        });
    });

    it("should detect if multiple systems are setting disabled attributes", () => {
        expect.hasAssertions();

        const attributeChanges: {
            target: string;
            oldValue: string | null;
            newValue: string | null;
            timestamp: number;
        }[] = [];

        // Set up a MutationObserver to track attribute changes
        const recordAttributeChanges = (mutations: MutationRecord[]): void => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "disabled"
                ) {
                    const target = mutation.target as HTMLElement;
                    attributeChanges.push({
                        target: target.id,
                        oldValue: mutation.oldValue,
                        newValue: target.getAttribute("disabled"),
                        timestamp: Date.now(),
                    });
                }
            });
        };
        const observer = new MutationObserver(recordAttributeChanges);

        mockButtons.forEach((button) => {
            observer.observe(button, {
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ["disabled"],
            });
        });

        // Simulate the real scenario: multiple systems enabling/disabling
        // First disable (like initial state)
        mockButtons.forEach((button) => {
            button.setAttribute("disabled", "");
            button.disabled = true;
        });

        // Then enable (like file load)
        setTabButtonsEnabled(true);

        recordAttributeChanges(observer.takeRecords());

        observer.disconnect();

        // Check for any unexpected attribute changes
        const unexpectedChanges = attributeChanges.filter(
            (change) =>
                change.newValue !== null && change.newValue !== undefined
        );

        expect(Array.isArray(attributeChanges)).toBe(true);
        expect(unexpectedChanges).toHaveLength(0);

        // Verify final state
        mockButtons.forEach((button) => {
            expect(button.disabled).toBe(false);
            expect(button.hasAttribute("disabled")).toBe(false);
        });
    });

    it("should test with the exact same DOM structure as real app", () => {
        expect.hasAssertions();

        // Create button with exact same attributes as the bug report
        document.body.replaceChildren(createAltFitButton());

        const button = getAltFitButton();

        // Verify initial problematic state
        expect(button.hasAttribute("disabled")).toBe(true);
        expect(button.getAttribute("disabled")).toBe("");
        expect(button.getAttribute("aria-disabled")).toBe("false"); // Contradiction!
        expect(button.style.pointerEvents).toBe("auto"); // Should be enabled styling

        // Apply the fix
        setTabButtonsEnabled(true);

        // Verify fix works
        expect(button.disabled).toBe(false);
        expect(button.hasAttribute("disabled")).toBe(false);
        expect(button.getAttribute("disabled")).not.toBe("");
        expect(button.matches('[aria-disabled="false"]')).toBe(true);
        expect(button.style.cssText).toContain("pointer-events: auto");
    });

    it("should simulate the real app enabling process with timing", async () => {
        expect.hasAssertions();

        // Start with disabled buttons
        mockButtons.forEach((button) => {
            button.setAttribute("disabled", "");
            button.disabled = true;
            button.classList.add("tab-disabled");
            button.setAttribute("aria-disabled", "true");
            button.style.pointerEvents = "none";
        });

        // Simulate async file loading process
        await Promise.resolve();

        // Enable buttons (simulate setTabButtonsEnabled(true))
        setTabButtonsEnabled(true);

        // Force style recalculation (like the real code does)
        mockButtons.forEach((button) => {
            button.offsetHeight; // Triggers reflow
        });

        // Verify final state
        mockButtons.forEach((button) => {
            expect(button.disabled).toBe(false);
            expect(button.hasAttribute("disabled")).toBe(false);
            expect(button.getAttribute("aria-disabled")).toBe("false");
            expect(button.style.pointerEvents).toBe("auto");
        });
    });
});
