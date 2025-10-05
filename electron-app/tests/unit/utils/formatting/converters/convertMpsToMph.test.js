/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertMpsToMph } from '../../../../../utils/formatting/converters/convertMpsToMph.js';

describe('convertMpsToMph', () => {
    let consoleWarnSpy = /** @type {any} */ (null);
    let consoleErrorSpy = /** @type {any} */ (null);

    beforeEach(() => {
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should convert meters per second to miles per hour', () => {
        expect(convertMpsToMph(10)).toBeCloseTo(22.37, 1);
        expect(convertMpsToMph(5)).toBeCloseTo(11.18, 1);
        expect(convertMpsToMph(44.704)).toBeCloseTo(100, 0);
    });

    it('should handle zero speed', () => {
        expect(convertMpsToMph(0)).toBe(0);
    });

    it('should handle negative speed and log warning', () => {
        const result = convertMpsToMph(-10);
        expect(result).toBeCloseTo(-22.37, 1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            '[convertMpsToMph] Negative speed value:',
            -10
        );
    });

    it('should handle very small speeds', () => {
        expect(convertMpsToMph(0.001)).toBeCloseTo(0.00224, 5);
    });

    it('should handle very large speeds', () => {
        expect(convertMpsToMph(1000)).toBeCloseTo(2236.936, 2);
    });

    it('should throw TypeError for non-number input', () => {
        expect(() => convertMpsToMph(/** @type {any} */('10'))).toThrow(TypeError);
        expect(() => convertMpsToMph(/** @type {any} */('10'))).toThrow('Expected mps to be a number, received string');
        expect(() => convertMpsToMph(/** @type {any} */(null))).toThrow(TypeError);
        expect(() => convertMpsToMph(/** @type {any} */(undefined))).toThrow(TypeError);
        expect(() => convertMpsToMph(/** @type {any} */({}))).toThrow(TypeError);
        expect(() => convertMpsToMph(/** @type {any} */([]))).toThrow(TypeError);
    });

    it('should throw TypeError for NaN input', () => {
        expect(() => convertMpsToMph(NaN)).toThrow(TypeError);
        expect(() => convertMpsToMph(NaN)).toThrow('Expected mps to be a number, received number');
    });

    it('should handle decimal values correctly', () => {
        expect(convertMpsToMph(2.5)).toBeCloseTo(5.59, 1);
        expect(convertMpsToMph(20)).toBeCloseTo(44.74, 1);
    });
});
