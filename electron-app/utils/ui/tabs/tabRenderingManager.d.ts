/** Cancellation token passed to tab render operations. */
export type TabRenderCancellationToken = {
    readonly isCancelled: boolean;
};

/** Options controlling tab render operation scheduling. */
export type TabRenderOperationOptions = {
    readonly debounce?: boolean;
    readonly skipIfRecent?: boolean;
};

/** Rendering manager surface used by tab state handlers. */
export type TabRenderingManager = {
    executeRenderOperation(
        tabName: string,
        operation: (token: TabRenderCancellationToken) => Promise<unknown>,
        options?: TabRenderOperationOptions
    ): Promise<unknown>;
};

/** Singleton tab rendering manager instance. */
export const tabRenderingManager: TabRenderingManager;
export default tabRenderingManager;
