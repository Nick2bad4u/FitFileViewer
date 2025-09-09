/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Simple Electron Mock Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Clean up require cache to ensure fresh module load
        delete require.cache[require.resolve('../../preload.js')];

        // Mock global variables
        global.window = { electronAPI: undefined } as any;
        global.process = {
            env: { NODE_ENV: 'test' },
            once: vi.fn()
        } as any;
    });

    it('should use manual mock correctly', () => {
        // Use manual mock from __mocks__ directory
        vi.mock('electron');

        // Import electron which will use the manual mock
        const { ipcRenderer, contextBridge } = require('electron');

        console.log('contextBridge:', contextBridge);
        console.log('ipcRenderer:', ipcRenderer);
        console.log('contextBridge.exposeInMainWorld:', contextBridge.exposeInMainWorld);

        expect(contextBridge).toBeDefined();
        expect(ipcRenderer).toBeDefined();
        expect(typeof contextBridge.exposeInMainWorld).toBe('function');
    });

    it('should load preload with vi.doMock', () => {
        // Use vi.doMock to ensure the mock is active before require
        vi.doMock('electron', () => ({
            ipcRenderer: {
                invoke: vi.fn().mockResolvedValue('mock-result'),
                send: vi.fn(),
                on: vi.fn(),
                once: vi.fn(),
                removeListener: vi.fn(),
                removeAllListeners: vi.fn()
            },
            contextBridge: {
                exposeInMainWorld: vi.fn()
            }
        }));

        // Now require the preload script
        require('../../preload.js');

        // Get the mocked electron modules
        const electron = require('electron');

        // Check if the mock was called
        expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalled();
    });
});
