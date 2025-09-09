/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock process.env for different test scenarios
const originalEnv = process.env;

describe('preload.js - Basic Test Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset process.env to a clean state
        process.env = { ...originalEnv };
        delete process.env.NODE_ENV;

        // Mock process.once for preload script
        global.process = {
            ...global.process,
            env: process.env,
            once: vi.fn()
        } as any;

        // Create fresh electron mocks for each test
        vi.doMock('electron', () => globalThis.createElectronMocks());

        // Clear the require cache for preload.js to ensure fresh loading
        const preloadPath = require.resolve('../../preload.js');
        delete require.cache[preloadPath];
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    describe('Module Loading and Basic Structure', () => {
        it('should import and execute without errors', async () => {
            // Get the mocked electron modules
            const electron = require('electron');

            // Add debug logging to see the mocking state
            console.log('Mock setup check:', {
                hasElectronMock: !!electron.ipcRenderer,
                electronMocksCreated: !!electron.ipcRenderer && !!electron.contextBridge
            });

            // Debug what require('electron') actually returns
            const electronModule = require('electron');
            console.log('Electron module structure:', {
                type: typeof electronModule,
                hasIpcRenderer: !!electronModule.ipcRenderer,
                hasContextBridge: !!electronModule.contextBridge,
                keys: Object.keys(electronModule)
            });

            // The preload script should be executable
            expect(() => {
                require('../../preload.js');
            }).not.toThrow();
        });

        it('should expose electronAPI to main world', () => {
            // Get the electron mock
            const electron = require('electron');

            require('../../preload.js');

            expect(electron.contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                'electronAPI',
                expect.any(Object)
            );
        });

        it('should validate API before exposing', () => {
            require('../../preload.js');

            // Should call exposeInMainWorld since validation should pass
            expect(require('electron').contextBridge.exposeInMainWorld).toHaveBeenCalled();
        });
    });

    describe('Constants Structure', () => {
        it('should define all required channel constants', () => {
            const preload = require('../../preload.js');

            // Access the exposed API through the mock
            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            expect(exposedAPI).toBeDefined();

            const channelInfo = exposedAPI?.getChannelInfo?.();
            expect(channelInfo).toBeDefined();
            expect(channelInfo.channels).toBeDefined();
            expect(channelInfo.events).toBeDefined();
            expect(channelInfo.totalChannels).toBeGreaterThan(0);
            expect(channelInfo.totalEvents).toBeGreaterThan(0);
        });

        it('should include all expected channel names', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const channelInfo = exposedAPI?.getChannelInfo?.();

            const expectedChannels = [
                'DIALOG_OPEN_FILE',
                'FILE_READ',
                'FIT_PARSE',
                'FIT_DECODE',
                'RECENT_FILES_GET',
                'THEME_GET',
                'APP_VERSION',
            ];

            expectedChannels.forEach(channel => {
                expect(channelInfo.channels).toHaveProperty(channel);
            });
        });

        it('should include all expected event names', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const channelInfo = exposedAPI?.getChannelInfo?.();

            const expectedEvents = [
                'MENU_OPEN_FILE',
                'SET_THEME',
                'THEME_CHANGED',
                'OPEN_SUMMARY_COLUMN_SELECTOR',
            ];

            expectedEvents.forEach(event => {
                expect(channelInfo.events).toHaveProperty(event);
            });
        });
    });

    describe('File Operations API', () => {
        it('should provide openFile method', async () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            expect(exposedAPI.openFile).toBeDefined();
            expect(typeof exposedAPI.openFile).toBe('function');
        });

        it('should handle openFile invocation', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(['test.fit']);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.openFile();

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('dialog:openFile');
            expect(result).toEqual(['test.fit']);
        });

        it('should provide openFileDialog alias', async () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            expect(exposedAPI.openFileDialog).toBeDefined();
            expect(typeof exposedAPI.openFileDialog).toBe('function');
        });

        it('should provide readFile method', async () => {
            const mockArrayBuffer = new ArrayBuffer(8);
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(mockArrayBuffer);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.readFile('test.fit');

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('file:read', 'test.fit');
            expect(result).toBe(mockArrayBuffer);
        });

        it('should handle file operation errors gracefully', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockRejectedValue(new Error('File not found'));
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];

            await expect(exposedAPI.readFile('nonexistent.fit')).rejects.toThrow('File not found');
        });
    });

    describe('FIT File Operations API', () => {
        it('should provide parseFitFile method', async () => {
            const mockData = { records: [] };
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(mockData);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.parseFitFile(arrayBuffer);

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('fit:parse', arrayBuffer);
            expect(result).toBe(mockData);
        });

        it('should provide decodeFitFile method', async () => {
            const mockData = { decoded: true };
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(mockData);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.decodeFitFile(arrayBuffer);

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('fit:decode', arrayBuffer);
            expect(result).toBe(mockData);
        });

        it('should handle FIT parsing errors', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockRejectedValue(new Error('Invalid FIT file'));
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const arrayBuffer = new ArrayBuffer(8);

            await expect(exposedAPI.parseFitFile(arrayBuffer)).rejects.toThrow('Invalid FIT file');
        });
    });

    describe('Recent Files Management', () => {
        it('should provide recentFiles method', async () => {
            const mockFiles = ['file1.fit', 'file2.fit'];
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(mockFiles);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.recentFiles();

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('recentFiles:get');
            expect(result).toBe(mockFiles);
        });

        it('should provide addRecentFile method', async () => {
            const mockFiles = ['new.fit', 'file1.fit'];
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(mockFiles);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.addRecentFile('new.fit');

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('recentFiles:add', 'new.fit');
            expect(result).toBe(mockFiles);
        });
    });

    describe('Theme Management', () => {
        it('should provide getTheme method', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue('dark');
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.getTheme();

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('theme:get');
            expect(result).toBe('dark');
        });

        it('should provide sendThemeChanged method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            exposedAPI.sendThemeChanged('light');

            expect((require(\ electron\).ipcRenderer as any).send).toHaveBeenCalledWith('theme-changed', 'light');
        });
    });

    describe('Application Information API', () => {
        it('should provide version information methods', async () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];

            expect(exposedAPI.getAppVersion).toBeDefined();
            expect(exposedAPI.getElectronVersion).toBeDefined();
            expect(exposedAPI.getNodeVersion).toBeDefined();
            expect(exposedAPI.getChromeVersion).toBeDefined();
            expect(exposedAPI.getLicenseInfo).toBeDefined();
        });

        it('should handle version retrieval', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue('1.0.0');
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.getAppVersion();

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('getAppVersion');
            expect(result).toBe('1.0.0');
        });

        it('should provide getPlatformInfo method', async () => {
            const mockPlatformInfo = { platform: 'win32', arch: 'x64' };
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(mockPlatformInfo);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.getPlatformInfo();

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('getPlatformInfo');
            expect(result).toBe(mockPlatformInfo);
        });
    });

    describe('External Browser Operations', () => {
        it('should provide openExternal method', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(true);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.openExternal('https://example.com');

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('shell:openExternal', 'https://example.com');
            expect(result).toBe(true);
        });

        it('should handle external browser errors', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockRejectedValue(new Error('Cannot open URL'));
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];

            await expect(exposedAPI.openExternal('invalid-url')).rejects.toThrow('Cannot open URL');
        });
    });

    describe('Gyazo OAuth Server Operations', () => {
        it('should provide startGyazoServer method', async () => {
            const mockResult = { success: true, port: 3000 };
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(mockResult);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.startGyazoServer(3000);

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('gyazo:server:start', 3000);
            expect(result).toBe(mockResult);
        });

        it('should provide stopGyazoServer method', async () => {
            const mockResult = { success: true };
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(mockResult);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.stopGyazoServer();

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('gyazo:server:stop');
            expect(result).toBe(mockResult);
        });
    });

    describe('Event Handler Registration', () => {
        it('should provide onMenuOpenFile method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const callback = vi.fn();

            exposedAPI.onMenuOpenFile(callback);

            expect((require(\ electron\).ipcRenderer as any).on).toHaveBeenCalledWith('menu-open-file', expect.any(Function));
        });

        it('should provide onOpenRecentFile method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const callback = vi.fn();

            exposedAPI.onOpenRecentFile(callback);

            expect((require(\ electron\).ipcRenderer as any).on).toHaveBeenCalledWith('open-recent-file', expect.any(Function));
        });

        it('should provide onSetTheme method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const callback = vi.fn();

            exposedAPI.onSetTheme(callback);

            expect((require(\ electron\).ipcRenderer as any).on).toHaveBeenCalledWith('set-theme', expect.any(Function));
        });

        it('should validate callback functions in event handlers', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];

            // Try to register with invalid callback
            exposedAPI.onMenuOpenFile('not-a-function');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] onMenuOpenFile: callback must be a function')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Auto-Updater Functions', () => {
        it('should provide onUpdateEvent method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const callback = vi.fn();

            exposedAPI.onUpdateEvent('update-available', callback);

            expect((require(\ electron\).ipcRenderer as any).on).toHaveBeenCalledWith('update-available', expect.any(Function));
        });

        it('should provide checkForUpdates method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            exposedAPI.checkForUpdates();

            expect((require(\ electron\).ipcRenderer as any).send).toHaveBeenCalledWith('menu-check-for-updates');
        });

        it('should provide installUpdate method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            exposedAPI.installUpdate();

            expect((require(\ electron\).ipcRenderer as any).send).toHaveBeenCalledWith('install-update');
        });

        it('should provide setFullScreen method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            exposedAPI.setFullScreen(true);

            expect((require(\ electron\).ipcRenderer as any).send).toHaveBeenCalledWith('set-fullscreen', true);
        });

        it('should validate parameters in onUpdateEvent', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const callback = vi.fn();

            // Try with invalid event name
            exposedAPI.onUpdateEvent(123, callback);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] onUpdateEvent: eventName must be a string or null')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Generic IPC Functions', () => {
        it('should provide onIpc method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const callback = vi.fn();

            exposedAPI.onIpc('custom-channel', callback);

            expect((require(\ electron\).ipcRenderer as any).on).toHaveBeenCalledWith('custom-channel', expect.any(Function));
        });

        it('should provide send method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            exposedAPI.send('custom-channel', 'arg1', 'arg2');

            expect((require(\ electron\).ipcRenderer as any).send).toHaveBeenCalledWith('custom-channel', 'arg1', 'arg2');
        });

        it('should provide invoke method', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue('result');
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.invoke('custom-channel', 'arg1');

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith('custom-channel', 'arg1');
            expect(result).toBe('result');
        });

        it('should validate channel parameter in generic IPC methods', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];

            // Try with invalid channel
            exposedAPI.send(123, 'data');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] send: channel must be a string or null')
            );

            consoleSpy.mockRestore();
        });

        it('should handle invoke errors properly', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockRejectedValue(new Error('IPC Error'));
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];

            await expect(exposedAPI.invoke('failing-channel')).rejects.toThrow('IPC Error');
        });

        it('should reject invoke with invalid channel', async () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];

            await expect(exposedAPI.invoke(123 as any)).rejects.toThrow('Invalid channel for invoke');
        });
    });

    describe('Development Tools', () => {
        it('should provide injectMenu method', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(true);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.injectMenu('dark', '/path/to/file.fit');

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith(
                'devtools-inject-menu',
                'dark',
                '/path/to/file.fit'
            );
            expect(result).toBe(true);
        });

        it('should handle injectMenu with default parameters', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockResolvedValue(true);
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.injectMenu();

            expect((require(\ electron\).ipcRenderer as any).invoke).toHaveBeenCalledWith(
                'devtools-inject-menu',
                null,
                null
            );
            expect(result).toBe(true);
        });

        it('should handle injectMenu errors gracefully', async () => {
            (require(\ electron\).ipcRenderer as any).invoke.mockRejectedValue(new Error('Menu injection failed'));
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.injectMenu('dark');

            expect(result).toBe(false);
        });

        it('should validate parameters in injectMenu', async () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = await exposedAPI.injectMenu(123 as any);

            expect(result).toBe(false);
        });
    });

    describe('Debugging and Validation', () => {
        it('should provide validateAPI method', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = exposedAPI.validateAPI();

            expect(result).toBe(true);
        });

        it('should handle validateAPI failures', () => {
            // Mock missing dependencies
            const originalIpcRenderer = (require(\ electron\).ipcRenderer as any);

            // Temporarily remove ipcRenderer
            vi.mocked(require('electron')).ipcRenderer = undefined as any;

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const result = exposedAPI.validateAPI();

            expect(result).toBe(false);

            // Restore
            vi.mocked(require('electron')).ipcRenderer = originalIpcRenderer;
            consoleSpy.mockRestore();
        });

        it('should provide getChannelInfo with complete information', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo).toMatchObject({
                channels: expect.any(Object),
                events: expect.any(Object),
                totalChannels: expect.any(Number),
                totalEvents: expect.any(Number),
            });

            expect(channelInfo.totalChannels).toBeGreaterThan(0);
            expect(channelInfo.totalEvents).toBeGreaterThan(0);
        });
    });

    describe('Development Mode Features', () => {
        it('should expose development tools in development mode', () => {
            process.env.NODE_ENV = 'development';

            require('../../preload.js');

            // Should expose both electronAPI and devTools
            expect((require(\ electron\).contextBridge.exposeInMainWorld as any)).toHaveBeenCalledWith(
                'electronAPI',
                expect.any(Object)
            );
            expect((require(\ electron\).contextBridge.exposeInMainWorld as any)).toHaveBeenCalledWith(
                'devTools',
                expect.any(Object)
            );
        });

        it('should not expose development tools in production mode', () => {
            process.env.NODE_ENV = 'production';

            require('../../preload.js');

            // Should only expose electronAPI
            expect((require(\ electron\).contextBridge.exposeInMainWorld as any)).toHaveBeenCalledTimes(1);
            expect((require(\ electron\).contextBridge.exposeInMainWorld as any)).toHaveBeenCalledWith(
                'electronAPI',
                expect.any(Object)
            );
        });

        it('should handle development tools exposure errors', () => {
            process.env.NODE_ENV = 'development';

            // Mock contextBridge.exposeInMainWorld to fail on second call
            (require(\ electron\).contextBridge.exposeInMainWorld as any).mockImplementationOnce(() => {})
                .mockImplementationOnce(() => {
                    throw new Error('Failed to expose devTools');
                });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                require('../../preload.js');
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] Failed to expose development tools:'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle contextBridge exposure failures', () => {
            (require(\ electron\).contextBridge.exposeInMainWorld as any).mockImplementation(() => {
                throw new Error('contextBridge failed');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                require('../../preload.js');
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] Failed to expose electronAPI:'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it('should handle event listener callback errors', () => {
            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            const faultyCallback = () => {
                throw new Error('Callback error');
            };

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            exposedAPI.onMenuOpenFile(faultyCallback);

            // Simulate the event handler being called
            const eventHandler = (require(\ electron\).ipcRenderer as any).on.mock.calls[0]?.[1];
            expect(() => {
                eventHandler({}, 'someData');
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] Error in onMenuOpenFile callback:'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it('should handle event handler setup errors', () => {
            (require(\ electron\).ipcRenderer as any).on.mockImplementation(() => {
                throw new Error('Event setup failed');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];
            exposedAPI.onMenuOpenFile(() => {});

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] Error setting up onMenuOpenFile event handler:'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it('should handle send operation errors', () => {
            (require(\ electron\).ipcRenderer as any).send.mockImplementation(() => {
                throw new Error('Send failed');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            require('../../preload.js');

            const exposedAPI = (require(\ electron\).contextBridge.exposeInMainWorld as any).mock.calls[0]?.[1];

            expect(() => {
                exposedAPI.sendThemeChanged('dark');
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[preload.js] Error in sendThemeChanged:'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Process Lifecycle', () => {
        it('should handle process exit cleanup', () => {
            const processOnce = vi.spyOn(process, 'once');

            require('../../preload.js');

            expect(processOnce).toHaveBeenCalledWith('beforeExit', expect.any(Function));
        });

        it('should log successful initialization', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            require('../../preload.js');

            expect(consoleSpy).toHaveBeenCalledWith(
                '[preload.js] Preload script initialized successfully'
            );

            consoleSpy.mockRestore();
        });
    });
});
