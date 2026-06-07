import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createTestDOMContentLoadedSetupHandler,
    createTestWindowLoadThemeSetupHandler,
    registerTestDOMContentLoadedSetupListener,
    registerTestWindowLoadThemeSetupListener,
} from "../../../electron-app/renderer/testOnlyBootstrap.js";

function createOptions(overrides: Record<string, unknown> = {}) {
    const openFileButton = document.createElement("button");
    openFileButton.id = "open_file_btn";
    document.body.append(openFileButton);

    const exactMocks = new Map<string, unknown>();
    const suffixMocks = new Map<string, unknown>();
    const options = {
        callUnknownFunction: vi.fn((candidate: unknown, args?: unknown[]) => {
            if (typeof candidate === "function") {
                return candidate(...(args ?? []));
            }
            return undefined;
        }),
        getOpenFileButton: () => openFileButton,
        isOpeningFileRef: { value: false },
        resolveExactManualMock: vi.fn(
            (specifier: string) => exactMocks.get(specifier) ?? null
        ),
        resolveManualMock: vi.fn(
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
        expect.assertions(3);

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
        expect(options.callUnknownFunction).toHaveBeenCalledWith(
            setupListeners,
            [expect.any(Object)]
        );
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
});
