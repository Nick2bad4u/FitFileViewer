/**
 * Provides a mechanism to cancel ongoing async operations like chart rendering
 * when the user navigates away or performs other actions that make the
 * operation irrelevant.
 */
/* eslint-disable max-classes-per-file -- Token and source intentionally share one public utility module. */

import {
    getCancellationTokenRuntime,
    type CancellationTokenRuntime,
} from "./cancellationTokenRuntime.js";

/**
 * Cancellation token for async operations.
 */
export class CancellationToken {
    private _isCancelled = false;
    private _listeners: Array<() => void> = [];

    /**
     * Check if operation is cancelled.
     */
    get isCancelled(): boolean {
        return this._isCancelled;
    }

    /**
     * Cancel the operation.
     */
    cancel(): void {
        if (this._isCancelled) {
            return;
        }

        this._isCancelled = true;

        // Notify all listeners.
        for (const listener of this._listeners) {
            try {
                listener();
            } catch (error) {
                console.error(
                    "[CancellationToken] Error in cancellation callback:",
                    error
                );
            }
        }

        this._listeners = [];
    }

    /**
     * Register a listener to be called when cancelled.
     *
     * @param listener - Listener function.
     *
     * @returns Unsubscribe function.
     *
     * @throws TypeError when listener is not a function.
     */
    onCancel(listener: () => void): () => void {
        if (typeof listener !== "function") {
            throw new TypeError("Listener must be a function");
        }

        if (this._isCancelled) {
            // Already cancelled, call immediately.
            try {
                listener();
            } catch (error) {
                console.error(
                    "[CancellationToken] Error in immediate cancellation callback:",
                    error
                );
            }
            return () => {}; // No-op unsubscribe.
        }

        this._listeners.push(listener);

        // Return unsubscribe function.
        return () => {
            const index = this._listeners.indexOf(listener);
            if (index !== -1) {
                this._listeners.splice(index, 1);
            }
        };
    }

    /**
     * Throw if cancelled.
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
 * Cancellation token source for creating and managing tokens.
 */
export class CancellationTokenSource {
    readonly token = new CancellationToken();

    /**
     * Cancel the token.
     */
    cancel(): void {
        this.token.cancel();
    }

    /**
     * Dispose of the token source.
     */
    dispose(): void {
        this.cancel();
    }
}

/* eslint-enable max-classes-per-file */

/**
 * Create a cancellation token that automatically cancels after a timeout
 *
 * @param timeout - Timeout in milliseconds.
 *
 * @returns Cancellation token source.
 */
export function createTimeoutCancellationToken(
    timeout: number,
    runtime: CancellationTokenRuntime = getCancellationTokenRuntime()
): CancellationTokenSource {
    const source = new CancellationTokenSource();

    const timeoutId = runtime.setTimeout(() => {
        source.cancel();
    }, timeout);
    source.token.onCancel(() => {
        runtime.clearTimeout(timeoutId);
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
    token?: CancellationToken,
    runtime: CancellationTokenRuntime = getCancellationTokenRuntime()
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (token?.isCancelled) {
            reject(new Error("Operation was cancelled"));
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const timeoutId = runtime.setTimeout(() => {
            if (unsubscribe) {
                unsubscribe();
            }
            resolve();
        }, ms);

        if (token) {
            unsubscribe = token.onCancel(() => {
                runtime.clearTimeout(timeoutId);
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
