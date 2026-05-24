/**
 * DOM test fixtures for tab functionality tests
 */
import { vi } from "vitest";

/**
 * @param {string} id
 * @param {string} label
 * @param {boolean} isActive
 * @returns {HTMLButtonElement}
 */
function createTabButton(id, label, isActive) {
    const button = document.createElement("button");
    button.id = id;
    button.classList.add("tab-button");
    if (isActive) {
        button.classList.add("active");
    }
    button.setAttribute("aria-selected", String(isActive));
    button.textContent = label;
    return button;
}

/**
 * @param {string} id
 * @param {string} text
 * @param {boolean} isActive
 * @returns {HTMLDivElement}
 */
function createTabPane(id, text, isActive) {
    const pane = document.createElement("div");
    pane.id = id;
    pane.classList.add("tab-pane");
    if (isActive) {
        pane.classList.add("active");
    }
    pane.textContent = text;
    return pane;
}

export function createMockTabButtons() {
    const container = document.createElement("div");
    const tabContainer = document.createElement("div");
    tabContainer.classList.add("tab-container");
    tabContainer.append(
        createTabButton("tab-summary", "Summary", true),
        createTabButton("tab-chart", "Chart", false),
        createTabButton("tab-map", "Map", false),
        createTabButton("tab-table", "Table", false)
    );

    const tabContent = document.createElement("div");
    tabContent.classList.add("tab-content");
    tabContent.append(
        createTabPane("summary-content", "Summary content", true),
        createTabPane("chart-content", "Chart content", false),
        createTabPane("map-content", "Map content", false),
        createTabPane("table-content", "Table content", false)
    );

    container.append(tabContainer, tabContent);

    document.body.appendChild(container);
    return container;
}

export function createDisabledTabButtons() {
    const container = createMockTabButtons();
    const tabButtons = container.querySelectorAll(".tab-button");

    // Disable all buttons except summary using different methods to test all cases
    tabButtons.forEach((button, index) => {
        if (button.id !== "tab-summary") {
            switch (index % 3) {
                case 0:
                    /** @type {HTMLButtonElement} */ (button).disabled = true;
                    break;
                case 1:
                    button.setAttribute("disabled", "true");
                    break;
                case 2:
                    button.classList.add("tab-disabled");
                    break;
            }
        }
    });

    return container;
}

export function cleanupDOM() {
    document.body.replaceChildren();
}

export function mockStateManager() {
    const state = new Map();
    const subscribers = new Map();

    return {
        getState: vi.fn((/** @type {string} */ key) => state.get(key)),
        setState: vi.fn(
            (
                /** @type {string} */ key,
                /** @type {any} */ value,
                /** @type {any} */ options = {}
            ) => {
                const oldValue = state.get(key);
                state.set(key, value);

                // Notify subscribers
                const keySubscribers = subscribers.get(key) || [];
                keySubscribers.forEach((/** @type {Function} */ callback) =>
                    callback(value, oldValue, options)
                );
            }
        ),
        subscribe: vi.fn(
            (/** @type {string} */ key, /** @type {Function} */ callback) => {
                if (!subscribers.has(key)) {
                    subscribers.set(key, []);
                }
                subscribers.get(key).push(callback);

                return () => {
                    const keySubscribers = subscribers.get(key) || [];
                    const index = keySubscribers.indexOf(callback);
                    if (index > -1) {
                        keySubscribers.splice(index, 1);
                    }
                };
            }
        ),
        // Expose internals for testing
        _state: state,
        _subscribers: subscribers,
    };
}
