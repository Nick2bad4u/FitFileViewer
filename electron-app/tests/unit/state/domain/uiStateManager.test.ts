/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';

// Mock AppActions
vi.mock('../../../../utils/app/lifecycle/appActions.js', () => ({
    AppActions: {
        switchTab: vi.fn(),
        switchTheme: vi.fn(),
        toggleChartControls: vi.fn(),
        toggleMeasurementMode: vi.fn()
    }
}));

// Mock showNotification
vi.mock('../../../../utils/ui/notifications/showNotification.js', () => ({
    showNotification: vi.fn()
}));

// Mock state manager
vi.mock('../../../../utils/state/core/stateManager.js', () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
    updateState: vi.fn()
}));

// Import the modules after mocks are set up
import { UIStateManager, uiStateManager, UIActions } from '../../../../utils/state/domain/uiStateManager.js';
import { AppActions } from '../../../../utils/app/lifecycle/appActions.js';
import { showNotification } from '../../../../utils/ui/notifications/showNotification.js';
import { getState, setState, subscribe, updateState } from '../../../../utils/state/core/stateManager.js';

describe('UIStateManager - comprehensive coverage', () => {
    let addEventListenerSpy: any;

    beforeAll(async () => {
        // Modules are already imported above
    });

    beforeEach(() => {
        // Set up DOM elements that UIStateManager expects
        document.body.innerHTML = `
            <div id="main-content"></div>
            <div id="sidebar"></div>
            <div id="sidebar-toggle"></div>
            <div id="loading-indicator"></div>
            <div id="chartjs-settings-wrapper"></div>
            <div id="chart-controls-toggle"></div>
            <div id="measurement-mode-toggle"></div>
            <div id="measurement-buttons"></div>
            <div id="map-container"></div>

            <!-- Tab buttons -->
            <button data-tab="charts" id="tab-button-charts">Charts</button>
            <button data-tab="map" id="tab-button-map">Map</button>
            <button data-tab="data" id="tab-button-data">Data</button>

            <!-- Theme buttons -->
            <button data-theme="light" id="theme-light">Light</button>
            <button data-theme="dark" id="theme-dark">Dark</button>
            <button data-theme="system" id="theme-system">System</button>

            <!-- Tab content -->
            <div class="tab-content" data-tab-content="charts"></div>
            <div class="tab-content" data-tab-content="map"></div>
            <div class="tab-content" data-tab-content="data"></div>
        `;

        // Set up document.documentElement if not available
        if (!document.documentElement) {
            (document as any).documentElement = document.createElement('html');
            document.appendChild(document.documentElement);
        }

        // Mock window properties
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
        Object.defineProperty(window, 'outerHeight', { value: 850, writable: true });
        Object.defineProperty(window, 'outerWidth', { value: 1250, writable: true });
        Object.defineProperty(window, 'screenX', { value: 100, writable: true });
        Object.defineProperty(window, 'screenY', { value: 200, writable: true });

        Object.defineProperty(window, 'screen', {
            value: {
                availWidth: 1920,
                availHeight: 1080
            },
            writable: true
        });

        // Set up matchMedia mock
        Object.defineProperty(window, 'matchMedia', {
            value: vi.fn(() => ({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn()
            })),
            writable: true,
            configurable: true
        });

        // Clear any active classes on theme buttons and reset DOM state
        document.querySelectorAll('[data-theme]').forEach(button => {
            button.classList.remove('active');
        });

        // Clear any other state classes that might persist
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Reset document.documentElement theme
        if (document.documentElement) {
            delete document.documentElement.dataset.theme;
        }

        // Spy on addEventListener
        addEventListenerSpy = vi.spyOn(Element.prototype, 'addEventListener');

        // Reset all mocks
        vi.clearAllMocks();
        vi.mocked(getState).mockReturnValue(false);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Constructor and Initialization', () => {
        it('should create UIStateManager with eventListeners Map and initialize', () => {
            const manager = new UIStateManager();

            expect(manager).toBeInstanceOf(UIStateManager);
            expect(manager.eventListeners).toBeInstanceOf(Map);
        });

        it('should call setupEventListeners and initializeReactiveElements during initialization', () => {
            const setupSpy = vi.spyOn(UIStateManager.prototype, 'setupEventListeners');
            const initSpy = vi.spyOn(UIStateManager.prototype, 'initializeReactiveElements');

            new UIStateManager();

            expect(setupSpy).toHaveBeenCalled();
            expect(initSpy).toHaveBeenCalled();
        });

        it('should set up state subscriptions during initializeReactiveElements', () => {
            const manager = new UIStateManager();

            // Verify subscribe was called for each state property
            expect(vi.mocked(subscribe)).toHaveBeenCalledWith('ui.activeTab', expect.any(Function));
            expect(vi.mocked(subscribe)).toHaveBeenCalledWith('ui.theme', expect.any(Function));
            expect(vi.mocked(subscribe)).toHaveBeenCalledWith('isLoading', expect.any(Function));
            expect(vi.mocked(subscribe)).toHaveBeenCalledWith('charts.controlsVisible', expect.any(Function));
            expect(vi.mocked(subscribe)).toHaveBeenCalledWith('map.measurementMode', expect.any(Function));
        });
    });

    describe('Theme Management', () => {
        it('should apply light theme correctly', () => {
            const manager = new UIStateManager();

            manager.applyTheme('light');

            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });

        it('should apply dark theme correctly', () => {
            const manager = new UIStateManager();

            manager.applyTheme('dark');

            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        it('should handle system theme with matchMedia support', () => {
            const manager = new UIStateManager();
            const mockMatchMedia = vi.fn(() => ({
                matches: true,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }));
            Object.defineProperty(globalThis, 'matchMedia', { value: mockMatchMedia });

            manager.applyTheme('system');

            expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        it('should handle system theme when matchMedia is not available', () => {
            const manager = new UIStateManager();
            delete (globalThis as any).matchMedia;

            manager.applyTheme('system');

            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });

        it('should use legacy addListener when addEventListener is not available', () => {
            const manager = new UIStateManager();
            const addListener = vi.fn();
            const mockMatchMedia = vi.fn(() => ({
                matches: false,
                addListener,
                removeListener: vi.fn()
            }));
            Object.defineProperty(globalThis, 'matchMedia', { value: mockMatchMedia });

            manager.applyTheme('system');

            expect(addListener).toHaveBeenCalled();
        });

        it('should update theme buttons when applying theme', () => {
            const manager = new UIStateManager();
            const darkButton = document.querySelector('[data-theme="dark"]');
            const lightButton = document.querySelector('[data-theme="light"]');

            manager.applyTheme('dark');

            expect(darkButton?.classList.contains('active')).toBe(true);
            expect(lightButton?.classList.contains('active')).toBe(false);
        });

        it('should clean up system theme listener when switching to explicit theme', () => {
            const manager = new UIStateManager();
            const removeEventListener = vi.fn();
            const mockMatchMedia = vi.fn(() => ({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener
            }));
            Object.defineProperty(globalThis, 'matchMedia', { value: mockMatchMedia });

            // First apply system theme to set up listener
            manager.applyTheme('system');

            // Then switch to explicit theme
            manager.applyTheme('dark');

            expect(removeEventListener).toHaveBeenCalled();
        });

        it('should use legacy removeListener when removeEventListener is not available', () => {
            const manager = new UIStateManager();
            const removeListener = vi.fn();
            const mockMatchMedia = vi.fn(() => ({
                matches: false,
                addEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener
            }));
            Object.defineProperty(globalThis, 'matchMedia', { value: mockMatchMedia });

            // Apply system theme then switch to explicit theme
            manager.applyTheme('system');
            manager.applyTheme('light');

            expect(removeListener).toHaveBeenCalled();
        });
    });

    describe('Event Listener Setup', () => {
        it('should set up tab button event listeners', () => {
            new UIStateManager();

            // Check that addEventListener was called on tab buttons
            const tabButton = document.querySelector('[data-tab="charts"]');
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should handle tab button clicks', () => {
            new UIStateManager();

            const tabButton = document.querySelector('[data-tab="charts"]') as HTMLElement;
            tabButton.click();

            expect(vi.mocked(AppActions.switchTab)).toHaveBeenCalledWith('charts');
        });

        it('should set up theme button event listeners', () => {
            new UIStateManager();

            const themeButton = document.querySelector('[data-theme="dark"]');
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should handle theme button clicks', () => {
            new UIStateManager();

            const themeButton = document.querySelector('[data-theme="dark"]') as HTMLElement;
            themeButton.click();

            expect(vi.mocked(AppActions.switchTheme)).toHaveBeenCalledWith('dark');
        });

        it('should set up chart controls toggle listener', () => {
            new UIStateManager();

            const toggleButton = document.querySelector('#chart-controls-toggle');
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should handle chart controls toggle clicks', () => {
            new UIStateManager();

            const toggleButton = document.querySelector('#chart-controls-toggle') as HTMLElement;
            toggleButton.click();

            expect(vi.mocked(AppActions.toggleChartControls)).toHaveBeenCalled();
        });

        it('should set up measurement mode toggle listener', () => {
            new UIStateManager();

            const toggleButton = document.querySelector('#measurement-mode-toggle');
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should handle measurement mode toggle clicks', () => {
            new UIStateManager();

            const toggleButton = document.querySelector('#measurement-mode-toggle') as HTMLElement;
            toggleButton.click();

            expect(vi.mocked(AppActions.toggleMeasurementMode)).toHaveBeenCalled();
        });

        it('should handle missing elements gracefully', () => {
            // Remove some elements
            document.getElementById('chart-controls-toggle')?.remove();
            document.getElementById('measurement-mode-toggle')?.remove();

            expect(() => new UIStateManager()).not.toThrow();
        });
    });

    describe('Notification System', () => {
        it('should handle string notification parameter', () => {
            const manager = new UIStateManager();

            manager.showNotification('Test message');

            expect(vi.mocked(showNotification)).toHaveBeenCalledWith('Test message', 'info', 3000);
            expect(vi.mocked(setState)).toHaveBeenCalledWith('ui.lastNotification',
                expect.objectContaining({
                    message: 'Test message',
                    type: 'info'
                }),
                { source: 'UIStateManager.showNotification' }
            );
        });

        it('should handle object notification parameter', () => {
            const manager = new UIStateManager();
            const notification = {
                message: 'Error occurred',
                type: 'error',
                duration: 5000
            };

            manager.showNotification(notification);

            expect(vi.mocked(showNotification)).toHaveBeenCalledWith('Error occurred', 'error', 5000);
            expect(vi.mocked(setState)).toHaveBeenCalledWith('ui.lastNotification',
                expect.objectContaining({
                    message: 'Error occurred',
                    type: 'error'
                }),
                { source: 'UIStateManager.showNotification' }
            );
        });

        it('should handle object notification with default values', () => {
            const manager = new UIStateManager();
            const notification = { message: 'Test' };

            manager.showNotification(notification);

            expect(vi.mocked(showNotification)).toHaveBeenCalledWith('Test', 'info', 3000);
        });

        it('should handle invalid notification parameter', () => {
            const manager = new UIStateManager();
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            manager.showNotification(null);

            expect(consoleSpy).toHaveBeenCalledWith('[UIStateManager] Invalid notification parameter:', null);
            expect(vi.mocked(showNotification)).not.toHaveBeenCalled();
        });

        it('should fallback to console logging when showNotification fails', async () => {
            const manager = new UIStateManager();
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            vi.mocked(showNotification).mockImplementation(() => {
                throw new Error('Notification failed');
            });

            manager.showNotification('Test message');

            expect(consoleLogSpy).toHaveBeenCalledWith('[Notification INFO] Test message');
        });

        it('should handle error notification fallback', async () => {
            const manager = new UIStateManager();
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.mocked(showNotification).mockImplementation(() => {
                throw new Error('Notification failed');
            });

            manager.showNotification({ message: 'Error message', type: 'error' });

            expect(consoleWarnSpy).toHaveBeenCalledWith('ERROR: Error message');
        });
    });

    describe('UI Update Methods', () => {
        describe('updateChartControlsUI', () => {
            it('should show chart controls when visible', () => {
                const manager = new UIStateManager();
                const chartControls = document.getElementById('chartjs-settings-wrapper') as HTMLElement;
                const toggleBtn = document.getElementById('chart-controls-toggle') as HTMLElement;

                manager.updateChartControlsUI(true);

                expect(chartControls.style.display).toBe('block');
                expect(toggleBtn.textContent).toBe('▼ Hide Controls');
                expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
            });

            it('should hide chart controls when not visible', () => {
                const manager = new UIStateManager();
                const chartControls = document.getElementById('chartjs-settings-wrapper') as HTMLElement;
                const toggleBtn = document.getElementById('chart-controls-toggle') as HTMLElement;

                manager.updateChartControlsUI(false);

                expect(chartControls.style.display).toBe('none');
                expect(toggleBtn.textContent).toBe('▶ Show Controls');
                expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
            });

            it('should handle missing elements gracefully', () => {
                const manager = new UIStateManager();
                document.getElementById('chartjs-settings-wrapper')?.remove();
                document.getElementById('chart-controls-toggle')?.remove();

                expect(() => manager.updateChartControlsUI(true)).not.toThrow();
            });
        });

        describe('updateLoadingIndicator', () => {
            it('should show loading indicator when loading', () => {
                const manager = new UIStateManager();
                const loadingIndicator = document.getElementById('loading-indicator') as HTMLElement;
                const mainContent = document.getElementById('main-content') as HTMLElement;

                manager.updateLoadingIndicator(true);

                expect(loadingIndicator.style.display).toBe('block');
                expect(mainContent.style.opacity).toBe('0.5');
                expect(mainContent.style.pointerEvents).toBe('none');
                expect(document.body.style.cursor).toBe('wait');
            });

            it('should hide loading indicator when not loading', () => {
                const manager = new UIStateManager();
                const loadingIndicator = document.getElementById('loading-indicator') as HTMLElement;
                const mainContent = document.getElementById('main-content') as HTMLElement;

                manager.updateLoadingIndicator(false);

                expect(loadingIndicator.style.display).toBe('none');
                expect(mainContent.style.opacity).toBe('1');
                expect(mainContent.style.pointerEvents).toBe('auto');
                expect(document.body.style.cursor).toBe('default');
            });

            it('should handle missing elements gracefully', () => {
                const manager = new UIStateManager();
                document.getElementById('loading-indicator')?.remove();
                document.getElementById('main-content')?.remove();

                expect(() => manager.updateLoadingIndicator(true)).not.toThrow();
            });
        });

        describe('updateMeasurementModeUI', () => {
            it('should activate measurement mode UI', () => {
                const manager = new UIStateManager();
                const toggleBtn = document.getElementById('measurement-mode-toggle') as HTMLElement;
                const mapContainer = document.getElementById('map-container') as HTMLElement;

                manager.updateMeasurementModeUI(true);

                expect(toggleBtn.classList.contains('active')).toBe(true);
                expect(toggleBtn.textContent).toBe('Exit Measurement');
                expect(mapContainer.classList.contains('measurement-mode')).toBe(true);
            });

            it('should deactivate measurement mode UI', () => {
                const manager = new UIStateManager();
                const toggleBtn = document.getElementById('measurement-mode-toggle') as HTMLElement;
                const mapContainer = document.getElementById('map-container') as HTMLElement;

                manager.updateMeasurementModeUI(false);

                expect(toggleBtn.classList.contains('active')).toBe(false);
                expect(toggleBtn.textContent).toBe('Measure Distance');
                expect(mapContainer.classList.contains('measurement-mode')).toBe(false);
            });
        });

        describe('updateTabButtons', () => {
            it('should update tab button states', () => {
                const manager = new UIStateManager();
                const chartsButton = document.querySelector('[data-tab="charts"]') as HTMLElement;
                const mapButton = document.querySelector('[data-tab="map"]') as HTMLElement;

                manager.updateTabButtons('charts');

                expect(chartsButton.classList.contains('active')).toBe(true);
                expect(chartsButton.getAttribute('aria-selected')).toBe('true');
                expect(mapButton.classList.contains('active')).toBe(false);
                expect(mapButton.getAttribute('aria-selected')).toBe('false');
            });
        });

        describe('updateTabVisibility', () => {
            it('should update tab content visibility', () => {
                const manager = new UIStateManager();
                const chartsContent = document.querySelector('[data-tab-content="charts"]') as HTMLElement;
                const mapContent = document.querySelector('[data-tab-content="map"]') as HTMLElement;

                manager.updateTabVisibility('charts');

                expect(chartsContent.style.display).toBe('block');
                expect(chartsContent.getAttribute('aria-hidden')).toBe('false');
                expect(mapContent.style.display).toBe('none');
                expect(mapContent.getAttribute('aria-hidden')).toBe('true');
            });
        });
    });

    describe('Sidebar Management', () => {
        it('should toggle sidebar from state', () => {
            const manager = new UIStateManager();
            vi.mocked(getState).mockReturnValue(false);

            manager.toggleSidebar(undefined);

            expect(vi.mocked(setState)).toHaveBeenCalledWith('ui.sidebarCollapsed', true,
                { source: 'UIStateManager.toggleSidebar' });
        });

        it('should set sidebar to specific state', () => {
            const manager = new UIStateManager();

            manager.toggleSidebar(true);

            expect(vi.mocked(setState)).toHaveBeenCalledWith('ui.sidebarCollapsed', true,
                { source: 'UIStateManager.toggleSidebar' });
        });

        it('should update sidebar DOM elements', () => {
            const manager = new UIStateManager();
            const sidebar = document.getElementById('sidebar') as HTMLElement;
            const mainContent = document.getElementById('main-content') as HTMLElement;

            manager.toggleSidebar(true);

            expect(sidebar.classList.contains('collapsed')).toBe(true);
            expect(mainContent.classList.contains('sidebar-collapsed')).toBe(true);
        });
    });

    describe('Window State Management', () => {
        it('should update window state from DOM', () => {
            const manager = new UIStateManager();

            manager.updateWindowStateFromDOM();

            expect(vi.mocked(updateState)).toHaveBeenCalledWith('ui.windowState', {
                height: 800,
                width: 1200,
                maximized: false,
                x: 100,
                y: 200
            }, { source: 'UIStateManager.updateWindowStateFromDOM' });
        });

        it('should detect maximized window', () => {
            const manager = new UIStateManager();
            Object.defineProperty(window, 'outerWidth', { value: 1920, writable: true });
            Object.defineProperty(window, 'outerHeight', { value: 1080, writable: true });

            manager.updateWindowStateFromDOM();

            expect(vi.mocked(updateState)).toHaveBeenCalledWith('ui.windowState',
                expect.objectContaining({ maximized: true }),
                { source: 'UIStateManager.updateWindowStateFromDOM' }
            );
        });
    });

    describe('Cleanup', () => {
        it('should clean up system theme listener', () => {
            const manager = new UIStateManager();
            const removeEventListener = vi.fn();
            const mockMatchMedia = vi.fn(() => ({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener
            }));
            Object.defineProperty(globalThis, 'matchMedia', { value: mockMatchMedia });

            // Set up system theme listener
            manager.applyTheme('system');

            manager.cleanup();

            expect(removeEventListener).toHaveBeenCalled();
        });

        it('should clear event listeners map', () => {
            const manager = new UIStateManager();

            manager.cleanup();

            expect(manager.eventListeners.size).toBe(0);
        });
    });

    describe('Global Instance and Convenience Functions', () => {
        it('should have global uiStateManager instance', () => {
            expect(uiStateManager).toBeDefined();
            expect(uiStateManager).toBeInstanceOf(UIStateManager);
        });

        it('should provide UIActions.setTheme convenience function', () => {
            UIActions.setTheme('dark');

            expect(vi.mocked(AppActions.switchTheme)).toHaveBeenCalledWith('dark');
        });

        it('should provide UIActions.showTab convenience function', () => {
            UIActions.showTab('charts');

            expect(vi.mocked(AppActions.switchTab)).toHaveBeenCalledWith('charts');
        });

        it('should provide UIActions.toggleChartControls convenience function', () => {
            UIActions.toggleChartControls();

            expect(vi.mocked(AppActions.toggleChartControls)).toHaveBeenCalled();
        });

        it('should provide UIActions.toggleMeasurementMode convenience function', () => {
            UIActions.toggleMeasurementMode();

            expect(vi.mocked(AppActions.toggleMeasurementMode)).toHaveBeenCalled();
        });

        it('should provide UIActions.toggleSidebar convenience function', () => {
            const toggleSidebarSpy = vi.spyOn(uiStateManager, 'toggleSidebar');

            UIActions.toggleSidebar(true);

            expect(toggleSidebarSpy).toHaveBeenCalledWith(true);
        });

        it('should provide UIActions.updateWindowState convenience function', () => {
            const updateWindowStateSpy = vi.spyOn(uiStateManager, 'updateWindowStateFromDOM');

            UIActions.updateWindowState();

            expect(updateWindowStateSpy).toHaveBeenCalled();
        });
    });
});
