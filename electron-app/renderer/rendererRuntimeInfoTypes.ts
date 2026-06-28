export type RendererRuntimeMemoryUsage = Readonly<{
    readonly jsHeapSizeLimit: number | undefined;
    readonly totalJSHeapSize: number | undefined;
    readonly usedJSHeapSize: number | undefined;
}>;

export type RendererRuntimeInfo = Readonly<{
    readonly cookieEnabled: boolean;
    readonly hardwareConcurrency: number | undefined;
    readonly language: string | undefined;
    readonly memoryUsage: RendererRuntimeMemoryUsage | null;
    readonly onLine: boolean | undefined;
    readonly platform: string | undefined;
    readonly userAgent: string | undefined;
}>;
