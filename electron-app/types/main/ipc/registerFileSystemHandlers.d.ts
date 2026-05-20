import type * as fs from "node:fs";

export type RegisterFileSystemIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => unknown;

export type RegisterFileSystemIpcHandle = (
    channel: string,
    handler: RegisterFileSystemIpcHandler
) => void;

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface RegisterFileSystemHandlersOptions {
    registerIpcHandle: RegisterFileSystemIpcHandle;
    fs: Pick<typeof fs, "readFile" | "stat">;
    logWithContext?: LogWithContext;
}

/**
 * Registers IPC handlers for filesystem operations.
 */
export function registerFileSystemHandlers(
    options: RegisterFileSystemHandlersOptions
): void;
