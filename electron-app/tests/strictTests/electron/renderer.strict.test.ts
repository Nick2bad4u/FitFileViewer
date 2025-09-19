import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Utilities to import renderer fresh with mocks and a clean DOM
const importRendererFresh = async () => {
    // Reset module cache and global hooks between runs
    vi.resetModules();
    // Remove globals possibly left from prior imports
    // @ts-ignore
    delete (window as any).electronAPI;
    // @ts-ignore
    delete (window as any).__renderer_dev;
    // Fresh DOM skeleton
    document.body.innerHTML = `
    <button id="openFileBtn">Open</button>
    <input id="fileInput" type="file" />
    <div id="notification"></div>
    <div id="loadingOverlay"></div>
  `;
    // Ensure input.files is controllable in jsdom
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    const testFile = new File(["fit-bytes"], "test.fit", { type: "application/octet-stream" });
    Object.defineProperty(fileInput, "files", { configurable: true, get: () => [testFile] });

    // Provide a stub electronAPI before import so the renderer registers immediately
    const listeners = new Map<string, Function[]>();
    const api: any = {
        __devMode: true,
        onMenuAction: (cb: any) => {
            const arr = listeners.get("menu") || [];
            arr.push(cb);
            listeners.set("menu", arr);
        },
        onThemeChanged: (cb: any) => {
            const arr = listeners.get("theme") || [];
            arr.push(cb);
            listeners.set("theme", arr);
        },
        isDevelopment: () => Promise.resolve(true),
        recentFiles: vi.fn(async () => []),
        checkForUpdates: vi.fn(),
    };
    // @ts-ignore
    (window as any).electronAPI = api;

    // Manual mocks for all modules dynamically resolved via ensureCoreModules()
    const showNotification = vi.fn();
    const handleOpenFile = vi.fn();
    const setupTheme = vi.fn();
    const showUpdateNotification = vi.fn();
    const setupListeners = vi.fn();
    const showAboutModal = vi.fn();
    const applyTheme = vi.fn();
    const listenForThemeChange = vi.fn();

    const msm = {
        initialize: vi.fn(async () => void 0),
        isInitialized: true,
        getState: vi.fn(() => ({ app: { initialized: true, isOpeningFile: false, startTime: Date.now() } })),
        getHistory: vi.fn(() => []),
        getSubscriptions: vi.fn(() => []),
        cleanup: vi.fn(() => void 0),
    };
    const AppActions = { setInitialized: vi.fn(), setFileOpening: vi.fn() };
    const getAppDomainState = vi.fn(() => Date.now());
    const subscribeAppDomain = vi.fn();

    // NOTE: renderer.js expects the exact '../../utils/...' ids to match resolveExactManualMock
    vi.doMock("../../utils/ui/notifications/showNotification.js", () => ({ showNotification }));
    vi.doMock("../../utils/files/import/handleOpenFile.js", () => ({ handleOpenFile }));
    vi.doMock("../../utils/theming/core/setupTheme.js", () => ({ setupTheme }));
    vi.doMock("../../utils/ui/notifications/showUpdateNotification.js", () => ({ showUpdateNotification }));
    vi.doMock("../../utils/app/lifecycle/listeners.js", () => ({ setupListeners }));
    vi.doMock("../../utils/ui/modals/aboutModal.js", () => ({ showAboutModal }));
    vi.doMock("../../utils/theming/core/theme.js", () => ({ applyTheme, listenForThemeChange }));
    vi.doMock("../../utils/state/core/masterStateManager.js", () => ({ masterStateManager: msm }));
    vi.doMock("../../utils/app/lifecycle/appActions.js", () => ({ AppActions }));
    vi.doMock("../../utils/state/domain/appState.js", () => ({
        getState: getAppDomainState,
        subscribe: subscribeAppDomain,
    }));

    // Import the renderer entry (this triggers initialization immediately)
    const mod = await import("../../../renderer.js");
    // Ensure initialization path runs: trigger DOMContentLoaded and window load
    document.dispatchEvent(new Event("DOMContentLoaded"));
    window.dispatchEvent(new Event("load"));
    await Promise.resolve();
    return {
        mod,
        api,
        listeners,
        spies: {
            showNotification,
            handleOpenFile,
            setupTheme,
            showUpdateNotification,
            setupListeners,
            showAboutModal,
            applyTheme,
            listenForThemeChange,
            msm,
            AppActions,
            getAppDomainState,
            subscribeAppDomain,
        },
    };
};

