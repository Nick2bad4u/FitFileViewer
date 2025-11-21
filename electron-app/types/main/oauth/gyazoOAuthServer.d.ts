/**
 * Starts the local OAuth callback server used for Gyazo integrations. The implementation mirrors the
 * previous main.js logic, including informative logging and defensive error handling for tests.
 *
 * @param {number} [port=3000] - Desired port for the callback server.
 * @returns {Promise<{ success: boolean, message: string, port?: number }>} Server status payload.
 */
export function startGyazoOAuthServer(port?: number): Promise<{
    success: boolean;
    message: string;
    port?: number;
}>;
/**
 * Stops the Gyazo OAuth callback server if it is currently running.
 *
 * @returns {Promise<{ success: boolean, message: string }>} Server shutdown payload.
 */
export function stopGyazoOAuthServer(): Promise<{
    success: boolean;
    message: string;
}>;
//# sourceMappingURL=gyazoOAuthServer.d.ts.map
