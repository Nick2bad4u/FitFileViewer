/**
 * Registers IPC handlers for external integrations (shell and Gyazo server
 * control).
 *
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.shellRef
 * @param {(port?: number) => Promise<any>} options.startGyazoOAuthServer
 * @param {() => Promise<any>} options.stopGyazoOAuthServer
 * @param {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, any>
 * ) => void} options.logWithContext
 */
export function registerExternalHandlers({
    registerIpcHandle,
    shellRef,
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
    logWithContext,
}: {
    registerIpcHandle: (channel: string, handler: Function) => void;
    shellRef: () => any;
    startGyazoOAuthServer: (port?: number) => Promise<any>;
    stopGyazoOAuthServer: () => Promise<any>;
    logWithContext: (
        level: "error" | "warn" | "info",
        message: string,
        context?: Record<string, any>
    ) => void;
}): void;
