import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type ScreenfullMock = {
    isEnabled: boolean;
    isFullscreen: boolean;
    request: ReturnType<typeof vi.fn>;
    exit: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
};

const getActiveTabContentMock = vi.fn();
const addOverlayMock = vi.fn();
const removeOverlayMock = vi.fn();

vi.mock("../../../../../utils/rendering/helpers/getActiveTabContent.js", () => ({
    getActiveTabContent: getActiveTabContentMock,
}));

vi.mock("../../../../../utils/ui/controls/addExitFullscreenOverlay.js", () => ({
    addExitFullscreenOverlay: addOverlayMock,
}));

vi.mock("../../../../../utils/ui/controls/removeExitFullscreenOverlay.js", () => ({
    removeExitFullscreenOverlay: removeOverlayMock,
}));

const setReadyState = (state: DocumentReadyState) => {
    Object.defineProperty(document, "readyState", {
        configurable: true,
        get: () => state,
    });
};

describe("addFullScreenButton", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
        document.body.style.overflow = "";
        delete (document as any).exitFullscreen;
        delete (document as any).webkitExitFullscreen;
        delete (document as any).mozCancelFullScreen;
        delete (document as any).msExitFullscreen;
        (document.documentElement as any).requestFullscreen = undefined;
        (document.documentElement as any).webkitRequestFullscreen = undefined;
        (document.documentElement as any).mozRequestFullScreen = undefined;
        (document.documentElement as any).msRequestFullscreen = undefined;
        getActiveTabContentMock.mockReset();
        setReadyState("complete");
        delete (globalThis as any).electronAPI;
    });

    afterEach(() => {
        delete (globalThis as any).screenfull;
        vi.resetModules();
    });

    const loadModule = async () => {
        return await import("../../../../../utils/ui/controls/addFullScreenButton.js");
    };

    it("creates fallback fullscreen button when screenfull is unavailable", async () => {
        delete (globalThis as any).screenfull;
        getActiveTabContentMock.mockReturnValue(null);
        const requestFullscreen = vi.fn();
        (document.documentElement as any).requestFullscreen = requestFullscreen;

        const module = await loadModule();
        module.addFullScreenButton();

        const button = document.getElementById("global-fullscreen-btn");
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button?.classList.contains("fullscreen-btn")).toBe(true);

        (button as HTMLButtonElement).click();
        expect(requestFullscreen).toHaveBeenCalledTimes(1);
    });

    it("uses screenfull API when available and updates overlay state", async () => {
        const storedHandlers: Array<() => void> = [];
        const screenfullMock: ScreenfullMock = {
            isEnabled: true,
            isFullscreen: false,
            request: vi.fn(),
            exit: vi.fn(),
            on: vi.fn((event: string, handler: () => void) => {
                if (event === "change") {
                    storedHandlers.push(handler);
                }
            }),
        };
        (globalThis as any).screenfull = screenfullMock;

        const activeContent = document.createElement("section");
        activeContent.id = "content-data";
        document.body.append(activeContent);
        getActiveTabContentMock.mockReturnValue(activeContent);

        (globalThis as any).electronAPI = { setFullScreen: vi.fn() };

        const module = await loadModule();
        module.addFullScreenButton();

        const button = document.getElementById("global-fullscreen-btn");
        expect(button).toBeInstanceOf(HTMLButtonElement);

        (button as HTMLButtonElement).click();
        expect(screenfullMock.request).toHaveBeenCalledWith(activeContent);

        screenfullMock.isFullscreen = true;
        (button as HTMLButtonElement).click();
        expect(screenfullMock.exit).toHaveBeenCalledTimes(1);

        module.setupFullscreenListeners();
        expect(screenfullMock.on).toHaveBeenCalledWith("change", expect.any(Function));

        const [changeHandler] = storedHandlers;
        expect(changeHandler).toBeTypeOf("function");

        screenfullMock.isFullscreen = true;
        changeHandler();
        expect(addOverlayMock).toHaveBeenCalledWith(activeContent);
        expect(button?.title).toBe("Exit Full Screen (F11)");
        expect(button?.querySelector(".fullscreen-icon")?.innerHTML).toContain("Exit Fullscreen");

        screenfullMock.isFullscreen = false;
        changeHandler();
        expect(removeOverlayMock).toHaveBeenCalledWith(activeContent);
        expect(button?.title).toBe("Toggle Full Screen (F11)");
    });

    it("handles F11 keyboard shortcut with screenfull and native fallback", async () => {
        const storedHandlers: Array<() => void> = [];
        const screenfullMock: ScreenfullMock = {
            isEnabled: true,
            isFullscreen: false,
            request: vi.fn(),
            exit: vi.fn(),
            on: vi.fn((event: string, handler: () => void) => {
                if (event === "change") {
                    storedHandlers.push(handler);
                }
            }),
        };
        (globalThis as any).screenfull = screenfullMock;

        const activeContent = document.createElement("section");
        activeContent.id = "content-map";
        document.body.append(activeContent);
        getActiveTabContentMock.mockReturnValue(activeContent);

        const module = await loadModule();
        module.setupFullscreenListeners();

        const keydown = new KeyboardEvent("keydown", { key: "F11", bubbles: true });
        globalThis.dispatchEvent(keydown);
        expect(screenfullMock.request).toHaveBeenCalledWith(activeContent);

        screenfullMock.isFullscreen = true;
        globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "F11", bubbles: true }));
        expect(screenfullMock.exit).toHaveBeenCalledTimes(1);

        // Switch to native fallback scenario
        delete (globalThis as any).screenfull;
        vi.resetModules();
        document.body.innerHTML = "";
        const nativeRequest = vi.fn();
        (document.documentElement as any).requestFullscreen = nativeRequest;
        getActiveTabContentMock.mockReturnValue(null);

        const fallbackModule = await loadModule();
        fallbackModule.setupFullscreenListeners();
        globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "F11", bubbles: true }));
        expect(nativeRequest).toHaveBeenCalledTimes(1);
    });
});
