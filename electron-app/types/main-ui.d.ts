/**
 * Placeholder for decoded FIT file structure
 */
export type FitFileData = {
    recordMesgs?: {
        [x: string]: any;
    };
};
export type DragDropHandlerLike = {
    showDropOverlay: Function;
    hideDropOverlay: Function;
    processDroppedFile: (file: File) => Promise<void>;
};
export type StateChangeOptions = {
    silent?: boolean;
    source: string;
};
