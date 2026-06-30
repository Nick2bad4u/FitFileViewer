import { describe, expect, it, vi } from "vitest";

import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type AddFullScreenButtonModule =
    typeof import("../../../../../electron-app/utils/ui/controls/addFullScreenButton.js");

type ScreenfullChangeHandler = (event: Event) => void;

type ScreenfullMock = {
    exit: ReturnType<typeof vi.fn<() => Promise<void> | void>>;
    isEnabled: boolean;
    isFullscreen: boolean;
    on: ReturnType<
        typeof vi.fn<
            (
                event: "change" | "error",
                handler: ScreenfullChangeHandler
            ) => void
        >
    >;
    request: ReturnType<typeof vi.fn<() => Promise<void> | void>>;
};

type TestElectronAPI = {
    setFullScreen: ReturnType<typeof vi.fn<(flag: boolean) => void>>;
};

const controlMocks = vi.hoisted(() => ({
    addExitFullscreenOverlay: vi.fn<(content: HTMLElement) => void>(),
    getActiveTabContent: vi.fn<() => HTMLElement | null>(),
    removeExitFullscreenOverlay: vi.fn<(content: HTMLElement) => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/rendering/helpers/getActiveTabContent.js"),
    () => ({
        getActiveTabContent: controlMocks.getActiveTabContent,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/addExitFullscreenOverlay.js"),
    () => ({
        addExitFullscreenOverlay: controlMocks.addExitFullscreenOverlay,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/removeExitFullscreenOverlay.js"),
    () => ({
        removeExitFullscreenOverlay: controlMocks.removeExitFullscreenOverlay,
    })
);

describe("addFullScreenButton", () => {
    it("creates fallback fullscreen button when screenfull is unavailable", async () => {
        expect.assertions(4);

        await resetTestState();
        controlMocks.getActiveTabContent.mockReturnValue(null);
        const requestFullscreen = vi.fn<() => void>();
        defineDocumentElementMethod("requestFullscreen", requestFullscreen);

        try {
            expect(
                document.querySelectorAll("#global-fullscreen-btn")
            ).not.toHaveLength(1);

            const module = await loadModule();
            module.addFullScreenButton();

            const button = getRequiredFullscreenButton();

            expect(button).toBeInstanceOf(HTMLButtonElement);
            expect(getFullscreenButtonState(button)).toStrictEqual({
                ariaLabel: "Toggle full screen mode",
                classes: [
                    "fullscreen-btn",
                    "improved",
                    "themed-btn",
                ],
                iconTitle: "Enter Fullscreen",
                role: "button",
                tabIndex: "0",
                title: "",
                tooltip: "Fullscreen (F11)",
            });

            button.click();

            expect(requestFullscreen).toHaveBeenCalledOnce();
        } finally {
            await cleanupTestState();
        }
    });

    it("uses Electron fullscreen IPC when available and updates overlay state", async () => {
        expect.assertions(9);

        await resetTestState();
        const storedHandlers: ScreenfullChangeHandler[] = [];
        const screenfullMock = createScreenfullMock(storedHandlers);
        await registerScreenfullRuntimeForTest(screenfullMock);

        const activeContent = document.createElement("section");
        activeContent.id = "content-data";
        document.body.append(activeContent);
        controlMocks.getActiveTabContent.mockReturnValue(activeContent);

        const setFullScreen = vi.fn<(flag: boolean) => void>();
        const electronApiScope = createElectronApiScope({ setFullScreen });

        try {
            const module = await loadModule();
            module.addFullScreenButton({ electronApiScope });

            const button = getRequiredFullscreenButton();

            expect(button).toBeInstanceOf(HTMLButtonElement);

            button.click();

            expect(setFullScreen).toHaveBeenCalledWith(true);

            screenfullMock.isFullscreen = true;
            button.click();

            expect(setFullScreen).toHaveBeenCalledWith(false);

            module.setupFullscreenListeners({ electronApiScope });

            expect(screenfullMock.on).toHaveBeenCalledWith(
                "change",
                expect.any(Function)
            );
            expect(storedHandlers).toHaveLength(1);

            const [changeHandler] = storedHandlers;

            screenfullMock.isFullscreen = true;
            changeHandler(new Event("change"));

            expect(controlMocks.addExitFullscreenOverlay).toHaveBeenCalledWith(
                activeContent
            );
            expect(getFullscreenButtonState(button)).toMatchObject({
                ariaLabel: "Exit full screen mode",
                iconTitle: "Exit Fullscreen",
                title: "Exit Full Screen (F11)",
            });

            screenfullMock.isFullscreen = false;
            changeHandler(new Event("change"));

            expect(button.title).toBe("Toggle Full Screen (F11)");
            expect(
                controlMocks.removeExitFullscreenOverlay
            ).toHaveBeenCalledWith(activeContent);
        } finally {
            await cleanupTestState();
        }
    });

    it("falls back to native fullscreen when scoped Electron fullscreen IPC is malformed", async () => {
        expect.assertions(3);

        await resetTestState();
        const storedHandlers: ScreenfullChangeHandler[] = [];
        const screenfullMock = createScreenfullMock(storedHandlers);
        await registerScreenfullRuntimeForTest(screenfullMock);

        const activeContent = document.createElement("section");
        activeContent.id = "content-data";
        const requestFullscreen = vi.fn<() => void>();
        defineElementMethod(
            activeContent,
            "requestFullscreen",
            requestFullscreen
        );
        document.body.append(activeContent);
        controlMocks.getActiveTabContent.mockReturnValue(activeContent);

        const electronApiScope = createElectronApiScope({
            setFullScreen: "not-callable",
        });

        try {
            const module = await loadModule();
            module.addFullScreenButton({ electronApiScope });

            getRequiredFullscreenButton().click();

            expect(requestFullscreen).toHaveBeenCalledOnce();
            expect(screenfullMock.request).not.toHaveBeenCalled();
            expect(storedHandlers).toStrictEqual([]);
        } finally {
            await cleanupTestState();
        }
    });

    it("falls back to native fullscreen when scoped Electron API is primitive", async () => {
        expect.assertions(3);

        await resetTestState();
        const storedHandlers: ScreenfullChangeHandler[] = [];
        const screenfullMock = createScreenfullMock(storedHandlers);
        await registerScreenfullRuntimeForTest(screenfullMock);

        const activeContent = document.createElement("section");
        activeContent.id = "content-data";
        const requestFullscreen = vi.fn<() => void>();
        defineElementMethod(
            activeContent,
            "requestFullscreen",
            requestFullscreen
        );
        document.body.append(activeContent);
        controlMocks.getActiveTabContent.mockReturnValue(activeContent);

        const electronApiScope = createElectronApiScope("not an api");

        try {
            const module = await loadModule();
            module.addFullScreenButton({ electronApiScope });

            getRequiredFullscreenButton().click();

            expect(requestFullscreen).toHaveBeenCalledOnce();
            expect(screenfullMock.request).not.toHaveBeenCalled();
            expect(storedHandlers).toStrictEqual([]);
        } finally {
            await cleanupTestState();
        }
    });

    it("falls back to native fullscreen when scoped Electron API is array-shaped", async () => {
        expect.assertions(4);

        await resetTestState();
        const storedHandlers: ScreenfullChangeHandler[] = [];
        const screenfullMock = createScreenfullMock(storedHandlers);
        await registerScreenfullRuntimeForTest(screenfullMock);

        const activeContent = document.createElement("section");
        activeContent.id = "content-data";
        const requestFullscreen = vi.fn<() => void>();
        defineElementMethod(
            activeContent,
            "requestFullscreen",
            requestFullscreen
        );
        document.body.append(activeContent);
        controlMocks.getActiveTabContent.mockReturnValue(activeContent);

        const setFullScreen = vi.fn<(flag: boolean) => void>();
        const arrayShapedApi = [] as unknown[];
        Object.assign(arrayShapedApi, { setFullScreen });
        const electronApiScope = createElectronApiScope(arrayShapedApi);

        try {
            const module = await loadModule();
            module.addFullScreenButton({ electronApiScope });

            getRequiredFullscreenButton().click();

            expect(requestFullscreen).toHaveBeenCalledOnce();
            expect(setFullScreen).not.toHaveBeenCalled();
            expect(screenfullMock.request).not.toHaveBeenCalled();
            expect(storedHandlers).toStrictEqual([]);
        } finally {
            await cleanupTestState();
        }
    });

    it("falls back to native fullscreen when scoped Electron fullscreen IPC properties are inaccessible", async () => {
        expect.assertions(3);

        await resetTestState();
        const storedHandlers: ScreenfullChangeHandler[] = [];
        const screenfullMock = createScreenfullMock(storedHandlers);
        await registerScreenfullRuntimeForTest(screenfullMock);

        const activeContent = document.createElement("section");
        activeContent.id = "content-data";
        const requestFullscreen = vi.fn<() => void>();
        defineElementMethod(
            activeContent,
            "requestFullscreen",
            requestFullscreen
        );
        document.body.append(activeContent);
        controlMocks.getActiveTabContent.mockReturnValue(activeContent);

        const electronApiScope = createElectronApiScope(
            Object.defineProperty({}, "setFullScreen", {
                get() {
                    throw new Error("blocked fullscreen property");
                },
            })
        );

        try {
            const module = await loadModule();
            module.addFullScreenButton({ electronApiScope });

            getRequiredFullscreenButton().click();

            expect(requestFullscreen).toHaveBeenCalledOnce();
            expect(screenfullMock.request).not.toHaveBeenCalled();
            expect(storedHandlers).toStrictEqual([]);
        } finally {
            await cleanupTestState();
        }
    });

    it("handles F11 keyboard shortcut with IPC and native fallback", async () => {
        expect.assertions(7);

        await resetTestState();
        const storedHandlers: ScreenfullChangeHandler[] = [];
        const screenfullMock = createScreenfullMock(storedHandlers);
        await registerScreenfullRuntimeForTest(screenfullMock);

        const activeContent = document.createElement("section");
        activeContent.id = "content-map";
        document.body.append(activeContent);
        controlMocks.getActiveTabContent.mockReturnValue(activeContent);

        const setFullScreen = vi.fn<(flag: boolean) => void>();
        const electronApiScope = createElectronApiScope({ setFullScreen });

        try {
            const module = await loadModule();
            module.setupFullscreenListeners({ electronApiScope });

            const button = getRequiredFullscreenButton();

            expect(button).toBeInstanceOf(HTMLButtonElement);

            globalThis.dispatchEvent(createF11Event());

            expect(setFullScreen).toHaveBeenCalledWith(true);
            expect(button.title).toBe("Exit Full Screen (F11)");

            globalThis.dispatchEvent(createF11Event());

            expect(setFullScreen).toHaveBeenCalledWith(false);
            expect(button.title).toBe("Toggle Full Screen (F11)");

            await resetTestState();
            const nativeRequest = vi.fn<() => void>();
            defineDocumentElementMethod("requestFullscreen", nativeRequest);
            controlMocks.getActiveTabContent.mockReturnValue(null);

            const fallbackModule = await loadModule();
            fallbackModule.setupFullscreenListeners();

            const fallbackButton = getRequiredFullscreenButton();

            expect(getFullscreenButtonState(fallbackButton)).toStrictEqual({
                ariaLabel: "Toggle full screen mode",
                classes: [
                    "fullscreen-btn",
                    "improved",
                    "themed-btn",
                ],
                iconTitle: "Enter Fullscreen",
                role: "button",
                tabIndex: "-1",
                title: "",
                tooltip: "Load a file first",
            });

            globalThis.dispatchEvent(createF11Event());

            expect(nativeRequest).toHaveBeenCalledOnce();
        } finally {
            await cleanupTestState();
        }
    });
});

async function loadModule(): Promise<AddFullScreenButtonModule> {
    return import("../../../../../electron-app/utils/ui/controls/addFullScreenButton.js");
}

async function cleanupStoredEventHandlers(): Promise<void> {
    const module = await loadModule();
    module.resetFullscreenListenerStateForTests();
}

async function cleanupTestState(): Promise<void> {
    await cleanupStoredEventHandlers();
    await clearScreenfullRuntime();
    document.body.replaceChildren();
    document.body.style.overflow = "";
    vi.resetModules();
}

async function clearScreenfullRuntime(): Promise<void> {
    const { clearScreenfullRuntimeForTests } =
        await import("../../../../../electron-app/utils/ui/controls/screenfullRuntime.js");

    clearScreenfullRuntimeForTests();
}

function createF11Event(): KeyboardEvent {
    return new KeyboardEvent("keydown", {
        bubbles: true,
        key: "F11",
    });
}

function createScreenfullMock(
    storedHandlers: ScreenfullChangeHandler[]
): ScreenfullMock {
    return {
        exit: vi.fn<() => void>(),
        isEnabled: true,
        isFullscreen: false,
        on: vi.fn<
            (
                event: "change" | "error",
                handler: ScreenfullChangeHandler
            ) => void
        >((event, handler) => {
            if (event === "change") {
                storedHandlers.push(handler);
            }
        }),
        request: vi.fn<() => void>(),
    };
}

function defineDocumentElementMethod(name: string, value: unknown): void {
    defineElementMethod(document.documentElement, name, value);
}

function defineElementMethod(
    element: Element,
    name: string,
    value: unknown
): void {
    Object.defineProperty(element, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function getRequiredFullscreenButton(): HTMLButtonElement {
    const button = document.getElementById("global-fullscreen-btn");
    if (!(button instanceof HTMLButtonElement)) {
        throw new TypeError("Expected fullscreen button to be mounted.");
    }

    return button;
}

function getRequiredFullscreenIconTitle(
    button: HTMLButtonElement
): SVGTitleElement {
    const title = button.querySelector(".fullscreen-icon title");
    if (!(title instanceof SVGTitleElement)) {
        throw new TypeError("Expected fullscreen icon title to be mounted.");
    }

    return title;
}

function getFullscreenButtonState(button: HTMLButtonElement) {
    return {
        ariaLabel: button.getAttribute("aria-label"),
        classes: [...button.classList],
        iconTitle: getRequiredFullscreenIconTitle(button).textContent,
        role: button.getAttribute("role"),
        tabIndex: button.getAttribute("tabindex"),
        title: button.title,
        tooltip: button.dataset["tooltip"],
    };
}

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

async function registerScreenfullRuntimeForTest(runtime: {
    isEnabled: boolean;
    isFullscreen: boolean;
    off?: (event: "change", handler: (event: Event) => void) => void;
    on: (event: "change", handler: (event: Event) => void) => void;
}): Promise<void> {
    const { registerScreenfullRuntime } =
        await import("../../../../../electron-app/utils/ui/controls/screenfullRuntime.js");

    registerScreenfullRuntime(runtime);
}

function resetDocumentFullscreenMethods(): void {
    for (const property of [
        "exitFullscreen",
        "webkitExitFullscreen",
        "mozCancelFullScreen",
        "msExitFullscreen",
    ]) {
        Reflect.deleteProperty(document, property);
    }

    for (const property of [
        "requestFullscreen",
        "webkitRequestFullscreen",
        "mozRequestFullScreen",
        "msRequestFullscreen",
    ]) {
        Reflect.deleteProperty(document.documentElement, property);
    }
}

function resetReadyState(): void {
    Object.defineProperty(document, "readyState", {
        configurable: true,
        get: () => "complete" satisfies DocumentReadyState,
    });
}

async function resetTestState(): Promise<void> {
    await cleanupTestState();
    vi.clearAllMocks();
    controlMocks.addExitFullscreenOverlay.mockReset();
    controlMocks.getActiveTabContent.mockReset();
    controlMocks.removeExitFullscreenOverlay.mockReset();
    resetDocumentFullscreenMethods();
    resetReadyState();
}
