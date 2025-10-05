/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    applyAccentColor,
    clearAccentColor,
    generateAccentColorVariations,
    getDefaultAccentColor,
    getEffectiveAccentColor,
    initializeAccentColor,
    isValidHexColor,
    loadAccentColor,
    resetAccentColor,
    saveAccentColor,
    setAccentColor
} from '../../../../../utils/theming/core/accentColor.js';

describe('accentColor', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.style.cssText = '';
        vi.clearAllMocks();
    });

    describe('isValidHexColor', () => {
        it('should validate correct hex colors', () => {
            expect(isValidHexColor('#3b82f6')).toBe(true);
            expect(isValidHexColor('#FFFFFF')).toBe(true);
            expect(isValidHexColor('#000000')).toBe(true);
        });

        it('should reject invalid hex colors', () => {
            expect(isValidHexColor('3b82f6')).toBe(false); // Missing #
            expect(isValidHexColor('#3b82f')).toBe(false); // Too short
            expect(isValidHexColor('#3b82f6a')).toBe(false); // Too long
            expect(isValidHexColor('blue')).toBe(false); // Named color
            expect(isValidHexColor('')).toBe(false); // Empty
            expect(isValidHexColor(/** @type {any} */(null))).toBe(false); // Null
            expect(isValidHexColor(/** @type {any} */(123))).toBe(false); // Number
        });
    });

    describe('getDefaultAccentColor', () => {
        it('should return dark default for dark theme', () => {
            expect(getDefaultAccentColor('dark')).toBe('#3b82f6');
        });

        it('should return light default for light theme', () => {
            expect(getDefaultAccentColor('light')).toBe('#2563eb');
        });

        it('should return dark default for unknown theme', () => {
            expect(getDefaultAccentColor('unknown')).toBe('#3b82f6');
        });
    });

    describe('saveAccentColor and loadAccentColor', () => {
        it('should save and load valid color', () => {
            const color = '#ff5733';
            expect(saveAccentColor(color)).toBe(true);
            expect(loadAccentColor()).toBe(color);
        });

        it('should reject invalid color on save', () => {
            expect(saveAccentColor('invalid')).toBe(false);
            expect(loadAccentColor()).toBe(null);
        });

        it('should handle localStorage errors gracefully', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(loadAccentColor()).toBe(null);
            expect(consoleWarnSpy).toHaveBeenCalled();

            getItemSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });

        it('should return null for invalid stored colors', () => {
            localStorage.setItem('ffv-accent-color', 'invalid');
            expect(loadAccentColor()).toBe(null);
        });
    });

    describe('clearAccentColor', () => {
        it('should clear saved accent color', () => {
            saveAccentColor('#ff5733');
            expect(clearAccentColor()).toBe(true);
            expect(loadAccentColor()).toBe(null);
        });

        it('should handle localStorage errors', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(clearAccentColor()).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();

            removeItemSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('generateAccentColorVariations', () => {
        it('should generate variations for dark theme', () => {
            const variations = /** @type {any} */(generateAccentColorVariations('#3b82f6', 'dark'));

            expect(variations.accent).toBe('#3b82f6');
            expect(variations.accentRgb).toBe('59, 130, 246');
            expect(variations.accentSecondary).toMatch(/^#/);
            expect(variations.accentHover).toContain('rgb');
            expect(variations.btnBg).toContain('linear-gradient');
            expect(variations.heroGlow).toContain('28%');
        });

        it('should generate variations for light theme', () => {
            const variations = /** @type {any} */(generateAccentColorVariations('#2563eb', 'light'));

            expect(variations.accent).toBe('#2563eb');
            expect(variations.heroGlow).toContain('26%');
            expect(variations.modalBg).toContain('#fff');
        });

        it('should handle invalid color by using default', () => {
            const variations = /** @type {any} */(generateAccentColorVariations('invalid', 'dark'));
            expect(variations.accent).toBe('#3b82f6');
        });
    });

    describe('applyAccentColor', () => {
        it('should apply color to CSS variables', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            applyAccentColor('#3b82f6', 'dark');

            const root = document.documentElement;
            expect(root.style.getPropertyValue('--color-accent')).toBe('#3b82f6');
            expect(root.style.getPropertyValue('--color-accent-rgb')).toBe('59, 130, 246');
            expect(consoleLogSpy).toHaveBeenCalled();

            consoleLogSpy.mockRestore();
        });

        it('should use default for invalid color', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            applyAccentColor('invalid', 'dark');

            const root = document.documentElement;
            expect(root.style.getPropertyValue('--color-accent')).toBe('#3b82f6');
            expect(consoleWarnSpy).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });
    });

    describe('setAccentColor', () => {
        it('should set and apply valid color', () => {
            const result = setAccentColor('#ff5733', 'dark');

            expect(result).toBe(true);
            expect(loadAccentColor()).toBe('#ff5733');
            expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#ff5733');
        });

        it('should reject invalid color', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const result = setAccentColor('invalid', 'dark');

            expect(result).toBe(false);
            expect(consoleWarnSpy).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });

        it('should return false if save fails', () => {
            const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('Storage error');
            });

            const result = setAccentColor('#ff5733', 'dark');
            expect(result).toBe(false);

            setItemSpy.mockRestore();
        });
    });

    describe('getEffectiveAccentColor', () => {
        it('should return custom color if set', () => {
            saveAccentColor('#ff5733');
            expect(getEffectiveAccentColor('dark')).toBe('#ff5733');
        });

        it('should return default if no custom color', () => {
            expect(getEffectiveAccentColor('dark')).toBe('#3b82f6');
            expect(getEffectiveAccentColor('light')).toBe('#2563eb');
        });
    });

    describe('resetAccentColor', () => {
        it('should reset to default color', () => {
            saveAccentColor('#ff5733');
            const result = resetAccentColor('dark');

            expect(result).toBe('#3b82f6');
            expect(loadAccentColor()).toBe(null);
            expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#3b82f6');
        });
    });

    describe('initializeAccentColor', () => {
        it('should initialize with custom color if set', () => {
            saveAccentColor('#ff5733');
            const result = initializeAccentColor('dark');

            expect(result).toBe('#ff5733');
            expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#ff5733');
        });

        it('should initialize with default if no custom color', () => {
            const result = initializeAccentColor('dark');

            expect(result).toBe('#3b82f6');
            expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#3b82f6');
        });
    });
});
