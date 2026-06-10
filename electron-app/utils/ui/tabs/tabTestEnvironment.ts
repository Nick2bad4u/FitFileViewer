type TabTestEnvironment = {
    document?: Document;
    stateManager?: unknown;
};

let tabTestEnvironment: TabTestEnvironment = {};

export function setTabTestEnvironmentForTests(
    environment: null | TabTestEnvironment
): void {
    tabTestEnvironment = environment ?? {};
}

export function getTabTestDocumentForTests(): Document | undefined {
    return tabTestEnvironment.document;
}

export function getTabTestStateManagerForTests(): unknown {
    return tabTestEnvironment.stateManager;
}
