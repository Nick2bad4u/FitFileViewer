/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertMpsToKmh } from '../../../../../utils/formatting/converters/convertMpsToKmh.js';

describe('convertMpsToKmh', () => {
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

    it('should convert meters per second to kilometers per hour', () => {
        expect(convertMpsToKmh(5)).toBeCloseTo(18, 1);
        expect(convertMpsToKmh(10)).toBeCloseTo(36, 1);
        expect(convertMpsToKmh(27.778)).toBeCloseTo(100, 1);
    });

    it('should handle zero speed', () => {
        expect(convertMpsToKmh(0)).toBe(0);
    });

    it('should handle negative speed and log warning', () => {
        const result = convertMpsToKmh(-5);
        expect(result).toBeCloseTo(-18, 1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            '[convertMpsToKmh] Negative speed value:',
            -5
        );
    });

    it('should handle very small speeds', () => {
        expect(convertMpsToKmh(0.001)).toBeCloseTo(0.0036, 4);
    });

    it('should handle very large speeds', () => {
        expect(convertMpsToKmh(1000)).toBeCloseTo(3600, 0);
    });

    it('should throw TypeError for non-number input', () => {
        expect(() => convertMpsToKmh(/** @type {any} */('5'))).toThrow(TypeError);
        expect(() => convertMpsToKmh(/** @type {any} */('5'))).toThrow('Expected mps to be a number, received string');
        expect(() => convertMpsToKmh(/** @type {any} */(null))).toThrow(TypeError);
        expect(() => convertMpsToKmh(/** @type {any} */(undefined))).toThrow(TypeError);
        expect(() => convertMpsToKmh(/** @type {any} */({}))).toThrow(TypeError);
        expect(() => convertMpsToKmh(/** @type {any} */([]))).toThrow(TypeError);
    });

    it('should throw TypeError for NaN input', () => {
        expect(() => convertMpsToKmh(NaN)).toThrow(TypeError);
        expect(() => convertMpsToKmh(NaN)).toThrow('Expected mps to be a number, received number');
    });

    it('should handle decimal values correctly', () => {
        expect(convertMpsToKmh(2.5)).toBeCloseTo(9, 0);
        expect(convertMpsToKmh(13.89)).toBeCloseTo(50, 0);
    });
});
