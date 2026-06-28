import type { RendererRuntimeInfo } from "./rendererRuntimeInfoTypes.js";

type RendererStartupInfoLogLevel = "group" | "groupEnd" | "log";

type RendererStartupInfoLogger = (
    level: RendererStartupInfoLogLevel,
    ...args: unknown[]
) => void;

export type RendererStartupRuntimeInfo = RendererRuntimeInfo;

type RendererAppInfo = {
    readonly getRuntimeInfo: () => RendererStartupRuntimeInfo;
    readonly name: string;
    readonly version: string;
};

type RendererStartupInfoOptions = {
    readonly appInfo: RendererAppInfo;
    readonly environment: string;
    readonly logRenderer: RendererStartupInfoLogger;
};

/** Logs the renderer startup banner from a focused bootstrap helper. */
export function logRendererStartupInfo({
    appInfo,
    environment,
    logRenderer,
}: RendererStartupInfoOptions): void {
    logRenderer("group", "[Renderer] Application Startup");
    logRenderer("log", "App:", appInfo.name, `v${appInfo.version}`);
    logRenderer("log", "Environment:", environment);
    logRenderer("log", "Runtime Info:", appInfo.getRuntimeInfo());
    logRenderer("groupEnd");
}
