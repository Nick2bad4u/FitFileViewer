/**
 * @fileoverview Cancellation Token System for Async Operations
 * @description Provides a mechanism to cancel ongoing async operations like chart rendering
 * when the user navigates away or performs other actions that make the operation irrelevant.
 */

/**
 * Cancellation token for async operations
 */
export class CancellationToken {
    _isCancelled = false;

    /**
     * Check if operation is cancelled
     * @returns {boolean}
     */
    get isCancelled() {
        return this._isCancelled;
    }

    constructor() {
        /** @type {boolean} */

        /** @type {Array<() => void>} */
        this._callbacks = [];
    }

    /**
     * Cancel the operation
     */
    cancel() {
        if (this._isCancelled) {
            return;
        }

        this._isCancelled = true;

        // Notify all callbacks
        for (const callback of this._callbacks) {
            try {
                callback();
            } catch (error) {
                console.error("[CancellationToken] Error in cancellation callback:", error);
            }
        }

        this._callbacks = [];
    }

    /**
     * Register a callback to be called when cancelled
     * @param {() => void} callback - Callback function
     * @returns {() => void} Unsubscribe function
     */
    onCancel(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function");
        }

        if (this._isCancelled) {
            // Already cancelled, call immediately
            try {
                callback();
            } catch (error) {
                console.error("[CancellationToken] Error in immediate cancellation callback:", error);
            }
            return () => {}; // No-op unsubscribe
        }

        this._callbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this._callbacks.indexOf(callback);
            if (index !== -1) {
                this._callbacks.splice(index, 1);
            }
        };
    }
    /**
     * Throw if cancelled
     * @throws {Error} If operation is cancelled
     */
    throwIfCancelled() {
        if (this._isCancelled) {
            throw new Error("Operation was cancelled");
        }
    }
}

/**
 * Cancellation token source for creating and managing tokens
 */
export class CancellationTokenSource {
    constructor() {
        /** @type {CancellationToken} */
        this.token = new CancellationToken();
    }

    /**
     * Cancel the token
     */
    cancel() {
        this.token.cancel();
    }

    /**
     * Dispose of the token source
     */
    dispose() {
        this.cancel();
    }
}

/**
 * Create a cancellation token that automatically cancels after a timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {CancellationTokenSource}
 */
export function createTimeoutCancellationToken(timeout) {
    const source = new CancellationTokenSource();

    setTimeout(() => {
        source.cancel();
    }, timeout);

    return source;
}

/**
 * Delay with cancellation support
 * @param {number} ms - Milliseconds to wait
 * @param {CancellationToken} [token] - Optional cancellation token
 * @returns {Promise<void>}
 */
export async function delay(ms, token) {
    return new Promise((resolve, reject) => {
        if (token?.isCancelled) {
            reject(new Error("Operation was cancelled"));
            return;
        }

        let unsubscribe;

        const timeoutId = setTimeout(() => {
            if (unsubscribe) {
                unsubscribe();
            }
            resolve();
        }, ms);

        if (token) {
            unsubscribe = token.onCancel(() => {
                clearTimeout(timeoutId);
                reject(new Error("Operation was cancelled"));
            });
        }
    });
}

/**
 * Check if an error is a cancellation error
 * @param {any} error - Error to check
 * @returns {boolean}
 */
export function isCancellationError(error) {
    return error instanceof Error && error.message === "Operation was cancelled";
}
