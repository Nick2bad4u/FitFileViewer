import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createTestDOMContentLoadedSetupHandler,
    createTestWindowLoadThemeSetupHandler,
    registerRendererTestOnlyBootstrap,
    registerTestDOMContentLoadedSetupListener,
    registerTestWindowLoadThemeSetupListener,
} from "../../../electron-app/renderer/testOnlyBootstrap.js";
import { getRendererTestOnlyBootstrapRuntime } from "../../../electron-app/renderer/testOnlyBootstrapRuntime.js";

function createOptions(overrides: Record<string, unknown> = {}) {
    const openFileButton = document.createElement("button");
    openFileButton.id = "open_file_btn";
    document.body.append(openFileButton);

    const exactMocks = new Map<string, unknown>();
    const suffixMocks = new Map<string, unknown>();
    const options = {
        getOpenFileButton: () => openFileButton,
        isOpeningFileRef: { value: false },
        resolveExactRendererCoreTestOverride: vi.fn(
            (specifier: string) => exactMocks.get(specifier) ?? null
        ),
        resolveRendererCoreTestOverride: vi.fn(
            (specifier: string) => suffixMocks.get(specifier) ?? null
        ),
        scheduleImportTimeThemeSetup: vi.fn(),
        setLoading: vi.fn(),
        ...overrides,
    };

    return { exactMocks, openFileButton, options, suffixMocks };
}

