/**
 * Tests for tab button disabled state functionality
 * These tests verify that disabled tab buttons do not respond to clicks
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDisabledTabButtons, cleanupDOM, mockStateManager } from '../../fixtures/tabFixtures.js';

// Mock the state manager before importing tab modules
const mockState = mockStateManager();
vi.mock('../../../utils/state/core/stateManager.js', () => mockState);

// Import tab modules after mocking
const { updateActiveTab, initializeActiveTabState } = await import('../../../utils/ui/tabs/updateActiveTab.js');

describe('Tab Button Disabled State', () => {
    /** @type {HTMLElement} */
    let container;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        mockState._state.clear();
        mockState._subscribers.clear();
        
        // Set up DOM
        container = createDisabledTabButtons();
        
        // Set initial state
        mockState.setState('ui.activeTab', 'summary');
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('updateActiveTab function', () => {
        it('should update active tab when called programmatically', () => {
            updateActiveTab('tab-chart');
            
            const summaryTab = /** @type {HTMLElement} */ (document.getElementById('tab-summary'));
            const chartTab = /** @type {HTMLElement} */ (document.getElementById('tab-chart'));
            
            expect(summaryTab?.classList.contains('active')).toBe(false);
            expect(chartTab?.classList.contains('active')).toBe(true);
            expect(mockState.setState).toHaveBeenCalledWith('ui.activeTab', 'chart', { source: 'updateActiveTab' });
        });

        it('should handle invalid tab IDs gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            updateActiveTab('');
            updateActiveTab(/** @type {any} */ (null));
            updateActiveTab(/** @type {any} */ (undefined));
            
            expect(consoleSpy).toHaveBeenCalledTimes(3);
            consoleSpy.mockRestore();
        });
    });

    describe('Tab Button Click Handling', () => {
        beforeEach(() => {
            // Initialize the tab state management
            initializeActiveTabState();
        });

        it('should prevent clicks on buttons with disabled property', () => {
            const chartTab = /** @type {HTMLButtonElement} */ (document.getElementById('tab-chart'));
            if (chartTab) {
                chartTab.disabled = true;
                
                const clickEvent = new MouseEvent('click', { bubbles: true });
                const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
                const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
                
                chartTab.dispatchEvent(clickEvent);
                
                // Tab should remain on summary
                expect(mockState.setState).not.toHaveBeenCalledWith('ui.activeTab', 'chart', { source: 'tabButtonClick' });
                expect(preventDefaultSpy).toHaveBeenCalled();
                expect(stopPropagationSpy).toHaveBeenCalled();
            }
        });

        it('should prevent clicks on buttons with disabled attribute', () => {
            const mapTab = /** @type {HTMLElement} */ (document.getElementById('tab-map'));
            if (mapTab) {
                mapTab.setAttribute('disabled', 'true');
                
                const clickEvent = new MouseEvent('click', { bubbles: true });
                const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
                
                mapTab.dispatchEvent(clickEvent);
                
                // Tab should remain on summary
                expect(mockState.setState).not.toHaveBeenCalledWith('ui.activeTab', 'map', { source: 'tabButtonClick' });
                expect(preventDefaultSpy).toHaveBeenCalled();
            }
        });

        it('should prevent clicks on buttons with tab-disabled class', () => {
            const tableTab = /** @type {HTMLElement} */ (document.getElementById('tab-table'));
            if (tableTab) {
                tableTab.classList.add('tab-disabled');
                
                const clickEvent = new MouseEvent('click', { bubbles: true });
                const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
                
                tableTab.dispatchEvent(clickEvent);
                
                // Tab should remain on summary
                expect(mockState.setState).not.toHaveBeenCalledWith('ui.activeTab', 'table', { source: 'tabButtonClick' });
                expect(preventDefaultSpy).toHaveBeenCalled();
            }
        });

        it('should allow clicks on enabled buttons', () => {
            const summaryTab = /** @type {HTMLButtonElement} */ (document.getElementById('tab-summary'));
            if (summaryTab) {
                // Ensure summary tab is enabled
                summaryTab.disabled = false;
                summaryTab.removeAttribute('disabled');
                summaryTab.classList.remove('tab-disabled');
                
                const clickEvent = new MouseEvent('click', { bubbles: true });
                summaryTab.dispatchEvent(clickEvent);
                
                // Should update to summary tab
                expect(mockState.setState).toHaveBeenCalledWith('ui.activeTab', 'summary', { source: 'tabButtonClick' });
            }
        });

        it('should log disabled button clicks for debugging', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const chartTab = /** @type {HTMLButtonElement} */ (document.getElementById('tab-chart'));
            if (chartTab) {
                chartTab.disabled = true;
                
                const clickEvent = new MouseEvent('click', { bubbles: true });
                chartTab.dispatchEvent(clickEvent);
                
                expect(consoleSpy).toHaveBeenCalledWith('[ActiveTab] Ignoring click on disabled button: tab-chart');
            }
            consoleSpy.mockRestore();
        });
    });

    describe('Tab State Synchronization', () => {
        beforeEach(() => {
            initializeActiveTabState();
        });

        it('should update DOM when state changes', () => {
            // Change state programmatically
            mockState.setState('ui.activeTab', 'chart');
            
            const summaryTab = /** @type {HTMLElement} */ (document.getElementById('tab-summary'));
            const chartTab = /** @type {HTMLElement} */ (document.getElementById('tab-chart'));
            
            expect(summaryTab?.classList.contains('active')).toBe(false);
            expect(summaryTab?.getAttribute('aria-selected')).toBe('false');
            expect(chartTab?.classList.contains('active')).toBe(true);
            expect(chartTab?.getAttribute('aria-selected')).toBe('true');
        });

        it('should handle state changes to non-existent tabs gracefully', () => {
            // This should not throw an error
            mockState.setState('ui.activeTab', 'nonexistent');
            
            // All tabs should be inactive
            const tabs = document.querySelectorAll('.tab-button');
            tabs.forEach(tab => {
                expect(tab.classList.contains('active')).toBe(false);
                expect(tab.getAttribute('aria-selected')).toBe('false');
            });
        });
    });

    describe('Tab Name Extraction', () => {
        beforeEach(() => {
            // Initialize the tab state management for this test group
            initializeActiveTabState();
        });

        it('should extract tab names from various ID patterns', () => {
            // This tests the internal extractTabName function indirectly
            const testCases = [
                ['tab-summary', 'summary'],
                ['tab-chart', 'chart'],
                ['btn-map', 'map'],
                ['table-btn', 'table'],
            ];
            
            testCases.forEach(([buttonId, expectedName]) => {
                // Clear previous calls
                mockState.setState.mockClear();
                
                // Create a button with the test ID
                const button = document.createElement('button');
                button.id = /** @type {string} */ (buttonId);
                button.className = 'tab-button';
                container.appendChild(button);
                
                // Re-initialize to pick up the new button
                initializeActiveTabState();
                
                const clickEvent = new MouseEvent('click', { bubbles: true });
                button.dispatchEvent(clickEvent);
                
                // Check that setState was called with correct tab name (don't check source parameter)
                expect(mockState.setState).toHaveBeenCalledWith('ui.activeTab', expectedName, expect.any(Object));
            });
        });
    });
});
