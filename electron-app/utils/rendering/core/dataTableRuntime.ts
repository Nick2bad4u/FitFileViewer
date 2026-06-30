type DataTableRuntimeRegistry = {
    runtime?: RegisteredDataTableRuntime;
};

export type RegisteredDataTableInstance = Readonly<{
    columns: Readonly<{
        adjust: () => void;
    }>;
    destroy: () => void;
}>;

export type RegisteredDataTableOptions = {
    autoWidth: boolean;
    columns: RegisteredDataTableColumnConfig[];
    data: Record<string, boolean | number | string>[];
    deferRender: boolean;
    lengthMenu: [number[], Array<number | string>];
    ordering: boolean;
    pageLength: number;
    paging: boolean;
    scrollCollapse: boolean;
    scrollX: boolean;
    searching: boolean;
};

export type RegisteredDataTableColumnConfig = {
    data: string;
    defaultContent: string;
    title: string;
};

export type RegisteredDataTableRuntime = (new (
    selector: string,
    options?: RegisteredDataTableOptions
) => RegisteredDataTableInstance) &
    Readonly<{
        isDataTable: (selector: string) => boolean;
    }>;

const dataTableRuntimeRegistry: DataTableRuntimeRegistry = {};

export function registerDataTableRuntime(
    runtime: RegisteredDataTableRuntime
): void {
    dataTableRuntimeRegistry.runtime = runtime;
}

export function clearDataTableRuntimeForTests(): void {
    delete dataTableRuntimeRegistry.runtime;
}

export function isRegisteredDataTableRuntime(
    value: unknown
): value is RegisteredDataTableRuntime {
    return (
        typeof value === "function" &&
        typeof (value as Partial<RegisteredDataTableRuntime>).isDataTable ===
            "function"
    );
}

export function getRegisteredDataTableRuntime():
    | RegisteredDataTableRuntime
    | null {
    return dataTableRuntimeRegistry.runtime ?? null;
}

export function resolveDataTableRuntime<T>(
    isRuntime: (value: unknown) => value is T
): T | null {
    for (const candidate of getDataTableRuntimeCandidates()) {
        if (isRuntime(candidate)) {
            return candidate;
        }
    }

    return null;
}

function getDataTableRuntimeCandidates(): unknown[] {
    return dataTableRuntimeRegistry.runtime === undefined
        ? []
        : [dataTableRuntimeRegistry.runtime];
}
