const { logWithContext } = require("../logging/logWithContext");
const { httpRef } = require("../runtime/nodeModules");
const { getAppState, setAppState } = require("../state/appState");
const { validateWindow } = require("../window/windowValidation");

/**
 * Apply common security headers for all responses.
 *
 * The callback server is bound to localhost, but we still:
 *
 * - Disable MIME sniffing
 * - Prevent caching (OAuth codes should not be stored)
 * - Prevent framing
 * - Restrict resource loading
 *
 * @param {any} res
 */
function applyStandardHeaders(res) {
    try {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("X-Frame-Options", "DENY");

        // We serve only simple inline HTML. Disallow any remote loads.
        res.setHeader(
            "Content-Security-Policy",
            "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'"
        );
    } catch {
        /* ignore */
    }
}

/**
 * Minimal HTML escaping for user-controlled strings rendered into OAuth
 * callback pages. This server is bound to localhost, but we still escape to
 * prevent reflected injection.
 *
 * @param {string} value
 *
 * @returns {string}
 */
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/**
 * Starts the local OAuth callback server used for Gyazo integrations. The
 * implementation mirrors the previous main.js logic, including informative
 * logging and defensive error handling for tests.
 *
 * @param {number} [port=3000] - Desired port for the callback server. Default
 *   is `3000`
 *
 * @returns {Promise<{ success: boolean; message: string; port?: number }>}
 *   Server status payload.
 */
async function startGyazoOAuthServer(port = 3000) {
    const existingServer = getAppState("gyazoServer");
    if (existingServer) {
        await stopGyazoOAuthServer();
    }

    return new Promise((resolve, reject) => {
        try {
            const http = httpRef();
            if (!http || typeof http.createServer !== "function") {
                throw new Error("HTTP module unavailable");
            }

            const server = http.createServer((req, res) => {
                /** @type {URL | null} */
                let parsedUrl = null;
                try {
                    const raw = typeof req.url === "string" ? req.url : "";
                    parsedUrl = new URL(raw, `http://localhost:${port}`);
                } catch {
                    applyStandardHeaders(res);
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("Bad Request");
                    return;
                }

                applyStandardHeaders(res);

                // OAuth callback is a simple browser redirect; there is no need for CORS.
                // Restrict methods to reduce attack surface.
                const method =
                    typeof req.method === "string"
                        ? req.method.toUpperCase()
                        : "";
                if (method !== "GET" && method !== "HEAD") {
                    res.writeHead(405, { "Content-Type": "text/plain" });
                    res.end("Method Not Allowed");
                    return;
                }

                if (parsedUrl.pathname === "/gyazo/callback") {
                    const code = parsedUrl.searchParams.get("code");
                    const error = parsedUrl.searchParams.get("error");
                    const state = parsedUrl.searchParams.get("state");

                    if (error) {
                        res.writeHead(200, { "Content-Type": "text/html" });
                        /* c8 ignore start */
                        res.end(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Gyazo OAuth - Error</title>
                                    <style>
                                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 40px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                                        h1 { color: #e74c3c; margin: 0 0 20px 0; }
                                        p { color: #666; line-height: 1.6; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>❌ Authorization Failed</h1>
                                        <div class="error">
                                            <strong>Error:</strong> ${escapeHtml(String(error))}
                                        </div>
                                        <p>Please close this window and try again from the FitFileViewer application.</p>
                                    </div>
                                </body>
                            </html>
                        `);
                        /* c8 ignore stop */
                    } else if (code && state) {
                        res.writeHead(200, { "Content-Type": "text/html" });
                        /* c8 ignore start */
                        res.end(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Gyazo OAuth - Success</title>
                                    <style>
                                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 40px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                                        h1 { color: #27ae60; margin: 0 0 20px 0; }
                                        p { color: #666; line-height: 1.6; }
                                        .success { background: #eafaf1; padding: 15px; border-radius: 8px; margin: 20px 0; }
                                        .auto-close { font-size: 14px; color: #888; margin-top: 20px; }
                                    </style>
                                    <script>
                                        setTimeout(function () {
                                            window.close();
                                        }, 3000);
                                    </script>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>✅ Authorization Successful!</h1>
                                        <div class="success">
                                            <strong>Success!</strong> Your Gyazo account has been connected to FitFileViewer.
                                        </div>
                                        <p>You can now upload charts to your Gyazo account. This window will close automatically.</p>
                                        <div class="auto-close">Closing in 3 seconds...</div>
                                    </div>
                                </body>
                            </html>
                        `);
                        /* c8 ignore stop */
                        const mainWindow = getAppState("mainWindow");
                        if (
                            validateWindow(mainWindow, "gyazo-oauth-callback")
                        ) {
                            mainWindow.webContents.send(
                                "gyazo-oauth-callback",
                                { code, state }
                            );
                        }
                    } else {
                        res.writeHead(400, { "Content-Type": "text/html" });
                        /* c8 ignore start */
                        res.end(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Gyazo OAuth - Invalid Request</title>
                                    <style>
                                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 40px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                                        h1 { color: #f39c12; margin: 0 0 20px 0; }
                                        p { color: #666; line-height: 1.6; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>⚠️ Invalid Request</h1>
                                        <p>Missing authorization code or state parameter. Please try again from the FitFileViewer application.</p>
                                    </div>
                                </body>
                            </html>
                        `);
                        /* c8 ignore stop */
                    }
                } else {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Not Found");
                }
            });

            server.on("error", (err) => {
                if (/** @type {any} */ (err).code === "EADDRINUSE") {
                    logWithContext(
                        "warn",
                        `Port ${port} is in use, trying port ${port + 1}`
                    );
                    if (port < 3010) {
                        startGyazoOAuthServer(port + 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(
                            new Error(
                                "Unable to find an available port for OAuth callback server"
                            )
                        );
                    }
                } else {
                    reject(err);
                }
            });

            server.listen(port, "localhost", () => {
                setAppState("gyazoServer", server);
                setAppState("gyazoServerPort", port);
                logWithContext(
                    "info",
                    `Gyazo OAuth callback server started on http://localhost:${port}`
                );
                resolve({
                    message: `OAuth callback server started on port ${port}`,
                    port,
                    success: true,
                });
            });
        } catch (error) {
            logWithContext("error", "Failed to start Gyazo OAuth server:", {
                error: /** @type {Error} */ (error).message,
            });
            reject(error);
        }
    });
}

/**
 * Stops the Gyazo OAuth callback server if it is currently running.
 *
 * @returns {Promise<{ success: boolean; message: string }>} Server shutdown
 *   payload.
 */
async function stopGyazoOAuthServer() {
    return new Promise((resolve) => {
        const gyazoServer = getAppState("gyazoServer");
        if (gyazoServer) {
            try {
                gyazoServer.close(() => {
                    logWithContext(
                        "info",
                        "Gyazo OAuth callback server stopped"
                    );
                    setAppState("gyazoServer", null);
                    setAppState("gyazoServerPort", null);
                    resolve({
                        message: "OAuth callback server stopped",
                        success: true,
                    });
                });
            } catch (error) {
                logWithContext(
                    "warn",
                    "Failed to close Gyazo OAuth callback server",
                    {
                        error: /** @type {Error} */ (error)?.message,
                    }
                );
                setAppState("gyazoServer", null);
                setAppState("gyazoServerPort", null);
                resolve({
                    message: "Failed to stop OAuth callback server",
                    success: false,
                });
            }
        } else {
            resolve({
                message: "No server was running",
                success: true,
            });
        }
    });
}

module.exports = {
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
};
