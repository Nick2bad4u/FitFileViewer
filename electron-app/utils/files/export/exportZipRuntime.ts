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

interface ExportZipRuntimeRegistry {
    constructor?: unknown;
}

const exportZipRuntimeRegistryKey = Symbol.for(
    "fitfileviewer.exportZipRuntime"
);

export function setExportZipRuntime(constructor: unknown): void {
    getExportZipRuntimeRegistry().constructor = constructor;
}

export function clearExportZipRuntimeForTests(): void {
    getExportZipRuntimeRegistry().constructor = undefined;
}

export function resolveExportZipRuntime(): ExportZipConstructor | undefined {
    const constructor = getExportZipRuntimeRegistry().constructor;
    return isExportZipConstructor(constructor) ? constructor : undefined;
}

export function isExportZipConstructor(
    value: unknown
): value is ExportZipConstructor {
    return typeof value === "function";
}

function getExportZipRuntimeRegistry(): ExportZipRuntimeRegistry {
    const exportZipGlobal = globalThis as typeof globalThis &
        Record<symbol, ExportZipRuntimeRegistry | undefined>;
    exportZipGlobal[exportZipRuntimeRegistryKey] ??= {};
    return exportZipGlobal[exportZipRuntimeRegistryKey];
}