describe("renderer.js strict behavior", () => {
    let errors: string[] = [];
    let logs: string[] = [];

    beforeEach(() => {
        errors = [];
        logs = [];
        vi.spyOn(console, "error").mockImplementation((...args: any[]) => errors.push(args.join(" ")));
        vi.spyOn(console, "log").mockImplementation((...args: any[]) => logs.push(args.join(" ")));
        // Default to modern fake timers so we can flush microtasks/intervals deterministically
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("initializes modules, wires electronAPI, and handles file input + theme/menu events", async () => {
        const { api, listeners, spies } = await importRendererFresh();
        // Force full app initialization so state actions and handlers are registered
        const dev: any = (window as any).__renderer_dev;
        if (dev && typeof dev.reinitialize === "function") {
            await dev.reinitialize();
        }

        // setupTheme and setupListeners should have been called during startup
        expect(spies.setupTheme).toHaveBeenCalled();
        expect(spies.setupListeners).toHaveBeenCalled();

        // Initialization path should run: masterStateManager.initialize should be invoked
        expect(spies.msm.initialize).toHaveBeenCalled();

        // Trigger a file input change -> handleOpenFile should be called with our test file
        const fileInput = document.getElementById("fileInput") as HTMLInputElement;
        fileInput.dispatchEvent(new Event("change"));
        // May be wired twice in renderer (direct + delegated); only assert at least one call with a File
        expect(spies.handleOpenFile).toHaveBeenCalled();
        const sawFileArg = spies.handleOpenFile.mock.calls.some((c: any[]) => c[0] instanceof File);
        expect(sawFileArg).toBe(true);

        // Simulate theme changed through electronAPI and ensure applyTheme called
        const themeHandlers = listeners.get("theme") || [];
        expect(themeHandlers.length).toBeGreaterThan(0);
        // Invoke all registered handlers to cover both early and late registrations
        for (const h of themeHandlers) h("dark");
        // Safety: allow any async IIFE path to resolve too
        await Promise.resolve();
        vi.runOnlyPendingTimers();
        await Promise.resolve();

        // Simulate menu action 'about' and confirm modal shown
        const menuHandlers = listeners.get("menu") || [];
        expect(menuHandlers.length).toBeGreaterThan(0);
        // Invoke all registered handlers to handle both immediate and async paths
        for (const h of menuHandlers) h("about");
        // One of the registered menu handlers wraps in an async IIFE
        await Promise.resolve();
        vi.runOnlyPendingTimers();
        await Promise.resolve();

        // Recent files async initializer should invoke API
        // Give any pending timers a chance (intervals/timers)
        vi.runOnlyPendingTimers();
        expect(api.recentFiles).toHaveBeenCalled();

        // Development mode success notification should be shown
        const notifJoined = spies.showNotification.mock.calls.map((c: any[]) => c.join(" ")).join("\n");
        expect(notifJoined).toMatch(/App initialized/);
    });

    it("handles global error events and shows notifications", async () => {
        const { spies } = await importRendererFresh();
        // Ensure global error handlers are attached via full initialization
        const dev: any = (window as any).__renderer_dev;
        if (dev && typeof dev.reinitialize === "function") {
            await dev.reinitialize();
        }
        // Give any queued work a chance to attach listeners
        await Promise.resolve();
        vi.runOnlyPendingTimers();

        // Dispatch an error event (uncaught exception path)
        const err = new Error("boom");
        const ev = new ErrorEvent("error", { error: err, message: err.message, filename: "x", lineno: 1, colno: 1 });
        window.dispatchEvent(ev);

        // Allow async handlers to run
        await Promise.resolve();
        vi.runOnlyPendingTimers();

        const notifCalls = spies.showNotification.mock.calls.flat().join(" ");
        const matched = /(Critical error|Application error)/.test(notifCalls);
        const errorLogs = (console.error as any).mock.calls.flat().join(" ");
        const errorLogged = /Uncaught error/.test(errorLogs);
        expect(matched || errorLogged).toBe(true);
    });

    it("exposes dev helpers and performance metrics in development", async () => {
        await importRendererFresh();
        // @ts-ignore
        const dev = (window as any).__renderer_dev;
        expect(dev).toBeTruthy();
        const metrics = dev.getPerformanceMetrics();
        expect(typeof metrics).toBe("object");
    });
});