describe("renderer test-only bootstrap wiring", () => {
    afterEach(() => {
        globalThis.dispatchEvent(new Event("beforeunload"));
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("invokes mocked setupListeners on test DOMContentLoaded", () => {
        expect.assertions(2);

        const { exactMocks, openFileButton, options } = createOptions();
        const setupListeners = vi.fn();
        exactMocks.set("../../utils/app/lifecycle/listeners.js", {
            setupListeners,
        });

        const handler = createTestDOMContentLoadedSetupHandler(options);
        handler();

        expect(setupListeners).toHaveBeenCalledOnce();
        expect(setupListeners.mock.calls[0]?.[0]).toMatchObject({
            isOpeningFileRef: options.isOpeningFileRef,
            openFileBtn: openFileButton,
            setLoading: options.setLoading,
        });
    });

    it("invokes mocked setupTheme on test window load", () => {
        expect.assertions(2);

        const { exactMocks, options } = createOptions();
        const applyTheme = vi.fn();
        const listenForThemeChange = vi.fn();
        const setupTheme = vi.fn();
        exactMocks.set("../../utils/theming/core/setupTheme.js", {
            setupTheme,
        });
        exactMocks.set("../../utils/theming/core/theme.js", {
            applyTheme,
            listenForThemeChange,
        });

        const handler = createTestWindowLoadThemeSetupHandler(options);
        handler();

        expect(setupTheme).toHaveBeenCalledExactlyOnceWith(
            applyTheme,
            listenForThemeChange
        );
        expect(options.scheduleImportTimeThemeSetup).not.toHaveBeenCalled();
    });

    it("falls back to import-time theme setup when mocked theme functions are missing", () => {
        expect.assertions(1);

        const { options } = createOptions({
            scheduleImportTimeThemeSetup: () => {
                document.body.dataset.themeFallback = "scheduled";
            },
        });

        const handler = createTestWindowLoadThemeSetupHandler(options);
        handler();

        expect(document.body.dataset.themeFallback).toBe("scheduled");
    });

    it("registers removable DOMContentLoaded and load listeners", () => {
        expect.assertions(2);

        const calls = {
            contentLoaded: 0,
            load: 0,
        };

        registerTestDOMContentLoadedSetupListener(document, globalThis, () => {
            calls.contentLoaded += 1;
        });
        registerTestWindowLoadThemeSetupListener(globalThis, globalThis, () => {
            calls.load += 1;
        });

        document.dispatchEvent(new Event("DOMContentLoaded"));
        globalThis.dispatchEvent(new Event("load"));
        globalThis.dispatchEvent(new Event("beforeunload"));
        document.dispatchEvent(new Event("DOMContentLoaded"));
        globalThis.dispatchEvent(new Event("load"));

        expect(calls.contentLoaded).toBe(1);
        expect(calls.load).toBe(1);
    });

    it("resolves listener abort controllers through injected runtimes", () => {
        expect.assertions(6);

        const domAbortController = new AbortController();
        const loadAbortController = new AbortController();
        const abortDOMContentLoaded = vi.fn(() => {
            domAbortController.abort();
        });
        const abortLoad = vi.fn(() => {
            loadAbortController.abort();
        });
        const domRuntime = {
            createAbortController: vi.fn(() => ({
                abort: abortDOMContentLoaded,
                signal: domAbortController.signal,
            })),
        };
        const loadRuntime = {
            createAbortController: vi.fn(() => ({
                abort: abortLoad,
                signal: loadAbortController.signal,
            })),
        };

        registerTestDOMContentLoadedSetupListener(
            document,
            globalThis,
            vi.fn(),
            domRuntime
        );
        registerTestWindowLoadThemeSetupListener(
            globalThis,
            globalThis,
            vi.fn(),
            loadRuntime
        );
        globalThis.dispatchEvent(new Event("beforeunload"));

        expect(domRuntime.createAbortController).toHaveBeenCalledOnce();
        expect(loadRuntime.createAbortController).toHaveBeenCalledOnce();
        expect(abortDOMContentLoaded).toHaveBeenCalledOnce();
        expect(abortLoad).toHaveBeenCalledOnce();
        expect(domAbortController.signal.aborted).toBe(true);
        expect(loadAbortController.signal.aborted).toBe(true);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererTestOnlyBootstrapRuntime({});

        expect(() => {
            utils.createAbortController();
        }).toThrow(
            "renderer test-only bootstrap requires an AbortController runtime"
        );
    });

    it("registers the combined renderer test-only bootstrap listeners", () => {
        expect.assertions(3);

        const { exactMocks, options } = createOptions();
        const applyTheme = vi.fn();
        const listenForThemeChange = vi.fn();
        const setupListeners = vi.fn();
        const setupTheme = vi.fn();
        exactMocks.set("../../utils/app/lifecycle/listeners.js", {
            setupListeners,
        });
        exactMocks.set("../../utils/theming/core/setupTheme.js", {
            setupTheme,
        });
        exactMocks.set("../../utils/theming/core/theme.js", {
            applyTheme,
            listenForThemeChange,
        });

        registerRendererTestOnlyBootstrap(options, {
            documentTarget: document,
            rendererEventTarget: globalThis,
            unloadTarget: globalThis,
        });

        document.dispatchEvent(new Event("DOMContentLoaded"));
        globalThis.dispatchEvent(new Event("load"));

        expect(setupListeners).toHaveBeenCalledOnce();
        expect(setupTheme).toHaveBeenCalledExactlyOnceWith(
            applyTheme,
            listenForThemeChange
        );

        globalThis.dispatchEvent(new Event("beforeunload"));
        setupListeners.mockClear();
        setupTheme.mockClear();
        document.dispatchEvent(new Event("DOMContentLoaded"));
        globalThis.dispatchEvent(new Event("load"));

        expect(
            [setupListeners, setupTheme].map((mock) => mock.mock.calls)
        ).toStrictEqual([[], []]);
    });

    it("ignores combined registration failures", () => {
        expect.assertions(1);

        const { options } = createOptions();
        const throwingDocumentTarget = {
            addEventListener: () => {
                throw new Error("listener failed");
            },
        } as unknown as Document;

        expect(() => {
            registerRendererTestOnlyBootstrap(options, {
                documentTarget: throwingDocumentTarget,
                rendererEventTarget: globalThis,
                unloadTarget: globalThis,
            });
        }).not.toThrow();
    });
});
