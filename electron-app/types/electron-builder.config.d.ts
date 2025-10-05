export let appId: string;
export let productName: string;
export let artifactName: string;
export namespace directories {
    let output: string;
    let buildResources: string;
}
export let files: string[];
export let asar: boolean;
export let publish: {
    provider: string;
    owner: string;
    repo: string;
}[];
export namespace win {
    let icon: string;
    let target: string[];
    let legalTrademarks: string;
    let requestedExecutionLevel: string;
}
export namespace nsis {
    export let oneClick: boolean;
    export let allowElevation: boolean;
    export let allowToChangeInstallationDirectory: boolean;
    export let createDesktopShortcut: boolean;
    export let createStartMenuShortcut: boolean;
    export let runAfterFinish: boolean;
    let artifactName_1: string;
    export { artifactName_1 as artifactName };
}
export namespace mac {
    let icon_1: string;
    export { icon_1 as icon };
    let target_1: string[];
    export { target_1 as target };
    export let category: string;
    export let hardenedRuntime: boolean;
    export let gatekeeperAssess: boolean;
}
export namespace linux {
    let icon_2: string;
    export { icon_2 as icon };
    let target_2: string[];
    export { target_2 as target };
    let category_1: string;
    export { category_1 as category };
    export let synopsis: string;
}
export let fileAssociations: {
    ext: string;
    name: string;
    description: string;
    role: string;
}[];
//# sourceMappingURL=electron-builder.config.d.ts.map