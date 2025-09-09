/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use manual mock from __mocks__ directory
vi.mock('electron');

// Import electron which will use the manual mock
import { ipcRenderer, contextBridge } from 'electron';

describe('Simple Electron Mock Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Clean up require cache to ensure fresh module load
        delete require.cache[require.resolve('../../preload.js')];

        // Mock global variables
        global.window = { electronAPI: undefined } as any;
        global.process = { env: { NODE_ENV: 'test' } } as any;
    });

    it('should use manual mock correctly', () => {
        console.log('contextBridge:', contextBridge);
        console.log('ipcRenderer:', ipcRenderer);
        console.log('contextBridge.exposeInMainWorld:', contextBridge.exposeInMainWorld);

        expect(contextBridge).toBeDefined();
        expect(ipcRenderer).toBeDefined();
        expect(typeof contextBridge.exposeInMainWorld).toBe('function');
    });

    it('should load preload and use mocks', () => {
        // Require the preload script
        require('../../preload.js');

        // Check if the mock was called
        expect(contextBridge.exposeInMainWorld).toHaveBeenCalled();
    });
});
