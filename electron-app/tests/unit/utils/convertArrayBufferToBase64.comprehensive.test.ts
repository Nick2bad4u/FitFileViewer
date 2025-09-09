/**
 * @fileoverview Comprehensive test suite for convertArrayBufferToBase64 utility function
 *
 * Test Categories:
 * - Input Validation: Type checking, error handling for invalid inputs
 * - Basic Conversion: Simple ArrayBuffer to Base64 conversion
 * - Edge Cases: Empty buffers, single bytes, various sizes
 * - Large Buffer Handling: Chunked processing for large data
 * - Data Integrity: Round-trip conversion verification
 * - Performance: Efficient processing without stack overflow
 * - Real-world Scenarios: Typical FIT file usage patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { convertArrayBufferToBase64 } from '../../../utils/formatting/converters/convertArrayBufferToBase64.js';

// Mock console to avoid cluttering test output
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Setup global console mock
beforeEach(() => {
  globalThis.console = mockConsole as any;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('convertArrayBufferToBase64.js - ArrayBuffer to Base64 Converter Utility', () => {

  describe('Input Validation', () => {
    it('should throw TypeError for null input', () => {
      expect(() => convertArrayBufferToBase64(null as any)).toThrow(TypeError);
      expect(() => convertArrayBufferToBase64(null as any)).toThrow('Expected ArrayBuffer, received object');
    });

    it('should throw TypeError for undefined input', () => {
      expect(() => convertArrayBufferToBase64(undefined as any)).toThrow(TypeError);
      expect(() => convertArrayBufferToBase64(undefined as any)).toThrow('Expected ArrayBuffer, received undefined');
    });

    it('should throw TypeError for string input', () => {
      expect(() => convertArrayBufferToBase64('not a buffer' as any)).toThrow(TypeError);
      expect(() => convertArrayBufferToBase64('not a buffer' as any)).toThrow('Expected ArrayBuffer, received string');
    });

    it('should throw TypeError for number input', () => {
      expect(() => convertArrayBufferToBase64(123 as any)).toThrow(TypeError);
      expect(() => convertArrayBufferToBase64(123 as any)).toThrow('Expected ArrayBuffer, received number');
    });

    it('should throw TypeError for object input', () => {
      expect(() => convertArrayBufferToBase64({} as any)).toThrow(TypeError);
      expect(() => convertArrayBufferToBase64({} as any)).toThrow('Expected ArrayBuffer, received object');
    });

    it('should throw TypeError for array input', () => {
      expect(() => convertArrayBufferToBase64([] as any)).toThrow(TypeError);
      expect(() => convertArrayBufferToBase64([] as any)).toThrow('Expected ArrayBuffer, received object');
    });

    it('should throw TypeError for Uint8Array input', () => {
      const uint8Array = new Uint8Array([1, 2, 3]);
      expect(() => convertArrayBufferToBase64(uint8Array as any)).toThrow(TypeError);
      expect(() => convertArrayBufferToBase64(uint8Array as any)).toThrow('Expected ArrayBuffer, received object');
    });
  });

  describe('Basic Conversion', () => {
    it('should convert simple ArrayBuffer to Base64', () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 72;  // 'H'
      view[1] = 101; // 'e'
      view[2] = 108; // 'l'
      view[3] = 108; // 'l'

      const result = convertArrayBufferToBase64(buffer);
      expect(result).toBe('SGVsbA=='); // Base64 for 'Hell'
    });

    it('should convert single byte ArrayBuffer', () => {
      const buffer = new ArrayBuffer(1);
      const view = new Uint8Array(buffer);
      view[0] = 65; // 'A'

      const result = convertArrayBufferToBase64(buffer);
      expect(result).toBe('QQ=='); // Base64 for 'A'
    });

    it('should convert two byte ArrayBuffer', () => {
      const buffer = new ArrayBuffer(2);
      const view = new Uint8Array(buffer);
      view[0] = 65; // 'A'
      view[1] = 66; // 'B'

      const result = convertArrayBufferToBase64(buffer);
      expect(result).toBe('QUI='); // Base64 for 'AB'
    });

    it('should convert three byte ArrayBuffer', () => {
      const buffer = new ArrayBuffer(3);
      const view = new Uint8Array(buffer);
      view[0] = 65; // 'A'
      view[1] = 66; // 'B'
      view[2] = 67; // 'C'

      const result = convertArrayBufferToBase64(buffer);
      expect(result).toBe('QUJD'); // Base64 for 'ABC'
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      const result = convertArrayBufferToBase64(buffer);
      expect(result).toBe('');
    });

    it('should handle ArrayBuffer with all zeros', () => {
      const buffer = new ArrayBuffer(4);
      // Uint8Array initializes to zeros by default
      const result = convertArrayBufferToBase64(buffer);
      expect(result).toBe('AAAAAA==');
    });

    it('should handle ArrayBuffer with all 255s', () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view.fill(255);

      const result = convertArrayBufferToBase64(buffer);
      expect(result).toBe('/////w==');
    });

    it('should handle ArrayBuffer with random byte values', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view[0] = 123;
      view[1] = 45;
      view[2] = 67;
      view[3] = 89;
      view[4] = 234;
      view[5] = 156;
      view[6] = 78;
      view[7] = 90;

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Large Buffer Handling', () => {
    it('should handle buffer larger than chunk size (32KB)', () => {
      const bufferSize = 0x8000 + 1000; // 32KB + 1000 bytes
      const buffer = new ArrayBuffer(bufferSize);
      const view = new Uint8Array(buffer);

      // Fill with pattern to verify integrity
      for (let i = 0; i < bufferSize; i++) {
        view[i] = i % 256;
      }

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Base64 length should be roughly 4/3 of input length
      const expectedLength = Math.ceil(bufferSize * 4 / 3 / 4) * 4;
      expect(result.length).toBe(expectedLength);
    });

    it('should handle buffer exactly chunk size (32KB)', () => {
      const bufferSize = 0x8000; // Exactly 32KB
      const buffer = new ArrayBuffer(bufferSize);
      const view = new Uint8Array(buffer);
      view.fill(42); // Fill with arbitrary value

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple chunks correctly', () => {
      const bufferSize = 0x8000 * 2.5; // 2.5 chunks
      const buffer = new ArrayBuffer(Math.floor(bufferSize));
      const view = new Uint8Array(buffer);

      // Fill each chunk with different pattern
      for (let i = 0; i < view.length; i++) {
        view[i] = Math.floor(i / 0x8000) + 65; // Different letter per chunk
      }

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should not cause stack overflow with very large buffers', () => {
      const bufferSize = 0x8000 * 5; // 5 chunks (160KB)
      const buffer = new ArrayBuffer(bufferSize);

      // This should not throw due to stack overflow
      expect(() => convertArrayBufferToBase64(buffer)).not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should produce consistent results for same input', () => {
      const buffer = new ArrayBuffer(100);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < 100; i++) {
        view[i] = i;
      }

      const result1 = convertArrayBufferToBase64(buffer);
      const result2 = convertArrayBufferToBase64(buffer);
      expect(result1).toBe(result2);
    });

    it('should handle different patterns correctly', () => {
      // Test ascending pattern
      const buffer1 = new ArrayBuffer(10);
      const view1 = new Uint8Array(buffer1);
      for (let i = 0; i < 10; i++) {
        view1[i] = i;
      }
      const result1 = convertArrayBufferToBase64(buffer1);

      // Test descending pattern
      const buffer2 = new ArrayBuffer(10);
      const view2 = new Uint8Array(buffer2);
      for (let i = 0; i < 10; i++) {
        view2[i] = 9 - i;
      }
      const result2 = convertArrayBufferToBase64(buffer2);

      expect(result1).not.toBe(result2);
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });

    it('should handle binary data correctly', () => {
      const buffer = new ArrayBuffer(16);
      const view = new Uint8Array(buffer);
      // Create binary pattern: alternating 0 and 255
      for (let i = 0; i < 16; i++) {
        view[i] = i % 2 === 0 ? 0 : 255;
      }

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Verify it's valid Base64 (only contains valid Base64 characters)
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });
  });

  describe('Performance and Efficiency', () => {
    it('should process small buffers efficiently', () => {
      const buffer = new ArrayBuffer(100);
      const start = Date.now();

      const result = convertArrayBufferToBase64(buffer);

      const end = Date.now();
      expect(end - start).toBeLessThan(10); // Should be very fast
      expect(typeof result).toBe('string');
    });

    it('should handle medium buffers in reasonable time', () => {
      const buffer = new ArrayBuffer(10000); // 10KB
      const start = Date.now();

      const result = convertArrayBufferToBase64(buffer);

      const end = Date.now();
      expect(end - start).toBeLessThan(100); // Should still be fast
      expect(typeof result).toBe('string');
    });

    it('should use chunked processing for efficiency', () => {
      // This test verifies the chunked approach works by using a large buffer
      const buffer = new ArrayBuffer(0x8000 + 100); // Just over chunk size
      const view = new Uint8Array(buffer);
      view.fill(65); // Fill with 'A'

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Should contain expected pattern from chunked processing
      // Since all bytes are 'A' (65), Base64 should contain lots of 'Q' characters
      expect(result).toContain('Q');
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle typical FIT file header buffer', () => {
      // Simulate a typical FIT file header (14 bytes)
      const buffer = new ArrayBuffer(14);
      const view = new Uint8Array(buffer);

      // FIT file header pattern
      view[0] = 14;    // Header size
      view[1] = 0x10;  // Protocol version
      view[2] = 0x20;  // Profile version
      view[3] = 0x00;  // Profile version
      view[4] = 0x00;  // Data size
      view[5] = 0x00;  // Data size
      view[6] = 0x00;  // Data size
      view[7] = 0x00;  // Data size
      view[8] = 0x2E;  // '.FIT' signature
      view[9] = 0x46;  // 'F'
      view[10] = 0x49; // 'I'
      view[11] = 0x54; // 'T'
      view[12] = 0x00; // CRC
      view[13] = 0x00; // CRC

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    it('should handle sensor data buffer', () => {
      // Simulate sensor data payload
      const buffer = new ArrayBuffer(20);
      const view = new Uint8Array(buffer);

      // Fill with realistic sensor values
      view[0] = 150;  // Heart rate
      view[1] = 200;  // Power (low byte)
      view[2] = 1;    // Power (high byte)
      view[3] = 25;   // Speed
      view[4] = 90;   // Cadence
      // Continue with more sensor data...
      for (let i = 5; i < 20; i++) {
        view[i] = Math.floor(Math.random() * 256);
      }

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty FIT record', () => {
      // Empty record scenario
      const buffer = new ArrayBuffer(1);
      const view = new Uint8Array(buffer);
      view[0] = 0; // Empty record header

      const result = convertArrayBufferToBase64(buffer);
      expect(result).toBe('AA=='); // Base64 for single zero byte
    });

    it('should handle multiple record types in sequence', () => {
      // Simulate multiple FIT records
      const buffer = new ArrayBuffer(50);
      const view = new Uint8Array(buffer);

      // Fill with pattern representing different record types
      for (let i = 0; i < 50; i++) {
        view[i] = (i % 10) + 65; // Pattern from 'A' to 'J'
      }

      const result = convertArrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Length should be divisible by 4 (Base64 padding)
      expect(result.length % 4).toBe(0);
    });
  });

  describe('Base64 Format Compliance', () => {
    it('should produce valid Base64 format', () => {
      const buffer = new ArrayBuffer(30);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < 30; i++) {
        view[i] = i * 8;
      }

      const result = convertArrayBufferToBase64(buffer);

      // Valid Base64 pattern: A-Z, a-z, 0-9, +, /, = (padding)
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    it('should have correct padding for different input lengths', () => {
      // Test different lengths that require different padding
      const testLengths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      testLengths.forEach(length => {
        const buffer = new ArrayBuffer(length);
        const view = new Uint8Array(buffer);
        view.fill(65); // Fill with 'A'

        const result = convertArrayBufferToBase64(buffer);

        // Length should be multiple of 4 (with padding)
        expect(result.length % 4).toBe(0);

        // Check correct padding based on input length
        const remainder = length % 3;
        let expectedPadding;
        if (remainder === 1) {
          expectedPadding = 2; // 1 byte → 2 padding chars
        } else if (remainder === 2) {
          expectedPadding = 1; // 2 bytes → 1 padding char
        } else {
          expectedPadding = 0; // 3 bytes → 0 padding chars
        }

        if (expectedPadding > 0) {
          expect(result.endsWith('='.repeat(expectedPadding))).toBe(true);
        } else {
          expect(result.endsWith('=')).toBe(false);
        }
      });
    });

    it('should match browser btoa for simple cases', () => {
      // Test compatibility with standard Base64 encoding
      const testString = 'Hello, World!';
      const buffer = new ArrayBuffer(testString.length);
      const view = new Uint8Array(buffer);

      for (let i = 0; i < testString.length; i++) {
        view[i] = testString.charCodeAt(i);
      }

      const result = convertArrayBufferToBase64(buffer);
      const expected = btoa(testString);

      expect(result).toBe(expected);
    });
  });
});
