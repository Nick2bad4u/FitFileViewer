/**
 * Fetches the persisted theme from the renderer by reading localStorage. The helper is resilient to
 * missing BrowserWindow instances so Jasmine/Vitest environments without a DOM do not crash.
 *
 * @param {any} win - BrowserWindow whose webContents will be queried.
 * @returns {Promise<string>} Resolved theme name falling back to the default theme.
 */
export function getThemeFromRenderer(win: any): Promise<string>;
//# sourceMappingURL=getThemeFromRenderer.d.ts.map