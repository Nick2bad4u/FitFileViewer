// Manual mock for electron module
// This will be automatically used by Vitest when electron is imported

const { vi } = require('vitest');

const app = {
    getPath: vi.fn((name) => {
        const paths = {
            'userData': '/mock/path/userData',
            'appData': '/mock/path/appData',
            'temp': '/mock/path/temp',
            'desktop': '/mock/path/desktop',
            'documents': '/mock/path/documents',
            'downloads': '/mock/path/downloads',
            'music': '/mock/path/music',
            'pictures': '/mock/path/pictures',
            'videos': '/mock/path/videos',
            'home': '/mock/path/home'
        };
        return paths[name] || `/mock/path/${name}`;
    }),
    isPackaged: false,
    getVersion: vi.fn(() => '1.0.0'),
    getName: vi.fn(() => 'FitFileViewer'),
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
    quit: vi.fn()
};

const ipcRenderer = {
    invoke: vi.fn().mockResolvedValue('mock-result'),
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn()
};

const contextBridge = {
    exposeInMainWorld: vi.fn()
};

// Export for CommonJS with destructuring support
module.exports = {
    app,
    ipcRenderer,
    contextBridge
};
