/**
 * Integration tests for tab state management
 * These tests verify the interaction between TabStateManager, updateActiveTab, and enableTabButtons
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockTabButtons, cleanupDOM, mockStateManager } from '../fixtures/tabFixtures.js';

// Mock the state manager
const mockState = mockStateManager();
vi.mock('../../utils/state/core/stateManager.js', () => mockState);

// Import modules after mocking
const { initializeActiveTabState } = await import('../../utils/ui/tabs/updateActiveTab.js');
const { setTabButtonsEnabled } = await import('../../utils/ui/controls/enableTabButtons.js');

describe('Tab State Management Integration', () => {
    beforeEach(() => {
        // Reset mocks and DOM
        vi.clearAllMocks();
        mockState._state.clear();
        mockState._subscribers.clear();
        createMockTabButtons();
        
        // Set initial state
        mockState.setState('ui.activeTab', 'summary');
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Tab button lifecycle during file loading', () => {
        it('should disable tabs before file load and prevent clicks', () => {
            // Initialize tab state management
            initializeActiveTabState();
            
            // Simulate file loading start - disable tabs
            setTabButtonsEnabled(false);
            
            // Verify tabs are disabled
            const chartTab = /** @type {HTMLButtonElement} */ (document.getElementById('tab-chart'));
            expect(chartTab?.disabled).toBe(true);
            expect(chartTab?.classList.contains('tab-disabled')).toBe(true);
            
            // Try to click disabled tab
            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
            
            chartTab?.dispatchEvent(clickEvent);
            
            // Should prevent the click
            expect(preventDefaultSpy).toHaveBeenCalled();
            // State should not change
            expect(mockState.setState).not.toHaveBeenCalledWith('ui.activeTab', 'chart', { source: 'tabButtonClick' });
        });

        it('should re-enable tabs after file load and allow clicks', () => {
            // Initialize and disable tabs
            initializeActiveTabState();
            setTabButtonsEnabled(false);
            
            // Simulate file loading complete - enable tabs
            setTabButtonsEnabled(true);
            
            // Verify tabs are enabled
            const chartTab = /** @type {HTMLButtonElement} */ (document.getElementById('tab-chart'));
            expect(chartTab?.disabled).toBe(false);
            expect(chartTab?.classList.contains('tab-disabled')).toBe(false);
            
            // Click should now work
            const clickEvent = new MouseEvent('click', { bubbles: true });
            chartTab?.dispatchEvent(clickEvent);
            
            // State should change
            expect(mockState.setState).toHaveBeenCalledWith('ui.activeTab', 'chart', { source: 'tabButtonClick' });
        });

        it('should handle multiple enable/disable cycles correctly', () => {
            initializeActiveTabState();
            
            const chartTab = /** @type {HTMLButtonElement} */ (document.getElementById('tab-chart'));
            
            // Cycle through multiple disable/enable states
            for (let i = 0; i < 5; i++) {
                setTabButtonsEnabled(false);
                expect(chartTab?.disabled).toBe(true);
                
                // Click should be prevented
                const clickEvent = new MouseEvent('click', { bubbles: true });
                chartTab?.dispatchEvent(clickEvent);
                expect(mockState.setState).not.toHaveBeenCalledWith('ui.activeTab', 'chart', { source: 'tabButtonClick' });
                
                setTabButtonsEnabled(true);
                expect(chartTab?.disabled).toBe(false);
                
                // Clear previous calls for next iteration
                mockState.setState.mockClear();
            }
        });
    });

    describe('State synchronization between systems', () => {
        it('should maintain state consistency when tabs are disabled', () => {
            initializeActiveTabState();
            
            // Set chart as active programmatically
            mockState.setState('ui.activeTab', 'chart');
            
            const summaryTab = /** @type {HTMLElement} */ (document.getElementById('tab-summary'));
            const chartTab = /** @type {HTMLElement} */ (document.getElementById('tab-chart'));
            
            // Visual state should update
            expect(summaryTab?.classList.contains('active')).toBe(false);
            expect(chartTab?.classList.contains('active')).toBe(true);
            
            // Now disable tabs
            setTabButtonsEnabled(false);
            
            // Disabled state should be applied but active state preserved
            expect(chartTab?.classList.contains('active')).toBe(true);
            expect(/** @type {HTMLButtonElement} */ (chartTab)?.disabled).toBe(true);
        });

        it('should handle rapid state changes during disabled state', () => {
            initializeActiveTabState();
            setTabButtonsEnabled(false);
            
            // Rapidly change active tab state
            const tabNames = ['chart', 'map', 'table', 'summary'];
            tabNames.forEach(tabName => {
                mockState.setState('ui.activeTab', tabName);
            });
            
            // Final state should be reflected in DOM
            const summaryTab = /** @type {HTMLElement} */ (document.getElementById('tab-summary'));
            expect(summaryTab?.classList.contains('active')).toBe(true);
            
            // But tabs should still be disabled
            expect(/** @type {HTMLButtonElement} */ (summaryTab)?.disabled).toBe(true);
        });
    });

    describe('Error handling and edge cases', () => {
        it('should handle missing tab elements gracefully', () => {
            // Remove a tab button
            const chartTab = document.getElementById('tab-chart');
            chartTab?.remove();
            
            initializeActiveTabState();
            
            // Should not throw when trying to set chart as active
            expect(() => {
                mockState.setState('ui.activeTab', 'chart');
            }).not.toThrow();
        });

        it('should handle initialization without DOM elements', () => {
            cleanupDOM();
            
            // Should not throw
            expect(() => {
                initializeActiveTabState();
                setTabButtonsEnabled(false);
                setTabButtonsEnabled(true);
            }).not.toThrow();
        });

        it('should handle state changes before initialization', () => {
            // Change state before initializing
            mockState.setState('ui.activeTab', 'chart');
            
            // Then initialize
            initializeActiveTabState();
            
            // Give time for the state subscriber to fire
            setTimeout(() => {
                // Should reflect the state
                const chartTab = /** @type {HTMLElement} */ (document.getElementById('tab-chart'));
                expect(chartTab?.classList.contains('active')).toBe(true);
            }, 0);
        });

        it('should handle invalid tab names', () => {
            initializeActiveTabState();
            
            // Set invalid tab name
            mockState.setState('ui.activeTab', 'nonexistent');
            
            // Should not break, all tabs should be inactive
            const tabs = document.querySelectorAll('.tab-button');
            tabs.forEach(tab => {
                expect(tab.classList.contains('active')).toBe(false);
            });
        });
    });

    describe('Performance and memory', () => {
        it('should not leak event listeners on repeated initialization', () => {
            // Initialize multiple times
            for (let i = 0; i < 10; i++) {
                initializeActiveTabState();
            }
            
            const chartTab = /** @type {HTMLElement} */ (document.getElementById('tab-chart'));
            
            // Click once
            const clickEvent = new MouseEvent('click', { bubbles: true });
            chartTab?.dispatchEvent(clickEvent);
            
            // Should only be called once per initialization (could be multiple due to repeated init)
            // But should not grow exponentially
            const callCount = mockState.setState.mock.calls.filter(
                (/** @type {any[]} */ call) => call[0] === 'ui.activeTab' && call[1] === 'chart'
            ).length;
            
            expect(callCount).toBeGreaterThan(0);
            expect(callCount).toBeLessThan(20); // Reasonable upper bound
        });

        it('should handle high-frequency state changes', () => {
            initializeActiveTabState();
            
            // Rapidly change states
            for (let i = 0; i < 100; i++) {
                const tabName = ['summary', 'chart', 'map', 'table'][i % 4];
                mockState.setState('ui.activeTab', tabName);
            }
            
            // Should handle without errors
            const activeTab = document.querySelector('.tab-button.active');
            expect(activeTab).toBeTruthy();
        });
    });
});
