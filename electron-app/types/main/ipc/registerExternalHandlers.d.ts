/**
 * Registers IPC handlers for external integrations (shell and Gyazo server control).
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.shellRef
 * @param {(port?: number) => Promise<any>} options.startGyazoOAuthServer
 * @param {() => Promise<any>} options.stopGyazoOAuthServer
 * @param {(payload: { clientId: string; clientSecret: string; code: string; redirectUri: string; tokenUrl: string }) => Promise<any>} [options.exchangeGyazoToken]
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 */
export function registerExternalHandlers(options: {
    registerIpcHandle: (channel: string, handler: Function) => void;
    shellRef: () => any;
    startGyazoOAuthServer: (port?: number) => Promise<any>;
    stopGyazoOAuthServer: () => Promise<any>;
    exchangeGyazoToken?: (payload: {
        clientId: string;
        clientSecret: string;
        code: string;
        redirectUri: string;
        tokenUrl: string;
    }) => Promise<any>;
    logWithContext: (level: "error" | "warn" | "info", message: string, context?: Record<string, any>) => void;
}): void;
export function wireExternalHandlers(options?: {}): void;
//# sourceMappingURL=registerExternalHandlers.d.ts.map
