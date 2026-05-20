import type { FitMessageRow, FitMessages } from "../shared/fit";

/** Decoded FIT payload shape consumed by legacy main UI paths. */
export type FitFileData = FitMessages & {
    recordMesgs?: FitMessageRow[];
};

/** Minimal drag-and-drop handler surface owned by main-ui cleanup code. */
export type DragDropHandlerLike = {
    hideDropOverlay: () => void;
    processDroppedFile: (file: File) => Promise<void>;
    showDropOverlay: () => void;
};

/** Metadata passed when main-ui writes to the shared state manager. */
export type StateChangeOptions = {
    silent?: boolean;
    source: string;
};
