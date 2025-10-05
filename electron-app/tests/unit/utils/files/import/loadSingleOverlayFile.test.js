/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSingleOverlayFile } from '../../../../../utils/files/import/loadSingleOverlayFile.js';

describe('loadSingleOverlayFile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
		/** @type {any} */(globalThis).electronAPI = undefined;
    });

    it('should load file using File.arrayBuffer when available', async () => {
        const mockArrayBuffer = new ArrayBuffer(100);
        const mockFitData = {
            recordMesgs: [
                { positionLat: 40.7, positionLong: -74.0 },
                { positionLat: 40.8, positionLong: -74.1 }
            ]
        };

        const mockFile = {
            name: 'test.fit',
            arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
        };

		/** @type {any} */(globalThis).electronAPI = {
            decodeFitFile: vi.fn().mockResolvedValue(mockFitData)
        };

        const result = await loadSingleOverlayFile(/** @type {any} */(mockFile));

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockFitData);
        expect(mockFile.arrayBuffer).toHaveBeenCalled();
    });

    it('should fall back to Response when arrayBuffer is not available', async () => {
        const mockArrayBuffer = new ArrayBuffer(100);
        const mockFitData = {
            recordMesgs: [
                { positionLat: 40.7, positionLong: -74.0 }
            ]
        };

        const mockFile = {
            name: 'test.fit'
            // No arrayBuffer method
        };

		// Mock Response
		/** @type {any} */(globalThis).Response = vi.fn().mockImplementation((file) => ({
            arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
        }));

		/** @type {any} */(globalThis).electronAPI = {
            decodeFitFile: vi.fn().mockResolvedValue(mockFitData)
        };

        const result = await loadSingleOverlayFile(/** @type {any} */(mockFile));

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockFitData);
    });

    it('should fall back to FileReader when Response fails', async () => {
        const mockArrayBuffer = new ArrayBuffer(100);
        const mockFitData = {
            recordMesgs: [
                { positionLat: 40.7, positionLong: -74.0 }
            ]
        };

        const mockFile = {
            name: 'test.fit'
        };

		// Mock Response to throw
		/** @type {any} */(globalThis).Response = vi.fn().mockImplementation(() => {
            throw new Error('Response failed');
        });

        // Mock FileReader
        let loadHandler = /** @type {any} */(null);
		/** @type {any} */(globalThis).FileReader = vi.fn().mockImplementation(() => ({
            addEventListener: vi.fn((event, handler) => {
                if (event === 'load') loadHandler = handler;
            }),
            readAsArrayBuffer: vi.fn(function () {
                setTimeout(() => {
                    loadHandler({ target: { result: mockArrayBuffer } });
                }, 0);
            }),
            onerror: null
        }));

		/** @type {any} */(globalThis).electronAPI = {
            decodeFitFile: vi.fn().mockResolvedValue(mockFitData)
        };

        const result = await loadSingleOverlayFile(/** @type {any} */(mockFile));

        expect(result.success).toBe(true);
    });

    it('should return error when decoder is not available', async () => {
        const mockArrayBuffer = new ArrayBuffer(100);
        const mockFile = {
            name: 'test.fit',
            arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
        };

        // No electronAPI
        const result = await loadSingleOverlayFile(/** @type {any} */(mockFile));

        expect(result.success).toBe(false);
        expect(result.error).toContain('decoder not available');
    });

    it('should return error when fit file has no location data', async () => {
        const mockArrayBuffer = new ArrayBuffer(100);
        const mockFitData = {
            recordMesgs: []
        };

        const mockFile = {
            name: 'test.fit',
            arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
        };

		/** @type {any} */(globalThis).electronAPI = {
            decodeFitFile: vi.fn().mockResolvedValue(mockFitData)
        };

        const result = await loadSingleOverlayFile(/** @type {any} */(mockFile));

        expect(result.success).toBe(false);
        expect(result.error).toContain('No valid location data');
    });

    it('should return error when fit decode fails', async () => {
        const mockArrayBuffer = new ArrayBuffer(100);
        const mockFile = {
            name: 'test.fit',
            arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
        };

		/** @type {any} */(globalThis).electronAPI = {
            decodeFitFile: vi.fn().mockResolvedValue({ error: 'Decode failed' })
        };

        const result = await loadSingleOverlayFile(/** @type {any} */(mockFile));

        expect(result.success).toBe(false);
        expect(result.error).toBe('Decode failed');
    });

    it('should handle exceptions during file processing', async () => {
        const mockFile = {
            name: 'test.fit',
            arrayBuffer: vi.fn().mockRejectedValue(new Error('Read error'))
        };

		/** @type {any} */(globalThis).electronAPI = {
            decodeFitFile: vi.fn()
        };

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const result = await loadSingleOverlayFile(/** @type {any} */(mockFile));

        expect(result.success).toBe(false);
        expect(result.error).toContain('Read error');
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });
});
