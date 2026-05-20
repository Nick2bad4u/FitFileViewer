export interface ExternalShell {
    openExternal: (url: string) => Promise<void>;
}

export interface GyazoServerStartResult {
    success: boolean;
    message: string;
    port?: number;
}

export interface GyazoServerStopResult {
    success: boolean;
    message: string;
}

export type RegisterExternalIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => unknown;

export type RegisterExternalIpcHandle = (
    channel: string,
    handler: RegisterExternalIpcHandler
) => void;

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface RegisterExternalHandlersOptions {
    registerIpcHandle: RegisterExternalIpcHandle;
    shellRef?: () => ExternalShell | null | undefined;
    startGyazoOAuthServer?: (
        port?: number
    ) => Promise<GyazoServerStartResult>;
    stopGyazoOAuthServer?: () => Promise<GyazoServerStopResult>;
    logWithContext?: LogWithContext;
}

/**
 * Registers IPC handlers for external integrations (shell and Gyazo server
 * control).
 */
export function registerExternalHandlers(
    options: RegisterExternalHandlersOptions
): void;
