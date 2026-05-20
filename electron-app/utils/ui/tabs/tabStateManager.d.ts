/**
 * Tab configuration metadata used by the legacy tab manager.
 */
export type TabDef = {
    contentId: string;
    handler: null | string;
    id: string;
    label: string;
    requiresData: boolean;
};

/**
 * Snapshot of the current active tab and its resolved DOM elements.
 */
export type ActiveTabInfo = {
    config: TabDef | undefined;
    contentElement: HTMLElement | null;
    element: HTMLElement | null;
    name: unknown;
    previous: null | string;
};

/**
 * Public surface of the legacy JavaScript tab state manager.
 */
export declare class TabStateManager {
    isInitialized: boolean;
    previousTab: null | string;

    cleanup(): void;
    extractTabName(buttonId: string): null | string;
    getActiveTabInfo(): ActiveTabInfo;
    switchToTab(tabName: string): boolean;
}

/**
 * Registered tab definitions keyed by tab name.
 */
export declare const TAB_CONFIG: Record<string, TabDef>;
/**
 * Singleton tab state manager instance.
 */
export declare const tabStateManager: TabStateManager;
export default tabStateManager;
