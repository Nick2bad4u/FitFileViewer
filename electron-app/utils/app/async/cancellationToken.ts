/**
 * Provides a mechanism to cancel ongoing async operations like chart rendering
 * when the user navigates away or performs other actions that make the
 * operation irrelevant.
 */

/**
 * Cancellation token for async operations
 */
export class CancellationToken {
    private _callbacks: Array<() => void> = [];
    private _isCancelled = false;

    /**
     * Check if operation is cancelled
     */
    get isCancelled(): boolean {
        return this._isCancelled;
    }

    /**
     * Cancel the operation
     */
    cancel(): void {
        if (this._isCancelled) {
            return;
        }

        this._isCancelled = true;

        // Notify all callbacks
        for (const callback of this._callbacks) {
            try {
                callback();
            } catch (error) {
                console.error(
                    "[CancellationToken] Error in cancellation callback:",
                    error
                );
            }
        }

        this._callbacks = [];
    }

    /**
     * Register a callback to be called when cancelled
     *
     * @param callback - Callback function.
     *
     * @returns Unsubscribe function.
     *
     * @throws TypeError when callback is not a function.
     */
    onCancel(callback: () => void): () => void {
        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function");
        }

        if (this._isCancelled) {
            // Already cancelled, call immediately
            try {
                callback();
            } catch (error) {
                console.error(
                    "[CancellationToken] Error in immediate cancellation callback:",
                    error
                );
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
     *
     * @throws Error when the operation is cancelled.
     */
    throwIfCancelled(): void {
        if (this._isCancelled) {
            throw new Error("Operation was cancelled");
        }
    }
}

/**
 * Cancellation token source for creating and managing tokens
 */
export class CancellationTokenSource {
    readonly token = new CancellationToken();

    /**
     * Cancel the token
     */
    cancel(): void {
        this.token.cancel();
    }

    /**
     * Dispose of the token source
     */
    dispose(): void {
        this.cancel();
    }
}

/**
 * Create a cancellation token that automatically cancels after a timeout
 *
 * @param timeout - Timeout in milliseconds.
 *
 * @returns Cancellation token source.
 */
export function createTimeoutCancellationToken(
    timeout: number
): CancellationTokenSource {
    const source = new CancellationTokenSource();

    const timeoutId = setTimeout(() => {
        source.cancel();
    }, timeout);
    source.token.onCancel(() => {
        clearTimeout(timeoutId);
    });

    return source;
}

/**
 * Delay with cancellation support
 *
 * @param ms - Milliseconds to wait.
 * @param token - Optional cancellation token.
 *
 * @returns Promise that resolves after the delay or rejects when cancelled.
 */
export async function delay(
    ms: number,
    token?: CancellationToken
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (token?.isCancelled) {
            reject(new Error("Operation was cancelled"));
            return;
        }

        let unsubscribe: (() => void) | undefined;

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
 *
 * @param error - Error to check.
 *
 * @returns Whether the error represents cancellation.
 */
export function isCancellationError(error: unknown): boolean {
    return (
        error instanceof Error && error.message === "Operation was cancelled"
    );
}
