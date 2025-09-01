/**
 * Specific test to reproduce and debug the disabled attribute bug
 * This test simulates the exact real-world scenario where disabled="" persists
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Tab Disabled Attribute Bug Investigation', () => {
    /** @type {HTMLButtonElement[]} */
    let mockButtons = [];

    beforeEach(() => {
        // Create DOM exactly like the real app
        document.body.innerHTML = `
            <div class="tab-container">
                <button class="tab-button active" id="tab-summary" role="tab" aria-selected="true" tabindex="0">Summary</button>
                <button class="tab-button" id="tab-chart" role="tab" aria-selected="false" tabindex="-1">Chart</button>
                <button class="tab-button" id="tab-map" role="tab" aria-selected="false" tabindex="-1">Map</button>
                <button class="tab-button" id="tab-table" role="tab" aria-selected="false" tabindex="-1">Data</button>
            </div>
        `;

        mockButtons = Array.from(document.querySelectorAll('.tab-button'));
    });

    afterEach(() => {
        document.body.innerHTML = '';
        mockButtons = [];
    });

    it('should properly remove disabled attribute through direct DOM manipulation', () => {
        // Manually add disabled attribute like it appears in the real app
        mockButtons.forEach(button => {
            button.setAttribute('disabled', '');
            button.disabled = true;
        });

        // Verify they're disabled
        mockButtons.forEach(button => {
            expect(button.hasAttribute('disabled')).toBe(true);
            expect(button.disabled).toBe(true);
        });

        // Try to remove the disabled attribute
        mockButtons.forEach(button => {
            button.disabled = false;
            button.removeAttribute('disabled');
        });

        // Check if removal worked
        mockButtons.forEach(button => {
            expect(button.disabled).toBe(false);
            expect(button.hasAttribute('disabled')).toBe(false);
        });
    });

    it('should detect if multiple systems are setting disabled attributes', () => {
        /** @type {Array<{target: string, oldValue: string|null, newValue: string|null, timestamp: number}>} */
        const attributeChanges = [];

        // Set up a MutationObserver to track attribute changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                    const target = /** @type {HTMLElement} */ (mutation.target);
                    attributeChanges.push({
                        target: target.id,
                        oldValue: mutation.oldValue,
                        newValue: target.getAttribute('disabled'),
                        timestamp: Date.now()
                    });
                }
            });
        });

        mockButtons.forEach(button => {
            observer.observe(button, {
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ['disabled']
            });
        });

        // Simulate the real scenario: multiple systems enabling/disabling
        // First disable (like initial state)
        mockButtons.forEach(button => {
            button.setAttribute('disabled', '');
            button.disabled = true;
        });

        // Then enable (like file load)
        mockButtons.forEach(button => {
            button.disabled = false;
            button.removeAttribute('disabled');
        });

        // Wait a bit for any async operations
        setTimeout(() => {
            observer.disconnect();

            // Check for any unexpected attribute changes
            const unexpectedChanges = attributeChanges.filter(change =>
                change.newValue !== null && change.newValue !== undefined
            );

            expect(unexpectedChanges).toHaveLength(0);

            // Verify final state
            mockButtons.forEach(button => {
                expect(button.disabled).toBe(false);
                expect(button.hasAttribute('disabled')).toBe(false);
            });
        }, 100);
    });

    it('should test with the exact same DOM structure as real app', () => {
        // Create button with exact same attributes as the bug report
        document.body.innerHTML = `
            <button class="tab-button active" id="tab-altfit" role="tab" aria-selected="true" tabindex="0" aria-disabled="false" style="pointer-events: auto; cursor: pointer; filter: none; opacity: 1;" disabled="">
                <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path>
                    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>
                </svg>
                Data
            </button>
        `;

        const button = /** @type {HTMLButtonElement|null} */ (document.getElementById('tab-altfit'));

        // Verify button exists
        expect(button).not.toBeNull();
        if (!button) return; // TypeScript guard

        // Verify initial problematic state
        expect(button.hasAttribute('disabled')).toBe(true);
        expect(button.getAttribute('disabled')).toBe('');
        expect(button.getAttribute('aria-disabled')).toBe('false'); // Contradiction!
        expect(button.style.pointerEvents).toBe('auto'); // Should be enabled styling

        // Apply the fix
        button.disabled = false;
        button.removeAttribute('disabled');
        button.setAttribute('aria-disabled', 'false');
        button.style.pointerEvents = 'auto';

        // Verify fix works
        expect(button.disabled).toBe(false);
        expect(button.hasAttribute('disabled')).toBe(false);
        expect(button.getAttribute('aria-disabled')).toBe('false');
        expect(button.style.pointerEvents).toBe('auto');
    });

    it('should simulate the real app enabling process with timing', async () => {
        // Start with disabled buttons
        mockButtons.forEach(button => {
            button.setAttribute('disabled', '');
            button.disabled = true;
            button.classList.add('tab-disabled');
            button.setAttribute('aria-disabled', 'true');
            button.style.pointerEvents = 'none';
        });

        // Simulate async file loading process
        await new Promise(resolve => setTimeout(resolve, 10));

        // Enable buttons (simulate setTabButtonsEnabled(true))
        mockButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('tab-disabled');
            button.removeAttribute('disabled');
            button.setAttribute('aria-disabled', 'false');
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
            button.style.filter = 'none';
            button.style.opacity = '1';
        });

        // Force style recalculation (like the real code does)
        mockButtons.forEach(button => {
            button.offsetHeight; // Triggers reflow
        });

        // Verify final state
        mockButtons.forEach(button => {
            expect(button.disabled).toBe(false);
            expect(button.hasAttribute('disabled')).toBe(false);
            expect(button.getAttribute('aria-disabled')).toBe('false');
            expect(button.style.pointerEvents).toBe('auto');
        });
    });
});
