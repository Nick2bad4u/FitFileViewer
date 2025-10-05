/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupTheme } from '../../../../../utils/theming/core/setupTheme.js';

describe('setupTheme', () => {
    /** @type {import('vitest').Mock} */
    let applyThemeMock;
    /** @type {import('vitest').Mock} */
    let listenForThemeChangeMock;

    beforeEach(() => {
        applyThemeMock = vi.fn();
        listenForThemeChangeMock = vi.fn();
        localStorage.clear();
        delete /** @type {any} */(globalThis).electronAPI;

        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Basic Functionality', () => {
        it('should setup theme with electronAPI', async () => {
            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('dark');
            expect(applyThemeMock).toHaveBeenCalledWith('dark');
            expect(getTheme).toHaveBeenCalled();
        });

        it('should use fallback theme when electronAPI not available', async () => {
            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('dark');
            expect(applyThemeMock).toHaveBeenCalledWith('dark');
        });

        it('should use custom fallback theme when all sources fail', async () => {
            // Make localStorage throw an error
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('Storage error');
            });

            const getTheme = vi.fn().mockResolvedValue('invalid-theme');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock, undefined, { fallbackTheme: 'light' });

            expect(theme).toBe('light');
            expect(applyThemeMock).toHaveBeenCalledWith('light');
        });
    });

    describe('Theme Sources', () => {
        it('should prefer theme from main process over localStorage', async () => {
            localStorage.setItem('fitFileViewer_theme', 'light');
            const getTheme = vi.fn().mockResolvedValue('auto'); // Use non-default theme
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('auto');
        });

        it('should use localStorage when main process fails', async () => {
            localStorage.setItem('fitFileViewer_theme', 'light');
            const getTheme = vi.fn().mockRejectedValue(new Error('Failed'));
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('light');
            expect(applyThemeMock).toHaveBeenCalledWith('light');
        });

        it('should handle localStorage read errors', async () => {
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('Storage error');
            });

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('dark');
            expect(console.warn).toHaveBeenCalled();
        });
    });

    describe('Theme Validation', () => {
        it('should accept valid themes', async () => {
            const getTheme = vi.fn().mockResolvedValue('light');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('light');
        });

        it('should reject invalid themes', async () => {
            const getTheme = vi.fn().mockResolvedValue('invalid-theme');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('dark'); // Should fall back to default
            expect(console.warn).toHaveBeenCalled();
        });

        it('should handle auto theme', async () => {
            const getTheme = vi.fn().mockResolvedValue('auto');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('auto');
            expect(applyThemeMock).toHaveBeenCalledWith('auto');
        });
    });

    describe('Theme Change Listener', () => {
        it('should setup theme change listener', async () => {
            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            await setupTheme(applyThemeMock, listenForThemeChangeMock);

            expect(listenForThemeChangeMock).toHaveBeenCalled();
        });

        it('should apply theme changes from listener', async () => {
            let themeCallback;
            listenForThemeChangeMock.mockImplementation((callback) => {
                themeCallback = callback;
            });

            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            await setupTheme(applyThemeMock, listenForThemeChangeMock);

            applyThemeMock.mockClear();

			/** @type {any} */(themeCallback)('light');

            expect(applyThemeMock).toHaveBeenCalledWith('light');
        });

        it('should work without theme change listener', async () => {
            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('dark');
        });
    });

    describe('LocalStorage Persistence', () => {
        it('should store theme in localStorage', async () => {
            const getTheme = vi.fn().mockResolvedValue('light');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            await setupTheme(applyThemeMock);

            expect(localStorage.getItem('fitFileViewer_theme')).toBe('light');
        });

        it('should handle localStorage write errors', async () => {
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('Storage error');
            });

            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            await setupTheme(applyThemeMock);

            expect(console.warn).toHaveBeenCalled();
            expect(applyThemeMock).toHaveBeenCalled(); // Should still apply theme
        });

        it('should skip localStorage read when useLocalStorage is false', async () => {
            localStorage.setItem('fitFileViewer_theme', 'light');
            const getTheme = vi.fn().mockResolvedValue('dark'); // Returns default
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock, undefined, { useLocalStorage: false });

            // Should use theme from main process, not localStorage
            expect(theme).toBe('dark');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid applyTheme function', async () => {
            const theme = await setupTheme(/** @type {any} */('not-a-function'));

            expect(theme).toBe('dark');
            expect(console.error).toHaveBeenCalled();
        });

        it('should handle errors in applyTheme function', async () => {
            applyThemeMock.mockImplementation(() => {
                throw new Error('Apply theme error');
            });

            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock);

            expect(theme).toBe('dark');
        });

        it('should handle timeout when fetching theme', async () => {
            vi.useFakeTimers();

            const getTheme = vi.fn().mockImplementation(() => new Promise(() => { })); // Never resolves
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const themePromise = setupTheme(applyThemeMock);

            vi.advanceTimersByTime(6000); // Advance past timeout

            const theme = await themePromise;

            expect(theme).toBe('dark'); // Should use default
            expect(console.warn).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should handle errors in theme change listener setup', async () => {
            listenForThemeChangeMock.mockImplementation(() => {
                throw new Error('Listener error');
            });

            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            const theme = await setupTheme(applyThemeMock, listenForThemeChangeMock);

            expect(theme).toBe('dark');
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Logging', () => {
        it('should log theme initialization', async () => {
            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            await setupTheme(applyThemeMock);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('[ThemeSetup] Initializing theme setup')
            );
        });

        it('should log successful completion', async () => {
            const getTheme = vi.fn().mockResolvedValue('dark');
			/** @type {any} */(globalThis).electronAPI = { getTheme };

            await setupTheme(applyThemeMock);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Theme setup completed successfully with theme: dark')
            );
        });

        it('should log warnings for issues', async () => {
            await setupTheme(applyThemeMock);

            expect(console.warn).toHaveBeenCalled();
        });
    });
});
