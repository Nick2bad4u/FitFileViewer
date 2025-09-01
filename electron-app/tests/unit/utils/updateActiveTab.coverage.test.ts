import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Test for uncovered lines in updateActiveTab.js
describe('updateActiveTab.js - Coverage Completion', () => {
    let mockWindow: any;
    let mockDocument: any;
    let mockSubscribe: any;
    let mockSetState: any;
    let mockGetState: any;

    beforeEach(() => {
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        mockWindow = dom.window;
        mockDocument = dom.window.document;

        (global as any).window = mockWindow;
        (global as any).document = mockDocument;

        // Mock stateManager to capture the subscribe callback
        mockSubscribe = vi.fn();
        mockSetState = vi.fn();
        mockGetState = vi.fn(() => 'summary');

        vi.doMock('../../../utils/state/core/stateManager.js', () => ({
            setState: mockSetState,
            getState: mockGetState,
            subscribe: mockSubscribe
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    describe('Uncovered line coverage tests', () => {
        test('should cover defensive checks in updateTabButtonsFromState via state subscription (lines 135-137, 142-144)', async () => {
            const { initializeActiveTabState } = await import('../../../utils/ui/tabs/updateActiveTab.js');

            // Mock console.warn to capture warnings
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Initialize the state management to set up subscriptions
            initializeActiveTabState();

            // Get the subscription callback that was registered
            expect(mockSubscribe).toHaveBeenCalled();
            const subscriptionCall = mockSubscribe.mock.calls.find((call: any[]) => call[0] === 'ui.activeTab');
            expect(subscriptionCall).toBeTruthy();

            const stateCallback = subscriptionCall[1];

            // Test case 1: No tab buttons in DOM (lines 135-137)
            // Clear DOM to ensure no tab buttons exist
            mockDocument.body.innerHTML = '';

            // Trigger the state callback
            stateCallback('summary');

            // Should warn about no tab buttons found
            expect(warnSpy).toHaveBeenCalledWith(
                'updateTabButtonsFromState: No tab buttons found in DOM.'
            );

            // Test case 2: Invalid button elements (lines 142-144)
            // Create a malformed element that will trigger the defensive check
            const mockButton = {
                id: 'tab-summary',
                // Missing classList property to trigger the defensive check
            };

            // Mock querySelectorAll to return our malformed element
            const originalQuerySelectorAll = mockDocument.querySelectorAll;
            mockDocument.querySelectorAll = vi.fn(() => [mockButton]);

            // Trigger the state callback again
            stateCallback('summary');

            // Should warn about invalid button element
            expect(warnSpy).toHaveBeenCalledWith(
                'updateTabButtonsFromState: Invalid button element found:',
                mockButton
            );

            // Restore original querySelectorAll
            mockDocument.querySelectorAll = originalQuerySelectorAll;

            warnSpy.mockRestore();
        });

        test('should handle null button elements in state callback', async () => {
            const { initializeActiveTabState } = await import('../../../utils/ui/tabs/updateActiveTab.js');

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Initialize the state management
            initializeActiveTabState();

            // Get the subscription callback
            const subscriptionCall = mockSubscribe.mock.calls.find((call: any[]) => call[0] === 'ui.activeTab');
            const stateCallback = subscriptionCall[1];

            // Mock querySelectorAll to return an array with null elements
            const originalQuerySelectorAll = mockDocument.querySelectorAll;
            mockDocument.querySelectorAll = vi.fn(() => [null, undefined]);

            // Trigger the state callback
            stateCallback('summary');

            // Should warn about invalid button elements
            expect(warnSpy).toHaveBeenCalledWith(
                'updateTabButtonsFromState: Invalid button element found:',
                null
            );
            expect(warnSpy).toHaveBeenCalledWith(
                'updateTabButtonsFromState: Invalid button element found:',
                undefined
            );

            // Restore original querySelectorAll
            mockDocument.querySelectorAll = originalQuerySelectorAll;

            warnSpy.mockRestore();
        });

        test('should handle buttons without classList property in state callback', async () => {
            const { initializeActiveTabState } = await import('../../../utils/ui/tabs/updateActiveTab.js');

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Initialize the state management
            initializeActiveTabState();

            // Get the subscription callback
            const subscriptionCall = mockSubscribe.mock.calls.find((call: any[]) => call[0] === 'ui.activeTab');
            const stateCallback = subscriptionCall[1];

            // Create a button-like object without classList
            const buttonWithoutClassList = {
                id: 'tab-chart',
                // classList is undefined/missing
            };

            // Mock querySelectorAll to return this malformed button
            const originalQuerySelectorAll = mockDocument.querySelectorAll;
            mockDocument.querySelectorAll = vi.fn(() => [buttonWithoutClassList]);

            // Trigger the state callback
            stateCallback('chart');

            // Should warn about invalid button element
            expect(warnSpy).toHaveBeenCalledWith(
                'updateTabButtonsFromState: Invalid button element found:',
                buttonWithoutClassList
            );

            // Restore original querySelectorAll
            mockDocument.querySelectorAll = originalQuerySelectorAll;

            warnSpy.mockRestore();
        });
    });
});
