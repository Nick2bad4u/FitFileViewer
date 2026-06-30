export type ExportZipFileOptions = {
    base64?: boolean;
};

export type ExportZipLike = {
    file: (
        name: string,
        data: Blob | string,
        options?: ExportZipFileOptions
    ) => ExportZipLike;
    generateAsync: (options: { type: "blob" }) => Promise<Blob>;
};

export type ExportZipConstructor = new () => ExportZipLike;

type ExportZipRuntimeRegistry = {
    constructor?: unknown;
};

const exportZipRuntimeRegistry: ExportZipRuntimeRegistry = {};

export function setExportZipRuntime(constructor: unknown): void {
    exportZipRuntimeRegistry.constructor = constructor;
}

export function registerExportZipRuntime(
    constructor: ExportZipConstructor
): void {
    exportZipRuntimeRegistry.constructor = constructor;
}

export function clearExportZipRuntimeForTests(): void {
    exportZipRuntimeRegistry.constructor = undefined;
}

export function resolveExportZipRuntime(): ExportZipConstructor | undefined {
    const constructor = exportZipRuntimeRegistry.constructor;
    return isExportZipConstructor(constructor) ? constructor : undefined;
}

export function isExportZipConstructor(
    value: unknown
): value is ExportZipConstructor {
    return typeof value === "function";
}
