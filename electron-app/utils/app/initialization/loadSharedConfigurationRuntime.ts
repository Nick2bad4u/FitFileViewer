export type SharedConfigurationLocation = Pick<Location, "search">;

export interface LoadSharedConfigurationRuntime {
    readonly locationSearch: string;
}

export interface LoadSharedConfigurationRuntimeScope {
    readonly location?: SharedConfigurationLocation | undefined;
}

export function getLoadSharedConfigurationRuntime(
    scope: LoadSharedConfigurationRuntimeScope = globalThis
): LoadSharedConfigurationRuntime {
    return {
        locationSearch: scope.location?.search ?? "",
    };
}
