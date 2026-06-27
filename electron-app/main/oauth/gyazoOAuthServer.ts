import { sendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext } from "../logging/logWithContext.js";
import { httpRef } from "../runtime/nodeModules.js";
import {
    clearGyazoServerState,
    getGyazoServer,
    getMainWindow,
    setGyazoServerState,
} from "../state/appState.js";

type GyazoServerStartResult = import("../../shared/ipc").GyazoServerStartResult;
type GyazoServerStopResult = import("../../shared/ipc").GyazoServerStopResult;
type OAuthServer = import("node:http").Server;
type ServerResponse = import("node:http").ServerResponse;
type RendererIpcEventChannel =
    import("../../shared/ipc").RendererIpcEventChannel;

interface OAuthWindowLike {
    isDestroyed?: () => boolean;
    webContents?: {
        isDestroyed?: () => boolean;
        send?: (channel: RendererIpcEventChannel, ...args: unknown[]) => void;
    };
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isAddressInUseError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const candidate = error as { readonly code?: unknown };
    return candidate.code === "EADDRINUSE";
}

function asOAuthServer(value: unknown): OAuthServer | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const candidate = value as { readonly close?: unknown };
    return typeof candidate.close === "function"
        ? (value as OAuthServer)
        : null;
}

function asOAuthWindow(value: unknown): OAuthWindowLike | null {
    return value && (typeof value === "object" || typeof value === "function")
        ? value
        : null;
}

function applyStandardHeaders(res: ServerResponse): void {
    try {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("X-Frame-Options", "DENY");

        // The callback serves only simple inline HTML. Disallow remote loads.
        res.setHeader(
            "Content-Security-Policy",
            "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'"
        );
    } catch {
        /* ignore */
    }
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function sendOAuthCallbackToRenderer(code: string, state: string): void {
    const mainWindow = asOAuthWindow(getMainWindow());
    sendToRenderer(mainWindow, "gyazo-oauth-callback", { code, state });
}

function writeOAuthErrorPage(res: ServerResponse, error: string): void {
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
                            <strong>Error:</strong> ${escapeHtml(error)}
                        </div>
                        <p>Please close this window and try again from the FitFileViewer application.</p>
                    </div>
                </body>
            </html>
        `);
    /* c8 ignore stop */
}

function writeOAuthSuccessPage(res: ServerResponse): void {
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
                        .close-note { font-size: 14px; color: #888; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>✅ Authorization Successful!</h1>
                        <div class="success">
                            <strong>Success!</strong> Your Gyazo account has been connected to FitFileViewer.
                        </div>
                        <p>You can now upload charts to your Gyazo account.</p>
                        <div class="close-note">You can close this window and return to FitFileViewer.</div>
                    </div>
                </body>
            </html>
        `);
    /* c8 ignore stop */
}

function writeInvalidOAuthRequestPage(res: ServerResponse): void {
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

/**
 * Starts the local OAuth callback server used for Gyazo integrations.
 */
export async function startGyazoOAuthServer(
    port = 3000
): Promise<GyazoServerStartResult> {
    const existingServer = getGyazoServer();
    if (existingServer) {
        await stopGyazoOAuthServer();
    }

    return new Promise<GyazoServerStartResult>((resolve, reject) => {
        try {
            const http = httpRef();
            if (!http || typeof http.createServer !== "function") {
                throw new Error("HTTP module unavailable");
            }

            const server = http.createServer((req, res) => {
                let parsedUrl: URL;
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
                        writeOAuthErrorPage(res, String(error));
                    } else if (code && state) {
                        writeOAuthSuccessPage(res);
                        sendOAuthCallbackToRenderer(code, state);
                    } else {
                        writeInvalidOAuthRequestPage(res);
                    }
                } else {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Not Found");
                }
            });

            server.on("error", (error) => {
                if (isAddressInUseError(error)) {
                    logWithContext(
                        "warn",
                        `Port ${port} is in use, trying port ${port + 1}`
                    );
                    if (port < 3010) {
                        void startGyazoOAuthServer(port + 1)
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
                    reject(error);
                }
            });

            server.listen(port, "localhost", () => {
                setGyazoServerState(server, port);
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
                error: getErrorMessage(error),
            });
            reject(
                error instanceof Error
                    ? error
                    : new Error(getErrorMessage(error))
            );
        }
    });
}

/**
 * Stops the Gyazo OAuth callback server if it is currently running.
 */
export async function stopGyazoOAuthServer(): Promise<GyazoServerStopResult> {
    return new Promise<GyazoServerStopResult>((resolve) => {
        const gyazoServer = asOAuthServer(getGyazoServer());
        if (gyazoServer) {
            try {
                gyazoServer.close(() => {
                    logWithContext(
                        "info",
                        "Gyazo OAuth callback server stopped"
                    );
                    clearGyazoServerState();
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
                        error: getErrorMessage(error),
                    }
                );
                clearGyazoServerState();
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

export default {
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
};
