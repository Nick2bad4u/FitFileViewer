/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMarkerCountSelector } from '../../../../../utils/ui/controls/createMarkerCountSelector.js';

describe('createMarkerCountSelector', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
		/** @type {any} */(globalThis).mapMarkerCount = undefined;
		/** @type {any} */(globalThis).updateShownFilesList = undefined;
        vi.clearAllMocks();
    });

    it('should create marker count selector with default value', () => {
        const onChange = vi.fn();
        const container = createMarkerCountSelector(onChange);

        expect(container).toBeInstanceOf(HTMLDivElement);
        expect(container.className).toContain('marker-count-container');

        const select = container.querySelector('select');
        expect(select).toBeTruthy();
        expect(select?.value).toBe('50');
        expect(/** @type {any} */(globalThis).mapMarkerCount).toBe(50);
    });

    it('should create all required options', () => {
        const container = createMarkerCountSelector();
        const select = container.querySelector('select');
        const options = select?.querySelectorAll('option');

        expect(options?.length).toBe(8);
        expect(options?.[0]?.value).toBe('10');
        expect(options?.[7]?.value).toBe('all');
    });

    it('should handle selection change', () => {
        const onChange = vi.fn();
        const container = createMarkerCountSelector(onChange);
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        select.value = '100';
        select.dispatchEvent(new Event('change'));

        expect(/** @type {any} */(globalThis).mapMarkerCount).toBe(100);
        expect(onChange).toHaveBeenCalledWith(100);
    });

    it('should handle "All" selection', () => {
        const onChange = vi.fn();
        const container = createMarkerCountSelector(onChange);
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        select.value = 'all';
        select.dispatchEvent(new Event('change'));

        expect(/** @type {any} */(globalThis).mapMarkerCount).toBe(0);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('should call updateShownFilesList when available', () => {
        const updateShownFilesList = vi.fn();
		/** @type {any} */(globalThis).updateShownFilesList = updateShownFilesList;

        const onChange = vi.fn();
        const container = createMarkerCountSelector(onChange);
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        select.value = '200';
        select.dispatchEvent(new Event('change'));

        expect(updateShownFilesList).toHaveBeenCalled();
    });

    it('should handle wheel events to increase value', () => {
        const onChange = vi.fn();
        const container = createMarkerCountSelector(onChange);
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        select.value = '50'; // Index 2
        select.selectedIndex = 2;

        const wheelEvent = new WheelEvent('wheel', { deltaY: 1 });
        const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');
        const stopPropagationSpy = vi.spyOn(wheelEvent, 'stopPropagation');

        select.dispatchEvent(wheelEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(select.selectedIndex).toBe(3); // Should increase
    });

    it('should handle wheel events to decrease value', () => {
        const onChange = vi.fn();
        const container = createMarkerCountSelector(onChange);
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        select.value = '100'; // Index 3
        select.selectedIndex = 3;

        const wheelEvent = new WheelEvent('wheel', { deltaY: -1 });
        select.dispatchEvent(wheelEvent);

        expect(select.selectedIndex).toBe(2); // Should decrease
    });

    it('should not go beyond last option with wheel', () => {
        const onChange = vi.fn();
        const container = createMarkerCountSelector(onChange);
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        select.selectedIndex = 7; // Last option

        const wheelEvent = new WheelEvent('wheel', { deltaY: 1 });
        select.dispatchEvent(wheelEvent);

        expect(select.selectedIndex).toBe(7); // Should stay at last
    });

    it('should not go before first option with wheel', () => {
        const onChange = vi.fn();
        const container = createMarkerCountSelector(onChange);
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        select.selectedIndex = 0; // First option

        const wheelEvent = new WheelEvent('wheel', { deltaY: -1 });
        select.dispatchEvent(wheelEvent);

        expect(select.selectedIndex).toBe(0); // Should stay at first
    });

    it('should handle existing mapMarkerCount value of 0 as "all"', () => {
		/** @type {any} */(globalThis).mapMarkerCount = 0;

        const container = createMarkerCountSelector();
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        expect(select.value).toBe('all');
    });

    it('should handle existing valid mapMarkerCount value', () => {
		/** @type {any} */(globalThis).mapMarkerCount = 200;

        const container = createMarkerCountSelector();
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        expect(select.value).toBe('200');
    });

    it('should handle invalid existing mapMarkerCount value', () => {
		/** @type {any} */(globalThis).mapMarkerCount = 999; // Invalid option

        const container = createMarkerCountSelector();
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        expect(select.value).toBe('50'); // Should fallback to default
        expect(/** @type {any} */(globalThis).mapMarkerCount).toBe(50);
    });

    it('should work without onChange callback', () => {
        const container = createMarkerCountSelector();
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        expect(() => {
            select.value = '100';
            select.dispatchEvent(new Event('change'));
        }).not.toThrow();

        expect(/** @type {any} */(globalThis).mapMarkerCount).toBe(100);
    });

    it('should handle errors in change event gracefully', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const onChange = vi.fn(() => {
            throw new Error('Test error');
        });

        const container = createMarkerCountSelector(onChange);
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        select.value = '100';
        select.dispatchEvent(new Event('change'));

        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it('should handle errors in wheel event gracefully', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const container = createMarkerCountSelector();
        const select = /** @type {HTMLSelectElement} */(container.querySelector('select'));

        // Create a wheel event that might cause an error
        Object.defineProperty(select, 'selectedIndex', {
            get() { return 0; },
            set() { throw new Error('Test error'); }
        });

        const wheelEvent = new WheelEvent('wheel', { deltaY: 1 });
        select.dispatchEvent(wheelEvent);

        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it('should create label with icon and text', () => {
        const container = createMarkerCountSelector();
        const label = container.querySelector('label');

        expect(label).toBeTruthy();
        expect(label?.className).toBe('marker-count-label');
        expect(label?.innerHTML).toContain('iconify-icon');
        expect(label?.innerHTML).toContain('Data Points:');
    });
});
