/** Legacy app-level actions used by renderer lifecycle utilities. */
export const AppActions: {
    loadFile(data: unknown, filePath: null | string): void;
    setFileOpening(isOpening: boolean): void;
    [actionName: string]: unknown;
};
