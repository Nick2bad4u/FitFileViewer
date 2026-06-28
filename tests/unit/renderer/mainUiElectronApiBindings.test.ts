import { describe, expect, it, vi } from "vitest";

import { createMainUiElectronApiBindings } from "../../../electron-app/renderer/mainUiElectronApiBindings.js";

describe("main UI Electron API bindings", () => {
    it("creates scoped main UI API resolvers from the runtime environment", () => {
        const api = {
            injectMenu: vi.fn(),
            notifyFitFileLoaded: vi.fn(),
            onOpenSummaryColumnSelector: vi.fn(),
            onSetTheme: vi.fn(),
            onUnloadFitFile: vi.fn(),
            sendThemeChanged: vi.fn(),
        };
        const bindings = createMainUiElectronApiBindings({
            electronApiScope: { getElectronAPI: () => api },
        });

        expect(bindings.electronApiScope.getElectronAPI?.()).toBe(api);
        expect(bindings.getMenuInjectionElectronAPI()).toBe(api);
        expect(bindings.getSummarySelectorElectronAPI()).toBe(api);
        expect(bindings.getThemeSyncElectronAPI()).toBe(api);
        expect(bindings.getUnloadElectronAPI()).toBe(api);
    });

    it("rejects malformed runtime candidates per domain", () => {
        const bindings = createMainUiElectronApiBindings({
            electronApiScope: {
                getElectronAPI: () => ({
                    injectMenu: "not a function",
                    notifyFitFileLoaded: "not a function",
                    onOpenSummaryColumnSelector: vi.fn(),
                    onSetTheme: "not a function",
                }),
            },
        });

        expect(bindings.getMenuInjectionElectronAPI()).toBeNull();
        expect(bindings.getSummarySelectorElectronAPI()).not.toBeNull();
        expect(bindings.getThemeSyncElectronAPI()).toBeNull();
        expect(bindings.getUnloadElectronAPI()).toBeNull();
    });

    it("rejects primitive runtime candidates for every domain", () => {
        const bindings = createMainUiElectronApiBindings({
            electronApiScope: { getElectronAPI: () => "not an api" },
        });

        expect(bindings.getMenuInjectionElectronAPI()).toBeNull();
        expect(bindings.getSummarySelectorElectronAPI()).toBeNull();
        expect(bindings.getThemeSyncElectronAPI()).toBeNull();
        expect(bindings.getUnloadElectronAPI()).toBeNull();
    });
});
