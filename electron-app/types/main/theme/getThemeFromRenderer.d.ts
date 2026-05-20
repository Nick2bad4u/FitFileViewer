export interface ThemeWindowCandidate {
    isDestroyed?: () => boolean;
    webContents?: {
        executeJavaScript: (script: string) => Promise<unknown>;
        isDestroyed?: () => boolean;
    };
}

/**
 * Fetches the persisted theme from the renderer by reading localStorage. The
 * helper is resilient to missing BrowserWindow instances so Jasmine/Vitest
 * environments without a DOM do not crash.
 */
export function getThemeFromRenderer(
    win?: ThemeWindowCandidate | null
): Promise<string>;
