import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getErrorInfo } from '../../../utils/logging/getErrorInfo.js';

describe('getErrorInfo.js - Error Information Extraction Utility', () => {
    beforeEach(() => {
        // Clear any mocks
        vi.clearAllMocks();
    });

    describe('Standard Error Objects', () => {
        it('should extract message and stack from Error object', () => {
            const error = new Error('Test error message');
            const result = getErrorInfo(error);

            expect(result.message).toBe('Test error message');
            expect(result.stack).toBeDefined();
            expect(typeof result.stack).toBe('string');
            expect(result.stack).toContain('Test error message');
        });

        it('should extract message and stack from TypeError', () => {
            const error = new TypeError('Type error message');
            const result = getErrorInfo(error);

            expect(result.message).toBe('Type error message');
            expect(result.stack).toBeDefined();
            expect(typeof result.stack).toBe('string');
        });

        it('should extract message and stack from ReferenceError', () => {
            const error = new ReferenceError('Reference error message');
            const result = getErrorInfo(error);

            expect(result.message).toBe('Reference error message');
            expect(result.stack).toBeDefined();
            expect(typeof result.stack).toBe('string');
        });

        it('should extract message and stack from SyntaxError', () => {
            const error = new SyntaxError('Syntax error message');
            const result = getErrorInfo(error);

            expect(result.message).toBe('Syntax error message');
            expect(result.stack).toBeDefined();
            expect(typeof result.stack).toBe('string');
        });
    });

    describe('Custom Error Objects', () => {
        it('should extract message and stack from custom error-like object', () => {
            const customError = {
                message: 'Custom error message',
                stack: 'Custom stack trace\n    at someFunction'
            };
            const result = getErrorInfo(customError);

            expect(result.message).toBe('Custom error message');
            expect(result.stack).toBe('Custom stack trace\n    at someFunction');
        });

        it('should handle error object with only message', () => {
            const errorWithoutStack = {
                message: 'Error without stack'
            };
            const result = getErrorInfo(errorWithoutStack);

            expect(result.message).toBe('Error without stack');
            expect(result.stack).toBeUndefined();
        });

        it('should handle error object with only stack', () => {
            const errorWithoutMessage = {
                stack: 'Stack without message'
            };
            const result = getErrorInfo(errorWithoutMessage);

            expect(result.message).toBe('[object Object]'); // String conversion of object
            expect(result.stack).toBe('Stack without message');
        });

        it('should handle error object with non-string message', () => {
            const errorWithNumberMessage = {
                message: 404,
                stack: 'Stack trace here'
            };
            const result = getErrorInfo(errorWithNumberMessage);

            expect(result.message).toBe('[object Object]'); // String conversion of object
            expect(result.stack).toBe('Stack trace here');
        });

        it('should handle error object with non-string stack', () => {
            const errorWithNonStringStack = {
                message: 'Valid message',
                stack: { notAString: true }
            };
            const result = getErrorInfo(errorWithNonStringStack);

            expect(result.message).toBe('Valid message');
            expect(result.stack).toBeUndefined();
        });
    });

    describe('Edge Cases with Objects', () => {
        it('should handle empty object', () => {
            const emptyObject = {};
            const result = getErrorInfo(emptyObject);

            expect(result.message).toBe('[object Object]');
            expect(result.stack).toBeUndefined();
        });

        it('should handle object with other properties', () => {
            const objectWithOtherProps = {
                name: 'CustomError',
                code: 500,
                details: 'Some additional details'
            };
            const result = getErrorInfo(objectWithOtherProps);

            expect(result.message).toBe('[object Object]');
            expect(result.stack).toBeUndefined();
        });

        it('should handle nested object', () => {
            const nestedObject = {
                error: {
                    message: 'Nested error',
                    stack: 'Nested stack'
                }
            };
            const result = getErrorInfo(nestedObject);

            expect(result.message).toBe('[object Object]');
            expect(result.stack).toBeUndefined();
        });

        it('should handle object with circular reference', () => {
            const circularObject: any = {
                message: 'Circular error'
            };
            circularObject.self = circularObject;

            const result = getErrorInfo(circularObject);

            expect(result.message).toBe('Circular error');
            expect(result.stack).toBeUndefined();
        });
    });

    describe('Primitive Values', () => {
        it('should handle string value', () => {
            const stringError = 'Simple string error';
            const result = getErrorInfo(stringError);

            expect(result.message).toBe('Simple string error');
            expect(result.stack).toBeUndefined();
        });

        it('should handle number value', () => {
            const numberError = 404;
            const result = getErrorInfo(numberError);

            expect(result.message).toBe('404');
            expect(result.stack).toBeUndefined();
        });

        it('should handle boolean value', () => {
            const booleanError = true;
            const result = getErrorInfo(booleanError);

            expect(result.message).toBe('true');
            expect(result.stack).toBeUndefined();
        });

        it('should handle symbol value', () => {
            const symbolError = Symbol('error symbol');
            const result = getErrorInfo(symbolError);

            expect(result.message).toBe('Symbol(error symbol)');
            expect(result.stack).toBeUndefined();
        });

        it('should handle bigint value', () => {
            const bigintError = BigInt(123456789);
            const result = getErrorInfo(bigintError);

            expect(result.message).toBe('123456789');
            expect(result.stack).toBeUndefined();
        });
    });

    describe('Special Values', () => {
        it('should handle null value', () => {
            const result = getErrorInfo(null);

            expect(result.message).toBe('null');
            expect(result.stack).toBeUndefined();
        });

        it('should handle undefined value', () => {
            const result = getErrorInfo(undefined);

            expect(result.message).toBe('undefined');
            expect(result.stack).toBeUndefined();
        });

        it('should handle NaN value', () => {
            const result = getErrorInfo(NaN);

            expect(result.message).toBe('NaN');
            expect(result.stack).toBeUndefined();
        });

        it('should handle Infinity value', () => {
            const result = getErrorInfo(Infinity);

            expect(result.message).toBe('Infinity');
            expect(result.stack).toBeUndefined();
        });

        it('should handle negative Infinity value', () => {
            const result = getErrorInfo(-Infinity);

            expect(result.message).toBe('-Infinity');
            expect(result.stack).toBeUndefined();
        });
    });

    describe('Arrays and Functions', () => {
        it('should handle array value', () => {
            const arrayError = ['error', 'in', 'array'];
            const result = getErrorInfo(arrayError);

            expect(result.message).toBe('error,in,array');
            expect(result.stack).toBeUndefined();
        });

        it('should handle empty array', () => {
            const emptyArrayError = [];
            const result = getErrorInfo(emptyArrayError);

            expect(result.message).toBe('');
            expect(result.stack).toBeUndefined();
        });

        it('should handle function value', () => {
            const functionError = function testFunction() { return 'error'; };
            const result = getErrorInfo(functionError);

            expect(result.message).toContain('function testFunction');
            expect(result.stack).toBeUndefined();
        });

        it('should handle arrow function value', () => {
            const arrowFunctionError = () => 'error';
            const result = getErrorInfo(arrowFunctionError);

            expect(result.message).toContain('=>');
            expect(result.stack).toBeUndefined();
        });
    });

    describe('Complex Objects', () => {
        it('should handle Date object', () => {
            const dateError = new Date('2023-01-01');
            const result = getErrorInfo(dateError);

            // The Date's string representation includes the year
            expect(result.message).toContain(dateError.getFullYear().toString());
            expect(result.stack).toBeUndefined();
        });

        it('should handle RegExp object', () => {
            const regexError = /test.*error/gi;
            const result = getErrorInfo(regexError);

            expect(result.message).toBe('/test.*error/gi');
            expect(result.stack).toBeUndefined();
        });

        it('should handle Map object', () => {
            const mapError = new Map([['key', 'value']]);
            const result = getErrorInfo(mapError);

            expect(result.message).toBe('[object Map]');
            expect(result.stack).toBeUndefined();
        });

        it('should handle Set object', () => {
            const setError = new Set(['value1', 'value2']);
            const result = getErrorInfo(setError);

            expect(result.message).toBe('[object Set]');
            expect(result.stack).toBeUndefined();
        });
    });

    describe('Real-world Error Scenarios', () => {
        it('should handle axios-like error object', () => {
            const axiosError = {
                message: 'Request failed with status code 404',
                stack: 'Error: Request failed\n    at XMLHttpRequest.handleError',
                response: {
                    status: 404,
                    data: { error: 'Not found' }
                }
            };
            const result = getErrorInfo(axiosError);

            expect(result.message).toBe('Request failed with status code 404');
            expect(result.stack).toBe('Error: Request failed\n    at XMLHttpRequest.handleError');
        });

        it('should handle Node.js system error', () => {
            const systemError = {
                message: 'ENOENT: no such file or directory',
                stack: 'Error: ENOENT\n    at Object.openSync',
                code: 'ENOENT',
                errno: -2,
                path: '/nonexistent/file.txt'
            };
            const result = getErrorInfo(systemError);

            expect(result.message).toBe('ENOENT: no such file or directory');
            expect(result.stack).toBe('Error: ENOENT\n    at Object.openSync');
        });

        it('should handle DOM exception-like object', () => {
            const domError = {
                message: 'Failed to execute "querySelector" on "Document"',
                stack: 'DOMException: Failed to execute\n    at Document.querySelector',
                name: 'DOMException'
            };
            const result = getErrorInfo(domError);

            expect(result.message).toBe('Failed to execute "querySelector" on "Document"');
            expect(result.stack).toBe('DOMException: Failed to execute\n    at Document.querySelector');
        });
    });

    describe('Performance and Memory', () => {
        it('should handle multiple calls efficiently', () => {
            const errors = [
                new Error('Error 1'),
                new TypeError('Error 2'),
                'String error',
                { message: 'Object error' },
                null,
                undefined
            ];

            const results = errors.map(err => getErrorInfo(err));

            expect(results).toHaveLength(6);
            expect(results[0].message).toBe('Error 1');
            expect(results[1].message).toBe('Error 2');
            expect(results[2].message).toBe('String error');
            expect(results[3].message).toBe('Object error');
            expect(results[4].message).toBe('null');
            expect(results[5].message).toBe('undefined');
        });

        it('should not modify the original error object', () => {
            const originalError = {
                message: 'Original message',
                stack: 'Original stack',
                code: 500
            };
            const originalCopy = { ...originalError };

            getErrorInfo(originalError);

            expect(originalError).toEqual(originalCopy);
        });
    });

    describe('Return Value Structure', () => {
        it('should always return an object with message property', () => {
            const testCases = [
                new Error('test'),
                'string error',
                123,
                null,
                undefined,
                {},
                []
            ];

            testCases.forEach(testCase => {
                const result = getErrorInfo(testCase);
                expect(result).toBeTypeOf('object');
                expect(result).toHaveProperty('message');
                expect(typeof result.message).toBe('string');
            });
        });

        it('should have stack property as string or undefined', () => {
            const testCases = [
                new Error('test'),
                { message: 'test', stack: 'stack' },
                'string error',
                null
            ];

            testCases.forEach(testCase => {
                const result = getErrorInfo(testCase);
                if (result.stack !== undefined) {
                    expect(typeof result.stack).toBe('string');
                }
            });
        });

        it('should not have additional properties', () => {
            const error = {
                message: 'test message',
                stack: 'test stack',
                extraProperty: 'should not be included'
            };

            const result = getErrorInfo(error);
            const keys = Object.keys(result);

            expect(keys).toContain('message');
            expect(keys.length).toBeLessThanOrEqual(2); // message and optionally stack
            expect(result).not.toHaveProperty('extraProperty');
        });
    });
});
