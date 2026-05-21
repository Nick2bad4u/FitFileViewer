import { describe, expect, it, vi } from "vitest";

type AddFullScreenButtonModule =
    typeof import("../../../../../utils/ui/controls/addFullScreenButton.js");

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

type FullscreenTestGlobal = typeof globalThis & {
    __ffvFullscreenKeydownHandler?: EventListener | null;
    __ffvNativeFullscreenChangeHandler?: EventListener | null;
    electronAPI?: TestElectronAPI;
    screenfull?: ScreenfullMock;
};

const controlMocks = vi.hoisted(() => ({
    addExitFullscreenOverlay: vi.fn<(content: HTMLElement) => void>(),
    getActiveTabContent: vi.fn<() => HTMLElement | null>(),
    removeExitFullscreenOverlay: vi.fn<(content: HTMLElement) => void>(),
}));

vi.mock(
    import("../../../../../utils/rendering/helpers/getActiveTabContent.js"),
    () => ({
        getActiveTabContent: controlMocks.getActiveTabContent,
    })
);

vi.mock(
    import("../../../../../utils/ui/controls/addExitFullscreenOverlay.js"),
    () => ({
        addExitFullscreenOverlay: controlMocks.addExitFullscreenOverlay,
    })
);

vi.mock(
    import("../../../../../utils/ui/controls/removeExitFullscreenOverlay.js"),
    () => ({
        removeExitFullscreenOverlay: controlMocks.removeExitFullscreenOverlay,
    })
);

describe("addFullScreenButton", () => {
    it("creates fallback fullscreen button when screenfull is unavailable", async () => {
        expect.assertions(5);

        resetTestState();
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
            expect([...button.classList]).toContain("fullscreen-btn");
            expect(button.dataset["tooltip"]).toBe("Fullscreen (F11)");

            button.click();

            expect(requestFullscreen).toHaveBeenCalledOnce();
        } finally {
            cleanupTestState();
        }
    });

    it("uses Electron fullscreen IPC when available and updates overlay state", async () => {
        expect.assertions(10);

        resetTestState();
        const storedHandlers: ScreenfullChangeHandler[] = [];
        const screenfullMock = createScreenfullMock(storedHandlers);
        getTestGlobal().screenfull = screenfullMock;

        const activeContent = document.createElement("section");
        activeContent.id = "content-data";
        document.body.append(activeContent);
        controlMocks.getActiveTabContent.mockReturnValue(activeContent);

        const setFullScreen = vi.fn<(flag: boolean) => void>();
        getTestGlobal().electronAPI = { setFullScreen };

        try {
            const module = await loadModule();
            module.addFullScreenButton();

            const button = getRequiredFullscreenButton();

            expect(button).toBeInstanceOf(HTMLButtonElement);

            button.click();

            expect(setFullScreen).toHaveBeenCalledWith(true);

            screenfullMock.isFullscreen = true;
            button.click();

            expect(setFullScreen).toHaveBeenCalledWith(false);

            module.setupFullscreenListeners();

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
            expect(button.title).toBe("Exit Full Screen (F11)");
            expect(
                button.querySelector(".fullscreen-icon")?.innerHTML
            ).toContain("Exit Fullscreen");

            screenfullMock.isFullscreen = false;
            changeHandler(new Event("change"));

            expect(button.title).toBe("Toggle Full Screen (F11)");
            expect(
                controlMocks.removeExitFullscreenOverlay
            ).toHaveBeenCalledWith(activeContent);
        } finally {
            cleanupTestState();
        }
    });

    it("handles F11 keyboard shortcut with IPC and native fallback", async () => {
        expect.assertions(7);

        resetTestState();
        const storedHandlers: ScreenfullChangeHandler[] = [];
        const screenfullMock = createScreenfullMock(storedHandlers);
        getTestGlobal().screenfull = screenfullMock;

        const activeContent = document.createElement("section");
        activeContent.id = "content-map";
        document.body.append(activeContent);
        controlMocks.getActiveTabContent.mockReturnValue(activeContent);

        const setFullScreen = vi.fn<(flag: boolean) => void>();
        getTestGlobal().electronAPI = { setFullScreen };

        try {
            const module = await loadModule();
            module.setupFullscreenListeners();

            const button = getRequiredFullscreenButton();

            expect(button).toBeInstanceOf(HTMLButtonElement);

            globalThis.dispatchEvent(createF11Event());

            expect(setFullScreen).toHaveBeenCalledWith(true);
            expect(button.title).toBe("Exit Full Screen (F11)");

            globalThis.dispatchEvent(createF11Event());

            expect(setFullScreen).toHaveBeenCalledWith(false);
            expect(button.title).toBe("Toggle Full Screen (F11)");

            resetTestState();
            const nativeRequest = vi.fn<() => void>();
            defineDocumentElementMethod("requestFullscreen", nativeRequest);
            controlMocks.getActiveTabContent.mockReturnValue(null);

            const fallbackModule = await loadModule();
            fallbackModule.setupFullscreenListeners();

            const fallbackButton = getRequiredFullscreenButton();

            expect([...fallbackButton.classList]).toContain("fullscreen-btn");

            globalThis.dispatchEvent(createF11Event());

            expect(nativeRequest).toHaveBeenCalledOnce();
        } finally {
            cleanupTestState();
        }
    });
});

async function loadModule(): Promise<AddFullScreenButtonModule> {
    return import("../../../../../utils/ui/controls/addFullScreenButton.js");
}

function cleanupStoredEventHandlers(): void {
    const testGlobal = getTestGlobal();
    if (testGlobal.__ffvFullscreenKeydownHandler) {
        globalThis.removeEventListener(
            "keydown",
            testGlobal.__ffvFullscreenKeydownHandler
        );
    }

    if (testGlobal.__ffvNativeFullscreenChangeHandler) {
        for (const eventName of [
            "fullscreenchange",
            "webkitfullscreenchange",
            "mozfullscreenchange",
            "MSFullscreenChange",
        ]) {
            document.removeEventListener(
                eventName,
                testGlobal.__ffvNativeFullscreenChangeHandler
            );
        }
    }

    Reflect.deleteProperty(testGlobal, "__ffvFullscreenKeydownHandler");
    Reflect.deleteProperty(testGlobal, "__ffvNativeFullscreenChangeHandler");
}

function cleanupTestState(): void {
    cleanupStoredEventHandlers();
    Reflect.deleteProperty(getTestGlobal(), "screenfull");
    Reflect.deleteProperty(getTestGlobal(), "electronAPI");
    document.body.innerHTML = "";
    document.body.style.overflow = "";
    vi.resetModules();
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
    Object.defineProperty(document.documentElement, name, {
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

function getTestGlobal(): FullscreenTestGlobal {
    return globalThis as FullscreenTestGlobal;
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

function resetTestState(): void {
    cleanupTestState();
    vi.clearAllMocks();
    controlMocks.addExitFullscreenOverlay.mockReset();
    controlMocks.getActiveTabContent.mockReset();
    controlMocks.removeExitFullscreenOverlay.mockReset();
    resetDocumentFullscreenMethods();
    resetReadyState();
}
