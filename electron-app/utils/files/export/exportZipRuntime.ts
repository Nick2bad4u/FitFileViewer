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
    zipConstructor?: ExportZipConstructor;
};

const exportZipRuntimeRegistry: ExportZipRuntimeRegistry = {};

export function registerExportZipRuntime(
    constructor: ExportZipConstructor
): void {
    exportZipRuntimeRegistry.zipConstructor = constructor;
}

export function clearExportZipRuntimeForTests(): void {
    delete exportZipRuntimeRegistry.zipConstructor;
}

export function resolveExportZipRuntime(): ExportZipConstructor | undefined {
    return exportZipRuntimeRegistry.zipConstructor;
}

export function isExportZipConstructor(
    value: unknown
): value is ExportZipConstructor {
    return typeof value === "function";
}
