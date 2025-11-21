/**
 * Create a cancellation token that automatically cancels after a timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {CancellationTokenSource}
 */
export function createTimeoutCancellationToken(timeout: number): CancellationTokenSource;
/**
 * Delay with cancellation support
 * @param {number} ms - Milliseconds to wait
 * @param {CancellationToken} [token] - Optional cancellation token
 * @returns {Promise<void>}
 */
export function delay(ms: number, token?: CancellationToken): Promise<void>;
/**
 * Check if an error is a cancellation error
 * @param {any} error - Error to check
 * @returns {boolean}
 */
export function isCancellationError(error: any): boolean;
/**
 * @fileoverview Cancellation Token System for Async Operations
 * @description Provides a mechanism to cancel ongoing async operations like chart rendering
 * when the user navigates away or performs other actions that make the operation irrelevant.
 */
/**
 * Cancellation token for async operations
 */
export class CancellationToken {
    _isCancelled: boolean;
    /**
     * Check if operation is cancelled
     * @returns {boolean}
     */
    get isCancelled(): boolean;
    /** @type {boolean} */
    /** @type {Array<() => void>} */
    _callbacks: Array<() => void>;
    /**
     * Cancel the operation
     */
    cancel(): void;
    /**
     * Register a callback to be called when cancelled
     * @param {() => void} callback - Callback function
     * @returns {() => void} Unsubscribe function
     */
    onCancel(callback: () => void): () => void;
    /**
     * Throw if cancelled
     * @throws {Error} If operation is cancelled
     */
    throwIfCancelled(): void;
}
/**
 * Cancellation token source for creating and managing tokens
 */
export class CancellationTokenSource {
    /** @type {CancellationToken} */
    token: CancellationToken;
    /**
     * Cancel the token
     */
    cancel(): void;
    /**
     * Dispose of the token source
     */
    dispose(): void;
}
//# sourceMappingURL=cancellationToken.d.ts.map
