import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

export type RendererFileInfoState = {
    displayName: string;
    hasFile: boolean;
    title: string;
};

export const DEFAULT_RENDERER_FILE_INFO: RendererFileInfoState = {
    displayName: "",
    hasFile: false,
    title: "",
};

const RENDERER_FILE_INFO_STATE_PATH = "ui.fileInfo";
const RENDERER_UNLOAD_BUTTON_VISIBLE_STATE_PATH = "ui.unloadButtonVisible";
const LEGACY_RENDERER_CURRENT_FILE_STATE_PATH = "currentFile";
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
    return getState(RENDERER_UNLOAD_BUTTON_VISIBLE_STATE_PATH) === true;
}

export function setRendererUnloadButtonVisible(
    visible: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_UNLOAD_BUTTON_VISIBLE_STATE_PATH, visible, {
        source: "rendererActiveFileState.setUnloadButtonVisible",
        ...options,
    });
}

export function getRendererCurrentFile(): null | string {
    const currentFile = getState(RENDERER_CURRENT_FILE_STATE_PATH);
    return typeof currentFile === "string" && currentFile.length > 0
        ? currentFile
        : null;
}

export function setRendererCurrentFile(
    filePath: null | string,
    options: StateUpdateOptions = {}
): void {
    setState(LEGACY_RENDERER_CURRENT_FILE_STATE_PATH, filePath, {
        source: "rendererActiveFileState.setCurrentFile",
        ...options,
    });
    setState(RENDERER_CURRENT_FILE_STATE_PATH, filePath, {
        source: "rendererActiveFileState.setCurrentFile",
        ...options,
    });
}

export function clearRendererActiveFileState(
    options: StateUpdateOptions = {}
): void {
    setRendererFileInfo(DEFAULT_RENDERER_FILE_INFO, options);
    setRendererUnloadButtonVisible(false, options);
    setRendererCurrentFile(null, options);
}

export function normalizeRendererFileInfo(
    value: Partial<RendererFileInfoState> | unknown
): RendererFileInfoState {
    if (value === null || typeof value !== "object") {
        return { ...DEFAULT_RENDERER_FILE_INFO };
    }

    const record = value as Partial<
        Record<keyof RendererFileInfoState, unknown>
    >;
    return {
        displayName:
            typeof record.displayName === "string" ? record.displayName : "",
        hasFile: record.hasFile === true,
        title: typeof record.title === "string" ? record.title : "",
    };
}
