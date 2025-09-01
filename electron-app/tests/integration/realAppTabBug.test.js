/**
 * Integration test that simulates the real app's initialization sequence
 * to identify where the disabled attribute bug occurs
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the state manager
const mockStateManager = {
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
};

// Mock the global state
let globalState = {
    'ui.activeTab': 'summary',
    'ui.tabButtonsEnabled': false,
    'globalData': null
};

// Mock implementation
mockStateManager.getState.mockImplementation((key) => globalState[key]);
mockStateManager.setState.mockImplementation((key, value) => {
    globalState[key] = value;
    // Trigger subscribers
    const callbacks = mockStateManager.subscribe.mock.calls
        .filter(call => call[0] === key)
        .map(call => call[1]);
    callbacks.forEach(callback => callback(value));
});

// Mock the imports before importing the modules
vi.doMock('../../../utils/state/core/stateManager.js', () => ({
    getState: mockStateManager.getState,
    setState: mockStateManager.setState,
    subscribe: mockStateManager.subscribe,
}));

vi.doMock('../../../utils/dom/domHelpers.js', () => ({
    isHTMLElement: (el) => el instanceof HTMLElement,
}));

// Now import the modules after mocking
const { setTabButtonsEnabled, initializeTabButtonState } = await import('../../../utils/ui/controls/enableTabButtons.js');
const { initializeActiveTabState, updateActiveTab } = await import('../../../utils/ui/tabs/updateActiveTab.js');

describe('Real App Integration: Tab Button Bug', () => {
    beforeEach(() => {
        // Reset state
        globalState = {
            'ui.activeTab': 'summary',
            'ui.tabButtonsEnabled': false,
            'globalData': null
        };

        // Clear mocks
        vi.clearAllMocks();

        // Create real DOM like the actual app
        document.body.innerHTML = `
            <div class="tabs-container">
                <button class="tab-button active" id="tab-summary" role="tab" aria-selected="true" tabindex="0">
                    <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11H5a2 2 0 0 0-2 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"></path>
                        <path d="M19 4H15a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                    </svg>
                    Summary
                </button>
                <button class="tab-button" id="tab-chart" role="tab" aria-selected="false" tabindex="-1">
                    <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3v18h18"></path>
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                    </svg>
                    Chart
                </button>
                <button class="tab-button" id="tab-map" role="tab" aria-selected="false" tabindex="-1">
                    <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Map
                </button>
                <button class="tab-button" id="tab-table" role="tab" aria-selected="false" tabindex="-1">
                    <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path>
                        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>
                    </svg>
                    Data
                </button>
            </div>
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should simulate the exact real app initialization sequence', async () => {
        console.log('Starting real app simulation...');

        // Step 1: Initialize tab button state (like masterStateManager.js does)
        console.log('Step 1: Initialize tab button state');
        initializeTabButtonState(); // This sets tabs to disabled initially

        // Step 2: Initialize active tab state (like masterStateManager.js does)
        console.log('Step 2: Initialize active tab state');
        initializeActiveTabState(); // This adds click handlers

        // Verify initial state - tabs should be disabled
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            const btn = /** @type {HTMLButtonElement} */ (button);
            expect(btn.disabled).toBe(true);
            expect(btn.hasAttribute('disabled')).toBe(true);
            console.log(`Initial: ${btn.id} - disabled=${btn.disabled}, hasAttr=${btn.hasAttribute('disabled')}`);
        });

        // Step 3: Simulate file loading (like showFitData.js does)
        console.log('Step 3: Simulate file loading');

        // First set globalData (triggers subscription in initializeTabButtonState)
        globalState.globalData = { records: [{ type: 'activity' }] };
        mockStateManager.setState('globalData', globalState.globalData);

        // Wait for any async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        // Also call setTabButtonsEnabled directly (like showFitData.js does)
        if (typeof window !== 'undefined') {
            window.setTabButtonsEnabled = setTabButtonsEnabled;
        }
        setTabButtonsEnabled(true);

        // Wait for any additional async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        // Step 4: Check final state - this is where the bug occurs
        console.log('Step 4: Check final state');
        buttons.forEach(button => {
            const btn = /** @type {HTMLButtonElement} */ (button);
            console.log(`Final: ${btn.id} - disabled=${btn.disabled}, hasAttr=${btn.hasAttribute('disabled')}, style=${btn.style.pointerEvents}`);

            // These should all be false, but in the real app, hasAttribute('disabled') remains true
            expect(btn.disabled).toBe(false);
            expect(btn.hasAttribute('disabled')).toBe(false); // This is the failing assertion in real app
            expect(btn.style.pointerEvents).toBe('auto');
        });
    });

    it('should detect conflicts between multiple enable/disable calls', async () => {
        // Set up mutation observer to track all changes
        const changes = [];
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                    const target = /** @type {HTMLElement} */ (mutation.target);
                    changes.push({
                        target: target.id,
                        oldValue: mutation.oldValue,
                        newValue: target.getAttribute('disabled'),
                        timestamp: Date.now(),
                        source: 'unknown'
                    });
                }
            });
        });

        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            observer.observe(button, {
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ['disabled']
            });
        });

        // Simulate rapid initialization
        initializeTabButtonState(); // Disables tabs
        initializeActiveTabState(); // Adds click handlers

        await new Promise(resolve => setTimeout(resolve, 10));

        // Simulate file loading
        globalState.globalData = { records: [] };
        mockStateManager.setState('globalData', globalState.globalData);
        setTabButtonsEnabled(true);

        await new Promise(resolve => setTimeout(resolve, 10));

        // Check if something is re-adding disabled attributes
        setTabButtonsEnabled(true); // Call again (like showFitData.js might)

        await new Promise(resolve => setTimeout(resolve, 50));

        observer.disconnect();

        console.log('Attribute changes detected:', changes);

        // Look for patterns that might indicate the bug
        const unexpectedDisables = changes.filter(change =>
            change.newValue === '' && change.oldValue === null
        );

        if (unexpectedDisables.length > 0) {
            console.log('Found unexpected disabled attribute additions:', unexpectedDisables);
        }
    });

    it('should test timing-sensitive scenarios', async () => {
        // Initialize systems
        initializeTabButtonState();
        initializeActiveTabState();

        // Rapidly toggle state (like might happen during initialization)
        setTabButtonsEnabled(false);
        await new Promise(resolve => setTimeout(resolve, 1));

        setTabButtonsEnabled(true);
        await new Promise(resolve => setTimeout(resolve, 1));

        setTabButtonsEnabled(false);
        await new Promise(resolve => setTimeout(resolve, 1));

        setTabButtonsEnabled(true);
        await new Promise(resolve => setTimeout(resolve, 1));

        // Final check
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            const btn = /** @type {HTMLButtonElement} */ (button);
            expect(btn.disabled).toBe(false);
            expect(btn.hasAttribute('disabled')).toBe(false);
        });
    });
});
