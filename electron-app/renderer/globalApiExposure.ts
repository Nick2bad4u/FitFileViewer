type RendererGlobalApiExposureLogLevel = "group" | "groupEnd" | "log";

type RendererGlobalApiExposureLogger = (
    level: RendererGlobalApiExposureLogLevel,
    ...args: unknown[]
) => void;

type RendererAppInfo = {
    readonly getRuntimeInfo: () => unknown;
    readonly name: string;
    readonly version: string;
};

type RendererGlobalApiExposureOptions = {
    readonly appInfo: RendererAppInfo;
    readonly createExportGPXButton: unknown;
    readonly resetStateInitializationForTests: () => void;
    readonly scope?: typeof globalThis;
};

type RendererStartupInfoOptions = {
    readonly appInfo: RendererAppInfo;
    readonly environment: string;
    readonly logRenderer: RendererGlobalApiExposureLogger;
};

/**
 * Exposes the narrow legacy renderer globals that remain required by older UI
 * paths and tests.
 */
export function installRendererGlobalApiExposure({
    appInfo,
    createExportGPXButton,
    resetStateInitializationForTests,
    scope = globalThis,
}: RendererGlobalApiExposureOptions): void {
    Reflect.set(scope, "createExportGPXButton", createExportGPXButton);
    Reflect.set(scope, "APP_INFO", appInfo);
    Reflect.set(
        scope,
        "__resetRendererStateInitializationForTests",
        resetStateInitializationForTests
    );
}

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
