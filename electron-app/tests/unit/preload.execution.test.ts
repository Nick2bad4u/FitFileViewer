/**
 * @file preload.execution.test.ts
 * @description Test file that actually imports and executes preload.js for real coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mocks before any imports
const mockContextBridge = {
    exposeInMainWorld: vi.fn()
};

const mockIpcRenderer = {
    invoke: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn()
};

// Mock the electron module BEFORE any requires
vi.mock('electron', () => ({
    contextBridge: mockContextBridge,
    ipcRenderer: mockIpcRenderer
}));

describe('preload.js - Actual File Execution', () => {
    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Set up process.env for different test scenarios
        process.env.NODE_ENV = 'development';

        // Provide hoisted override so modules that resolve lazily see our mock
        ;(globalThis as any).__electronHoistedMock = {
            contextBridge: mockContextBridge,
            ipcRenderer: mockIpcRenderer,
        };

        // Mock console methods to verify logging
        global.console = {
            ...console,
            log: vi.fn(),
            error: vi.fn()
        };
    });

    afterEach(() => {
        // Clean up module cache to allow re-import in different test scenarios
        vi.resetModules();

        // Reset environment
        delete process.env.NODE_ENV;

        // Remove hoisted override
        delete (globalThis as any).__electronHoistedMock;
    });

    describe('Development Mode Execution', () => {
        it('should execute preload.js and expose electronAPI in development mode', async () => {
            // Set development mode
            process.env.NODE_ENV = 'development';

            // Add debug logging
            console.log('Before requiring preload.js');
            console.log('mockContextBridge.exposeInMainWorld calls before require:', mockContextBridge.exposeInMainWorld.mock.calls.length);

            // Import the preload.js file to execute it (ensures vi.mock is applied)
            await import('../../preload.js');

            console.log('After requiring preload.js');
            console.log('mockContextBridge.exposeInMainWorld calls after require:', mockContextBridge.exposeInMainWorld.mock.calls.length);
            console.log('All mock calls:', mockContextBridge.exposeInMainWorld.mock.calls);

            // Check if exposeInMainWorld was called at all
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalled();

            // Verify contextBridge.exposeInMainWorld was called for electronAPI
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                'electronAPI',
                expect.objectContaining({
                    // Verify key API methods exist
                    addRecentFile: expect.any(Function),
                    getAppVersion: expect.any(Function),
                    openFileDialog: expect.any(Function),
                    parseFitFile: expect.any(Function),
                    getTheme: expect.any(Function),
                    validateAPI: expect.any(Function),
                    getChannelInfo: expect.any(Function)
                })
            );

            // Verify devTools was also exposed in development mode
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                'devTools',
                expect.objectContaining({
                    getPreloadInfo: expect.any(Function),
                    logAPIState: expect.any(Function),
                    testIPC: expect.any(Function)
                })
            );

            // Verify development logging occurred
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] Successfully exposed electronAPI to main world')
            );
        });

        it('should provide working API methods when executed', async () => {
            process.env.NODE_ENV = 'development';

            // Import preload.js so mocks are honored
            await import('../../preload.js');

            // Get the exposed electronAPI from the mock call
            const exposeMainWorldCalls = mockContextBridge.exposeInMainWorld.mock.calls;
            const electronAPICall = exposeMainWorldCalls.find(call => call[0] === 'electronAPI');
            expect(electronAPICall).toBeDefined();

            const electronAPI = electronAPICall![1];

            // Test validateAPI method
            expect(electronAPI.validateAPI()).toBe(true);

            // Test getChannelInfo method
            const channelInfo = electronAPI.getChannelInfo();
            expect(channelInfo).toHaveProperty('channels');
            expect(channelInfo).toHaveProperty('events');
            expect(channelInfo).toHaveProperty('totalChannels');
            expect(channelInfo).toHaveProperty('totalEvents');
            expect(typeof channelInfo.totalChannels).toBe('number');
            expect(channelInfo.totalChannels).toBeGreaterThan(0);
        });

        it('should handle IPC invoke methods correctly', async () => {
            process.env.NODE_ENV = 'development';

            // Mock successful IPC response
            mockIpcRenderer.invoke.mockResolvedValue('test-result');

            await import('../../preload.js');

            const exposeMainWorldCalls = mockContextBridge.exposeInMainWorld.mock.calls;
            const electronAPICall = exposeMainWorldCalls.find(call => call[0] === 'electronAPI');
            const electronAPI = electronAPICall![1];

            // Test an invoke-based method
            const result = await electronAPI.getAppVersion();
            expect(result).toBe('test-result');
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('getAppVersion');
        });
    });

    describe('Production Mode Execution', () => {
        it('should execute preload.js in production mode without devTools', async () => {
            // Set production mode
            process.env.NODE_ENV = 'production';

            await import('../../preload.js');

            // Verify electronAPI was exposed
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                'electronAPI',
                expect.any(Object)
            );

            // Verify devTools was NOT exposed in production
            const devToolsCall = mockContextBridge.exposeInMainWorld.mock.calls
                .find(call => call[0] === 'devTools');
            expect(devToolsCall).toBeUndefined();
        });
    });
});
