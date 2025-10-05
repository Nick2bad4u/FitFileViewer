/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDensityToggle, getDensityPreference } from '../../../../../utils/ui/controls/createDensityToggle.js';

describe('createDensityToggle', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
    });

    it('should create a density toggle button with default settings', () => {
        const onChange = vi.fn();
        const toggle = createDensityToggle({
            storageKey: 'test-density',
            onChange
        });

        expect(toggle).toBeInstanceOf(HTMLButtonElement);
        expect(toggle.className).toBe('density-toggle-btn');
        expect(onChange).toHaveBeenCalledWith('spacious');
    });

    it('should create a toggle with label when showLabel is true', () => {
        const onChange = vi.fn();
        const container = createDensityToggle({
            storageKey: 'test-density',
            onChange,
            showLabel: true,
            labelText: 'View:'
        });

        expect(container).toBeInstanceOf(HTMLDivElement);
        expect(container.className).toBe('density-toggle-container');

        const label = container.querySelector('.density-toggle-label');
        expect(label).toBeTruthy();
        expect(label?.textContent).toBe('View:');

        const button = container.querySelector('.density-toggle-btn');
        expect(button).toBeTruthy();
    });

    it('should toggle between spacious and dense on click', () => {
        const onChange = vi.fn();
        const toggle = createDensityToggle({
            storageKey: 'test-density',
            onChange
        });

        // Initial call
        expect(onChange).toHaveBeenCalledWith('spacious');
        onChange.mockClear();

        // Click to switch to dense
        toggle.click();
        expect(onChange).toHaveBeenCalledWith('dense');
        expect(localStorage.getItem('test-density')).toBe('dense');
        onChange.mockClear();

        // Click to switch back to spacious
        toggle.click();
        expect(onChange).toHaveBeenCalledWith('spacious');
        expect(localStorage.getItem('test-density')).toBe('spacious');
    });

    it('should use saved preference from localStorage', () => {
        localStorage.setItem('test-density', 'dense');
        const onChange = vi.fn();

        const toggle = createDensityToggle({
            storageKey: 'test-density',
            onChange
        });

        expect(onChange).toHaveBeenCalledWith('dense');
    });

    it('should use defaultDensity when no saved preference', () => {
        const onChange = vi.fn();

        const toggle = createDensityToggle({
            storageKey: 'test-density',
            onChange,
            defaultDensity: 'dense'
        });

        expect(onChange).toHaveBeenCalledWith('dense');
    });

    it('should update button appearance based on density', () => {
        const onChange = vi.fn();
        const toggle = createDensityToggle({
            storageKey: 'test-density',
            onChange
        });

        // Should show dense icon initially (to switch TO dense)
        expect(toggle.innerHTML).toContain('flat-color-icons:list');
        expect(toggle.getAttribute('aria-label')).toBe('Switch to dense layout');

        // Click to switch to dense
        toggle.click();

        // Should show spacious icon (to switch TO spacious)
        expect(toggle.innerHTML).toContain('flat-color-icons:view-details');
        expect(toggle.getAttribute('aria-label')).toBe('Switch to spacious layout');
    });

    it('should stop propagation on click', () => {
        const onChange = vi.fn();
        const toggle = createDensityToggle({
            storageKey: 'test-density',
            onChange
        });

        const event = new MouseEvent('click', { bubbles: true });
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

        toggle.dispatchEvent(event);

        expect(stopPropagationSpy).toHaveBeenCalled();
    });
});

describe('getDensityPreference', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return saved preference', () => {
        localStorage.setItem('test-density', 'dense');
        expect(getDensityPreference('test-density')).toBe('dense');
    });

    it('should return default when no saved preference', () => {
        expect(getDensityPreference('test-density')).toBe('spacious');
        expect(getDensityPreference('test-density', 'dense')).toBe('dense');
    });

    it('should handle custom default', () => {
        expect(getDensityPreference('nonexistent', 'dense')).toBe('dense');
    });
});
