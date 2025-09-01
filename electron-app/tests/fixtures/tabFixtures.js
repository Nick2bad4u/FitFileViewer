/**
 * DOM test fixtures for tab functionality tests
 */
import { vi } from 'vitest';

export function createMockTabButtons() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="tab-container">
            <button id="tab-summary" class="tab-button active" aria-selected="true">Summary</button>
            <button id="tab-chart" class="tab-button" aria-selected="false">Chart</button>
            <button id="tab-map" class="tab-button" aria-selected="false">Map</button>
            <button id="tab-table" class="tab-button" aria-selected="false">Table</button>
        </div>
        <div class="tab-content">
            <div id="summary-content" class="tab-pane active">Summary content</div>
            <div id="chart-content" class="tab-pane">Chart content</div>
            <div id="map-content" class="tab-pane">Map content</div>
            <div id="table-content" class="tab-pane">Table content</div>
        </div>
    `;
    
    document.body.appendChild(container);
    return container;
}

export function createDisabledTabButtons() {
    const container = createMockTabButtons();
    const tabButtons = container.querySelectorAll('.tab-button');
    
    // Disable all buttons except summary using different methods to test all cases
    tabButtons.forEach((button, index) => {
        if (button.id !== 'tab-summary') {
            switch (index % 3) {
                case 0:
                    /** @type {HTMLButtonElement} */ (button).disabled = true;
                    break;
                case 1:
                    button.setAttribute('disabled', 'true');
                    break;
                case 2:
                    button.classList.add('tab-disabled');
                    break;
            }
        }
    });
    
    return container;
}

export function cleanupDOM() {
    document.body.innerHTML = '';
}

export function mockStateManager() {
    const state = new Map();
    const subscribers = new Map();
    
    return {
        getState: vi.fn((/** @type {string} */ key) => state.get(key)),
        setState: vi.fn((/** @type {string} */ key, /** @type {any} */ value, /** @type {any} */ options = {}) => {
            const oldValue = state.get(key);
            state.set(key, value);
            
            // Notify subscribers
            const keySubscribers = subscribers.get(key) || [];
            keySubscribers.forEach((/** @type {Function} */ callback) => callback(value, oldValue, options));
        }),
        subscribe: vi.fn((/** @type {string} */ key, /** @type {Function} */ callback) => {
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
        }),
        // Expose internals for testing
        _state: state,
        _subscribers: subscribers,
    };
}
