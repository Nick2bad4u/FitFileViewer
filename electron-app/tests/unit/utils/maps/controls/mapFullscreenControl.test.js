/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { addFullscreenControl } from '../../../../../utils/maps/controls/mapFullscreenControl.js';

describe('mapFullscreenControl', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="leaflet-map"></div><div id="map-controls"></div>';

        vi.clearAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    describe('Basic Functionality', () => {
        it('should add fullscreen control to map', () => {
            const map = { invalidateSize: vi.fn() };

            addFullscreenControl(/** @type {any} */(map));

            const control = document.querySelector('.custom-fullscreen-control');
            expect(control).toBeTruthy();

            const button = document.querySelector('#fullscreen-btn');
            expect(button).toBeTruthy();
            expect(button?.getAttribute('title')).toBe('Toggle Fullscreen');
        });

        it('should warn if map container not found', () => {
            document.body.innerHTML = '';

            const map = { invalidateSize: vi.fn() };
            addFullscreenControl(/** @type {any} */(map));

            expect(console.warn).toHaveBeenCalledWith('[mapFullscreenControl] Map container not found');
        });

    });

    describe('Fullscreen Toggle', () => {
        it('should toggle fullscreen class on click', () => {
            const map = { invalidateSize: vi.fn() };

            addFullscreenControl(/** @type {any} */(map));

            const mapDiv = document.getElementById('leaflet-map');
            const button = document.querySelector('#fullscreen-btn');

            button?.dispatchEvent(new Event('click'));

            expect(mapDiv?.classList.contains('fullscreen')).toBe(true);
        });

        it('should update button title on toggle', () => {
            const map = { invalidateSize: vi.fn() };

            addFullscreenControl(/** @type {any} */(map));

            const button = /** @type {HTMLElement} */(document.querySelector('#fullscreen-btn'));

            // Click to enter fullscreen
            button?.click();
            expect(button?.title).toBe('Exit Fullscreen');

            // Click to exit fullscreen
            button?.click();
            expect(button?.title).toBe('Enter Fullscreen');
        });

        it('should call invalidateSize after toggle', () => {
            vi.useFakeTimers();
            const map = { invalidateSize: vi.fn() };

            addFullscreenControl(/** @type {any} */(map));

            const button = document.querySelector('#fullscreen-btn');
            button?.dispatchEvent(new Event('click'));

            vi.advanceTimersByTime(300);

            expect(map.invalidateSize).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should apply fullscreen UI state', () => {
            const map = { invalidateSize: vi.fn() };

            addFullscreenControl(/** @type {any} */(map));

            const mapControls = document.getElementById('map-controls');
            const button = document.querySelector('#fullscreen-btn');

            button?.dispatchEvent(new Event('click'));

            expect(mapControls?.classList.contains('map-controls-overlay')).toBe(true);
            expect(document.body.classList.contains('map-fullscreen-active')).toBe(true);
        });
    });

    describe('Fullscreen API Integration', () => {
        it('should request fullscreen when entering fullscreen mode', () => {
            const map = { invalidateSize: vi.fn() };
            const mapDiv = /** @type {HTMLElement} */(document.getElementById('leaflet-map'));
            const requestFullscreen = vi.fn().mockReturnValue(Promise.resolve());
			/** @type {any} */(mapDiv).requestFullscreen = requestFullscreen;

            addFullscreenControl(/** @type {any} */(map));

            const button = document.querySelector('#fullscreen-btn');
            button?.dispatchEvent(new Event('click'));

            expect(requestFullscreen).toHaveBeenCalled();
        });

        it('should handle requestFullscreen errors', async () => {
            const map = { invalidateSize: vi.fn() };
            const mapDiv = /** @type {HTMLElement} */(document.getElementById('leaflet-map'));
            const requestFullscreen = vi.fn().mockReturnValue(Promise.reject(new Error('Fullscreen denied')));
			/** @type {any} */(mapDiv).requestFullscreen = requestFullscreen;

            addFullscreenControl(/** @type {any} */(map));

            const button = document.querySelector('#fullscreen-btn');
            button?.dispatchEvent(new Event('click'));

            // Wait for promise to reject
            await new Promise(resolve => setTimeout(resolve, 10));

            // Should revert to non-fullscreen state
            expect(mapDiv.classList.contains('fullscreen')).toBe(false);
        });

        it('should exit fullscreen when exiting fullscreen mode', () => {
            const map = { invalidateSize: vi.fn() };
            const exitFullscreen = vi.fn().mockReturnValue(Promise.resolve());
			/** @type {any} */(document).exitFullscreen = exitFullscreen;

            addFullscreenControl(/** @type {any} */(map));

            const mapDiv = /** @type {HTMLElement} */(document.getElementById('leaflet-map'));
            const button = document.querySelector('#fullscreen-btn');

            // Enter fullscreen first
            button?.dispatchEvent(new Event('click'));
            mapDiv.classList.add('fullscreen');

            // Exit fullscreen
            button?.dispatchEvent(new Event('click'));

            expect(exitFullscreen).toHaveBeenCalled();
        });
    });

    describe('Fullscreen Change Event', () => {
        it('should handle fullscreen change event', () => {
            vi.useFakeTimers();
            const map = {
                _container: document.createElement('div'),
                invalidateSize: vi.fn()
            };
            document.body.appendChild(map._container);

            addFullscreenControl(/** @type {any} */(map));

            const mapDiv = /** @type {HTMLElement} */(document.getElementById('leaflet-map'));
            mapDiv.classList.add('fullscreen');

            // Simulate fullscreen change event
            Object.defineProperty(document, 'fullscreenElement', {
                value: null,
                configurable: true
            });

            document.dispatchEvent(new Event('fullscreenchange'));

            expect(mapDiv.classList.contains('fullscreen')).toBe(false);

            vi.advanceTimersByTime(300);
            expect(map.invalidateSize).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should not call invalidateSize if map container is removed', () => {
            vi.useFakeTimers();
            const map = {
                _container: document.createElement('div'),
                invalidateSize: vi.fn()
            };

            addFullscreenControl(/** @type {any} */(map));

            // Remove container from DOM
            // (it's not in DOM to begin with in this test)

            Object.defineProperty(document, 'fullscreenElement', {
                value: null,
                configurable: true
            });

            document.dispatchEvent(new Event('fullscreenchange'));

            vi.advanceTimersByTime(300);
            expect(map.invalidateSize).not.toHaveBeenCalled();

            vi.useRealTimers();
        });
    });

    describe('Cleanup', () => {
        it('should remove old fullscreen button from map-controls', () => {
            const mapControls = /** @type {HTMLElement} */(document.getElementById('map-controls'));
            const oldButton = document.createElement('button');
            oldButton.id = 'fullscreen-btn';
            mapControls.appendChild(oldButton);

            expect(mapControls.querySelector('#fullscreen-btn')).toBeTruthy();

            const map = { invalidateSize: vi.fn() };
            addFullscreenControl(/** @type {any} */(map));

            // Old button inside map-controls should be removed
            const oldButtonAfter = mapControls.querySelector('#fullscreen-btn');
            expect(oldButtonAfter).toBeFalsy();

            // New button should be in the fullscreen control (not in map-controls)
            const newButton = document.querySelector('.custom-fullscreen-control #fullscreen-btn');
            expect(newButton).toBeTruthy();
        });
    });
});
