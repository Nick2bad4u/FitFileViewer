const { logWithContext } = require("../logging/logWithContext");
const { httpRef } = require("../runtime/nodeModules");
const { getAppState, setAppState } = require("../state/appState");
const { validateWindow } = require("../window/windowValidation");

/**
 * Starts the local OAuth callback server used for Gyazo integrations. The implementation mirrors the
 * previous main.js logic, including informative logging and defensive error handling for tests.
 *
 * @param {number} [port=3000] - Desired port for the callback server.
 * @returns {Promise<{ success: boolean, message: string, port?: number }>} Server status payload.
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
                const parsedUrl = new URL(/** @type {string} */ (req.url), `http://localhost:${port}`);

                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "Content-Type");

                if (req.method === "OPTIONS") {
                    res.writeHead(200);
                    res.end();
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
                                            <strong>Error:</strong> ${error}
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
                        if (validateWindow(mainWindow, "gyazo-oauth-callback")) {
                            mainWindow.webContents.send("gyazo-oauth-callback", { code, state });
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
                    logWithContext("warn", `Port ${port} is in use, trying port ${port + 1}`);
                    if (port < 3010) {
                        startGyazoOAuthServer(port + 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(new Error("Unable to find an available port for OAuth callback server"));
                    }
                } else {
                    reject(err);
                }
            });

            server.listen(port, "localhost", () => {
                setAppState("gyazoServer", server);
                setAppState("gyazoServerPort", port);
                logWithContext("info", `Gyazo OAuth callback server started on http://localhost:${port}`);
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
 * @returns {Promise<{ success: boolean, message: string }>} Server shutdown payload.
 */
async function stopGyazoOAuthServer() {
    return new Promise((resolve) => {
        const gyazoServer = getAppState("gyazoServer");
        if (gyazoServer) {
            gyazoServer.close(() => {
                logWithContext("info", "Gyazo OAuth callback server stopped");
                setAppState("gyazoServer", null);
                setAppState("gyazoServerPort", null);
                resolve({
                    message: "OAuth callback server stopped",
                    success: true,
                });
            });
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
