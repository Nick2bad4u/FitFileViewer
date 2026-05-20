import type { Buffer } from "node:buffer";
import type { FitDecodeResult } from "../../../shared/fit";

export type FitFileIpcHandler = (
    event: unknown,
    arrayBuffer: unknown
) => Promise<FitDecodeResult>;

export type RegisterIpcHandle = (
    channel: string,
    handler: FitFileIpcHandler
) => void;

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface FitParserModule {
    decodeFitFile: (buffer: Buffer) => Promise<FitDecodeResult>;
}

export interface RegisterFitFileHandlersOptions {
    registerIpcHandle: RegisterIpcHandle;
    ensureFitParserStateIntegration: () => Promise<void>;
    logWithContext: LogWithContext;
    fitParserModule?: FitParserModule;
}

export function registerFitFileHandlers(
    options: RegisterFitFileHandlersOptions
): void;
