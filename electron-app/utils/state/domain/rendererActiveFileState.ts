import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export {
    DEFAULT_RENDERER_FILE_INFO,
    normalizeRendererCurrentFile,
    normalizeRendererFileInfo,
    normalizeRendererUnloadButtonVisible,
    type RendererFileInfoState,
} from "./rendererActiveFileContract.js";
import {
    DEFAULT_RENDERER_FILE_INFO,
    normalizeRendererCurrentFile,
    normalizeRendererFileInfo,
    normalizeRendererUnloadButtonVisible,
    type RendererFileInfoState,
} from "./rendererActiveFileContract.js";

const RENDERER_FILE_INFO_STATE_PATH = "ui.fileInfo";
const RENDERER_UNLOAD_BUTTON_VISIBLE_STATE_PATH = "ui.unloadButtonVisible";
const RENDERER_CURRENT_FILE_STATE_PATH = "fitFile.currentFile";

export function getRendererFileInfo(): RendererFileInfoState {
    return normalizeRendererFileInfo(getState(RENDERER_FILE_INFO_STATE_PATH));
}

export function setRendererFileInfo(
    fileInfo: Partial<RendererFileInfoState> | RendererFileInfoState,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_FILE_INFO_STATE_PATH,
        normalizeRendererFileInfo(fileInfo),
        {
            source: "rendererActiveFileState.setFileInfo",
            ...options,
        }
    );
}

export function isRendererUnloadButtonVisible(): boolean {
    return normalizeRendererUnloadButtonVisible(
        getState(RENDERER_UNLOAD_BUTTON_VISIBLE_STATE_PATH)
    );
}

export function setRendererUnloadButtonVisible(
    visible: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_UNLOAD_BUTTON_VISIBLE_STATE_PATH,
        normalizeRendererUnloadButtonVisible(visible),
        {
            source: "rendererActiveFileState.setUnloadButtonVisible",
            ...options,
        }
    );
}

export function getRendererCurrentFile(): null | string {
    return normalizeRendererCurrentFile(
        getState(RENDERER_CURRENT_FILE_STATE_PATH)
    );
}

export function setRendererCurrentFile(
    filePath: null | string,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_CURRENT_FILE_STATE_PATH,
        normalizeRendererCurrentFile(filePath),
        {
            source: "rendererActiveFileState.setCurrentFile",
            ...options,
        }
    );
}

export function clearRendererActiveFileState(
    options: StateUpdateOptions = {}
): void {
    setRendererFileInfo(DEFAULT_RENDERER_FILE_INFO, options);
    setRendererUnloadButtonVisible(false, options);
    setRendererCurrentFile(null, options);
}
