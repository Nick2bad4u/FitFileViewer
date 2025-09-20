import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('preload.js - Comprehensive API Testing', () => {
    let electronMock: any;
    let consoleLogSpy: any;
    let consoleErrorSpy: any;
    let mockProcess: any;

    beforeEach(() => {
        // Reset everything completely
        vi.resetAllMocks();
        vi.resetModules();
        vi.clearAllMocks();

        // Create comprehensive electron mock
        electronMock = {
            ipcRenderer: {
                invoke: vi.fn().mockImplementation((channel: string, ...args: any[]) => {
                    switch (channel) {
                        case 'getAppVersion':
                            return Promise.resolve('1.0.0');
                        case 'getChromeVersion':
                            return Promise.resolve('chrome-version');
                        case 'getElectronVersion':
                            return Promise.resolve('electron-version');
                        case 'getNodeVersion':
                            return Promise.resolve('node-version');
                        case 'getPlatformInfo':
                            return Promise.resolve({ platform: 'win32' });
                        case 'theme:get':
                            return Promise.resolve('dark');
                        case 'recentFiles:get':
                            return Promise.resolve(['file1.fit', 'file2.fit']);
                        case 'fit:decode':
                            return Promise.resolve('decoded-data');
                        case 'fit:parse':
                            return Promise.resolve('parsed-data');
                        case 'file:read':
                            return Promise.resolve('file-content');
                        case 'dialog:openFile':
                            return Promise.resolve(['file1.fit']);
                        case 'recentFiles:add':
                            return Promise.resolve();
                        case 'checkForUpdates':
                            return Promise.resolve(true);
                        case 'installUpdate':
                            return Promise.resolve(true);
                        case 'setFullScreen':
                            return Promise.resolve();
                        case 'sendThemeChanged':
                            return Promise.resolve();
                        case 'shell:openExternal':
                            return Promise.resolve();
                        default:
                            return Promise.resolve('default-mock');
                    }
                }),
                send: vi.fn(),
                on: vi.fn(),
                removeAllListeners: vi.fn()
            },
            contextBridge: {
                exposeInMainWorld: vi.fn()
            }
        };

        // Mock console methods
        consoleLogSpy = vi.spyOn(console, 'log');
        consoleErrorSpy = vi.spyOn(console, 'error');

        // Mock process object
        mockProcess = {
            env: { NODE_ENV: 'development' },
            once: vi.fn()
        };
        vi.stubGlobal('process', mockProcess);

        // Load and execute preload script
        const preloadPath = path.resolve(__dirname, '../../preload.js');
        const preloadCode = fs.readFileSync(preloadPath, 'utf-8');

        const mockRequire = vi.fn().mockImplementation((module: string) => {
            if (module === 'electron') {
                return electronMock;
            }
            throw new Error(`Unknown module: ${module}`);
        });

        // Execute the preload script
        const scriptFunc = new Function('require', 'console', 'process', 'globalThis', preloadCode);
        scriptFunc(mockRequire, console, mockProcess, globalThis);
    });

    describe('API Exposure', () => {
        it('should expose electronAPI to main world', () => {
            expect(electronMock.contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                'electronAPI',
                expect.any(Object)
            );
        });

        it('should expose devTools to main world', () => {
            expect(electronMock.contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                'devTools',
                expect.any(Object)
            );
        });

        it('should expose exactly 2 APIs', () => {
            expect(electronMock.contextBridge.exposeInMainWorld).toHaveBeenCalledTimes(2);
        });

        it('should expose electronAPI with all expected methods', () => {
            const electronAPICall = electronMock.contextBridge.exposeInMainWorld.mock.calls
                .find((call: any) => call[0] === 'electronAPI');

            expect(electronAPICall).toBeDefined();

            const electronAPI = electronAPICall[1];

            // Test core methods
            expect(electronAPI).toHaveProperty('getAppVersion');
            expect(electronAPI).toHaveProperty('getChromeVersion');
            expect(electronAPI).toHaveProperty('getElectronVersion');
            expect(electronAPI).toHaveProperty('getNodeVersion');
            expect(electronAPI).toHaveProperty('getPlatformInfo');
            expect(electronAPI).toHaveProperty('getTheme');
            expect(electronAPI).toHaveProperty('getLicenseInfo');
            expect(electronAPI).toHaveProperty('getChannelInfo');

            // Test file operations
            expect(electronAPI).toHaveProperty('openFile');
            expect(electronAPI).toHaveProperty('openFileDialog');
            expect(electronAPI).toHaveProperty('readFile');
            expect(electronAPI).toHaveProperty('recentFiles');
            expect(electronAPI).toHaveProperty('addRecentFile');

            // Test FIT file operations
            expect(electronAPI).toHaveProperty('decodeFitFile');
            expect(electronAPI).toHaveProperty('parseFitFile');

            // Test IPC operations
            expect(electronAPI).toHaveProperty('invoke');
            expect(electronAPI).toHaveProperty('send');
            expect(electronAPI).toHaveProperty('onIpc');

            // Test menu operations
            expect(electronAPI).toHaveProperty('injectMenu');
            expect(electronAPI).toHaveProperty('onMenuOpenFile');
            expect(electronAPI).toHaveProperty('onOpenRecentFile');
            expect(electronAPI).toHaveProperty('onOpenSummaryColumnSelector');

            // Test theme operations
            expect(electronAPI).toHaveProperty('onSetTheme');
            expect(electronAPI).toHaveProperty('sendThemeChanged');

            // Test update operations
            expect(electronAPI).toHaveProperty('checkForUpdates');
            expect(electronAPI).toHaveProperty('installUpdate');
            expect(electronAPI).toHaveProperty('onUpdateEvent');

            // Test window operations
            expect(electronAPI).toHaveProperty('setFullScreen');
            expect(electronAPI).toHaveProperty('openExternal');

            // Test Gyazo operations
            expect(electronAPI).toHaveProperty('startGyazoServer');
            expect(electronAPI).toHaveProperty('stopGyazoServer');

            // Test validation
            expect(electronAPI).toHaveProperty('validateAPI');
        });
    });

    describe('API Method Functionality', () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall = electronMock.contextBridge.exposeInMainWorld.mock.calls
                .find((call: any) => call[0] === 'electronAPI');
            electronAPI = electronAPICall[1];
        });

        it('should handle getAppVersion correctly', async () => {
            const result = await electronAPI.getAppVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('getAppVersion');
            expect(result).toBe('1.0.0');
        });

        it('should handle getChromeVersion correctly', async () => {
            const result = await electronAPI.getChromeVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('getChromeVersion');
            expect(result).toBe('chrome-version');
        });

        it('should handle getElectronVersion correctly', async () => {
            const result = await electronAPI.getElectronVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('getElectronVersion');
            expect(result).toBe('electron-version');
        });

        it('should handle getNodeVersion correctly', async () => {
            const result = await electronAPI.getNodeVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('getNodeVersion');
            expect(result).toBe('node-version');
        });

        it('should handle getPlatformInfo correctly', async () => {
            const result = await electronAPI.getPlatformInfo();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('getPlatformInfo');
            expect(result).toEqual({ platform: 'win32' });
        });

        it('should handle getTheme correctly', async () => {
            const result = await electronAPI.getTheme();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('theme:get');
            expect(result).toBe('dark');
        });

        it('should handle recentFiles correctly', async () => {
            const result = await electronAPI.recentFiles();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('recentFiles:get');
            expect(result).toEqual(['file1.fit', 'file2.fit']);
        });

        it('should handle addRecentFile correctly', async () => {
            await electronAPI.addRecentFile('/path/to/file.fit');
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('recentFiles:add', '/path/to/file.fit');
        });

        it('should handle openFileDialog correctly', async () => {
            electronAPI.openFileDialog();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('dialog:openFile');
        });

        it('should handle readFile correctly', async () => {
            const result = await electronAPI.readFile('/path/to/file');
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('file:read', '/path/to/file');
            expect(result).toBe('file-content');
        });

        it('should handle decodeFitFile correctly', async () => {
            const result = await electronAPI.decodeFitFile('/path/to/file.fit');
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('fit:decode', '/path/to/file.fit');
            expect(result).toBe('decoded-data');
        });

        it('should handle parseFitFile correctly', async () => {
            const fileBuffer = new ArrayBuffer(8);
            const result = await electronAPI.parseFitFile(fileBuffer);
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('fit:parse', fileBuffer);
            expect(result).toBe('parsed-data');
        });

        it('should handle send correctly', () => {
            electronAPI.send('test-channel', { data: 'test' });
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith('test-channel', { data: 'test' });
        });

        it('should handle invoke correctly', async () => {
            await electronAPI.invoke('test-channel', 'arg1', 'arg2');
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('test-channel', 'arg1', 'arg2');
        });

        it('should handle onIpc correctly', () => {
            const callback = vi.fn();
            electronAPI.onIpc('test-channel', callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith('test-channel', expect.any(Function));
        });

        it('should handle checkForUpdates correctly', () => {
            electronAPI.checkForUpdates();
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith('menu-check-for-updates');
        });

        it('should handle installUpdate correctly', () => {
            electronAPI.installUpdate();
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith('install-update');
        });

        it('should handle setFullScreen correctly', () => {
            electronAPI.setFullScreen(true);
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith('set-fullscreen', true);
        });

        it('should handle openExternal correctly', async () => {
            await electronAPI.openExternal('https://example.com');
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('shell:openExternal', 'https://example.com');
        });

        it('should handle sendThemeChanged correctly', () => {
            electronAPI.sendThemeChanged('dark');
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith('theme-changed', 'dark');
        });
    });

    describe('Event Handlers', () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall = electronMock.contextBridge.exposeInMainWorld.mock.calls
                .find((call: any) => call[0] === 'electronAPI');
            electronAPI = electronAPICall[1];
        });

        it('should register onMenuOpenFile handler', () => {
            const callback = vi.fn();
            electronAPI.onMenuOpenFile(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith('menu-open-file', expect.any(Function));
        });

        it('should register onOpenRecentFile handler', () => {
            const callback = vi.fn();
            electronAPI.onOpenRecentFile(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith('open-recent-file', expect.any(Function));
        });

        it('should register onSetTheme handler', () => {
            const callback = vi.fn();
            electronAPI.onSetTheme(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith('set-theme', expect.any(Function));
        });

        it('should register onUpdateEvent handler', () => {
            const callback = vi.fn();
            electronAPI.onUpdateEvent('update-event', callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith('update-event', expect.any(Function));
        });

        it('should register onOpenSummaryColumnSelector handler', () => {
            const callback = vi.fn();
            electronAPI.onOpenSummaryColumnSelector(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith('open-summary-column-selector', expect.any(Function));
        });
    });

    describe('CONSTANTS Exposure', () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall = electronMock.contextBridge.exposeInMainWorld.mock.calls
                .find((call: any) => call[0] === 'electronAPI');
            electronAPI = electronAPICall[1];
        });

        it('should expose getChannelInfo method', () => {
            expect(electronAPI).toHaveProperty('getChannelInfo');
            expect(typeof electronAPI.getChannelInfo).toBe('function');
        });

        it('should return channel info with proper structure', () => {
            const channelInfo = electronAPI.getChannelInfo();
            expect(channelInfo).toHaveProperty('channels');
            expect(channelInfo).toHaveProperty('events');
            expect(channelInfo).toHaveProperty('totalChannels');
            expect(channelInfo).toHaveProperty('totalEvents');
            expect(typeof channelInfo.channels).toBe('object');
            expect(typeof channelInfo.events).toBe('object');
            expect(typeof channelInfo.totalChannels).toBe('number');
            expect(typeof channelInfo.totalEvents).toBe('number');
        });

        it('should include expected channel names', () => {
            const channelInfo = electronAPI.getChannelInfo();
            expect(channelInfo.channels).toHaveProperty('APP_VERSION', 'getAppVersion');
            expect(channelInfo.channels).toHaveProperty('THEME_GET', 'theme:get');
            expect(channelInfo.channels).toHaveProperty('FILE_READ', 'file:read');
        });
    });

    describe('Development Tools', () => {
        it('should expose devTools in development mode', () => {
            const devToolsCall = electronMock.contextBridge.exposeInMainWorld.mock.calls
                .find((call: any) => call[0] === 'devTools');

            expect(devToolsCall).toBeDefined();
            expect(devToolsCall[1]).toHaveProperty('getPreloadInfo');
            expect(devToolsCall[1]).toHaveProperty('logAPIState');
            expect(devToolsCall[1]).toHaveProperty('testIPC');
            expect(typeof devToolsCall[1].getPreloadInfo).toBe('function');
            expect(typeof devToolsCall[1].logAPIState).toBe('function');
            expect(typeof devToolsCall[1].testIPC).toBe('function');
        });
    });

    describe('Process Integration', () => {
        it('should register beforeExit handler', () => {
            expect(mockProcess.once).toHaveBeenCalledWith('beforeExit', expect.any(Function));
        });

        it('should log cleanup message on beforeExit', () => {
            // Get the beforeExit callback
            const beforeExitCall = mockProcess.once.mock.calls.find((call: any) => call[0] === 'beforeExit');
            expect(beforeExitCall).toBeDefined();

            const beforeExitCallback = beforeExitCall[1];

            // Execute the callback
            beforeExitCallback();

            // Should log cleanup message
            const cleanupLogs = consoleLogSpy.mock.calls.filter((call: any) =>
                call[0] && call[0].includes('[preload.js] Process exiting, performing cleanup...')
            );

            expect(cleanupLogs.length).toBeGreaterThan(0);
        });
    });

    describe('Validation & Logging', () => {
        it('should log API validation results', () => {
            const validationLogs = consoleLogSpy.mock.calls.filter((call: any) =>
                call[0] && call[0].includes('[preload.js] API Validation:')
            );

            expect(validationLogs.length).toBeGreaterThan(0);
        });

        it('should log successful API exposure', () => {
            const exposureLogs = consoleLogSpy.mock.calls.filter((call: any) =>
                call[0] && call[0].includes('[preload.js] Successfully exposed')
            );

            expect(exposureLogs.length).toBeGreaterThan(0);
        });

        it('should log initialization completion', () => {
            const initLogs = consoleLogSpy.mock.calls.filter((call: any) =>
                call[0] && call[0].includes('[preload.js] Preload script initialized')
            );

            expect(initLogs.length).toBeGreaterThan(0);
        });

        it('should validate API structure', () => {
            const structureLogs = consoleLogSpy.mock.calls.filter((call: any) =>
                call[0] && call[0].includes('[preload.js] API Structure:')
            );

            expect(structureLogs.length).toBeGreaterThan(0);
        });
    });
});
