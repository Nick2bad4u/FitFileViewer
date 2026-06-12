// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

type LogWithContext = (
    level: string,
    message: string,
    context?: Record<string, unknown>
) => void;

type MockRequest = {
    method?: string;
    url?: string;
};

type MockResponse = ReturnType<typeof makeRes>;
type RequestHandler = (req: MockRequest, res: MockResponse) => void;

const mockLogWithContext = vi.fn<LogWithContext>();

let requestHandler: RequestHandler | null = null;

const mockServer = {
    on: vi.fn<(event: string, listener: (error: unknown) => void) => void>(),
    listen: vi.fn<(port: number, host: string, cb: () => void) => void>(
        (_port, _host, cb) => cb()
    ),
    close: vi.fn<(cb: () => void) => void>((cb) => cb()),
};

const mockHttp = {
    createServer: vi.fn<(handler: RequestHandler) => typeof mockServer>(
        (handler) => {
            requestHandler = handler;
            return mockServer;
        }
    ),
};

let appState: typeof import("../../../../electron-app/main/state/appState.js");

async function importGyazoOAuthServer(): Promise<{
    startGyazoOAuthServer: (port?: number) => Promise<{
        message: string;
        port: number;
        success: boolean;
    }>;
    stopGyazoOAuthServer: () => Promise<{
        message: string;
        success: boolean;
    }>;
}> {
    return (await import(
        "../../../../electron-app/main/oauth/gyazoOAuthServer.js"
    )) as {
        startGyazoOAuthServer: (port?: number) => Promise<{
            message: string;
            port: number;
            success: boolean;
        }>;
        stopGyazoOAuthServer: () => Promise<{
            message: string;
            success: boolean;
        }>;
    };
}

function withRequestHandler(): RequestHandler {
    if (!requestHandler) {
        throw new Error("OAuth request handler was not registered");
    }
    return requestHandler;
}

const mockSend =
    vi.fn<(channel: string, payload: Record<string, string>) => void>();

function getWindowLike(): {
    isDestroyed: () => false;
    webContents: { isDestroyed: () => false; send: typeof mockSend };
} {
    return {
        isDestroyed: () => false,
        webContents: {
            isDestroyed: () => false,
            send: mockSend,
        },
    };
}

function resetMocks(): void {
    requestHandler = null;
    mockLogWithContext.mockClear();
    mockHttp.createServer.mockClear();
    mockServer.listen.mockClear();
    mockServer.close.mockClear();
    mockServer.on.mockClear();
    mockSend.mockClear();

    mockServer.listen.mockImplementation((_port, _host, cb) => cb());
    mockServer.close.mockImplementation((cb) => cb());
    mockServer.on.mockReturnValue(undefined);
    mockHttp.createServer.mockImplementation((handler) => {
        requestHandler = handler;
        return mockServer;
    });
}

function makeRes() {
    const headers: Record<string, string> = {};
    const res = {
        headers,
        statusCode: undefined as number | undefined,
        statusHeaders: undefined as Record<string, string> | undefined,
        body: undefined as unknown,
        setHeader: (k: string, v: string) => {
            headers[k] = v;
        },
        writeHead: vi.fn<
            (statusCode: number, statusHeaders: Record<string, string>) => void
        >((statusCode, statusHeaders) => {
            res.statusCode = statusCode;
            res.statusHeaders = statusHeaders;
        }),
        end: vi.fn<(body?: unknown) => void>((body) => {
            res.body = body;
        }),
    };

    return res;
}

function getResponseHeaderSnapshot(res: MockResponse): {
    cacheControl: string | undefined;
    corsHeaders: string[];
    xContentTypeOptions: string | undefined;
} {
    return {
        cacheControl: res.headers["Cache-Control"],
        corsHeaders: Object.keys(res.headers).filter((header) =>
            header.toLowerCase().startsWith("access-control-")
        ),
        xContentTypeOptions: res.headers["X-Content-Type-Options"],
    };
}

function getServerStateSnapshot(): {
    gyazoServer: unknown;
    gyazoServerPort: unknown;
} {
    return {
        gyazoServer: appState.getAppState("gyazoServer"),
        gyazoServerPort: appState.getAppState("gyazoServerPort"),
    };
}

describe("gyazoOAuthServer", () => {
    beforeEach(async () => {
        vi.resetModules();
        resetMocks();

        vi.doMock(
            "../../../../electron-app/main/logging/logWithContext.js",
            () => ({
                logWithContext: (...args: Parameters<LogWithContext>) =>
                    mockLogWithContext(...args),
            })
        );
        vi.doMock(
            "../../../../electron-app/main/runtime/nodeModules.js",
            () => ({
                default: { httpRef: () => mockHttp },
                httpRef: () => mockHttp,
            })
        );
        appState = await import(
            "../../../../electron-app/main/state/appState.js"
        );
        appState.setAppState("gyazoServer", null);
        appState.setAppState("gyazoServerPort", null);
        appState.setAppState("mainWindow", null);
        // The module under test is imported natively; mocks follow the same
        // source import paths as its migrated dependencies.
    });

    it("starts server and applies safe headers (no CORS)", async () => {
        expect.assertions(6);

        const { startGyazoOAuthServer } = await importGyazoOAuthServer();
        const result = await startGyazoOAuthServer(3000);
        expect(result).toStrictEqual({
            message: "OAuth callback server started on port 3000",
            port: 3000,
            success: true,
        });

        const handler = withRequestHandler();
        const [
            listenPort,
            listenHost,
            listenCallback,
        ] = mockServer.listen.mock.calls[0] ?? [];
        expect(mockHttp.createServer).toHaveBeenCalledExactlyOnceWith(handler);
        expect(mockServer.listen).toHaveBeenCalledExactlyOnceWith(
            3000,
            "localhost",
            listenCallback
        );
        expect({ listenHost, listenPort }).toStrictEqual({
            listenHost: "localhost",
            listenPort: 3000,
        });
        expect(getServerStateSnapshot()).toStrictEqual({
            gyazoServer: mockServer,
            gyazoServerPort: 3000,
        });

        const res = makeRes();
        handler({ method: "GET", url: "/not-found" }, res);

        expect(getResponseHeaderSnapshot(res)).toStrictEqual({
            cacheControl: "no-store",
            corsHeaders: [],
            xContentTypeOptions: "nosniff",
        });
    });

    it("rejects non-GET/HEAD methods", async () => {
        expect.assertions(4);

        const { startGyazoOAuthServer } = await importGyazoOAuthServer();
        await startGyazoOAuthServer(3000);

        const res = makeRes();
        withRequestHandler()({ method: "POST", url: "/gyazo/callback" }, res);
        expect({
            statusCode: res.statusCode,
            statusHeaders: res.statusHeaders,
        }).toStrictEqual({
            statusCode: 405,
            statusHeaders: { "Content-Type": "text/plain" },
        });
        expect(res.body).toBe("Method Not Allowed");
        expect(res.writeHead).toHaveBeenCalledWith(405, {
            "Content-Type": "text/plain",
        });
        expect(res.end).toHaveBeenCalledWith("Method Not Allowed");
    });

    it("rejects malformed request URLs before OAuth handling", async () => {
        expect.assertions(3);

        const { startGyazoOAuthServer } = await importGyazoOAuthServer();
        await startGyazoOAuthServer(3000);

        const res = makeRes();
        const malformedUrl = ["http", "://[invalid-host"].join("");
        withRequestHandler()({ method: "GET", url: malformedUrl }, res);

        expect({
            body: res.body,
            statusCode: res.statusCode,
            statusHeaders: res.statusHeaders,
        }).toStrictEqual({
            body: "Bad Request",
            statusCode: 400,
            statusHeaders: { "Content-Type": "text/plain" },
        });
        expect(getResponseHeaderSnapshot(res)).toStrictEqual({
            cacheControl: "no-store",
            corsHeaders: [],
            xContentTypeOptions: "nosniff",
        });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it("rejects incomplete OAuth callbacks without notifying renderer", async () => {
        expect.assertions(4);

        const { startGyazoOAuthServer } = await importGyazoOAuthServer();
        appState.setAppState("mainWindow", getWindowLike());

        await startGyazoOAuthServer(3000);

        const res = makeRes();
        withRequestHandler()(
            { method: "GET", url: "/gyazo/callback?code=abc" },
            res
        );

        expect({
            statusCode: res.statusCode,
            statusHeaders: res.statusHeaders,
        }).toStrictEqual({
            statusCode: 400,
            statusHeaders: { "Content-Type": "text/html" },
        });
        expect(String(res.body)).toContain("Invalid Request");
        expect(String(res.body)).toContain(
            "Missing authorization code or state parameter"
        );
        expect(mockSend).not.toHaveBeenCalled();
    });

    it("escapes error parameter in HTML response", async () => {
        expect.assertions(2);

        const { startGyazoOAuthServer } = await importGyazoOAuthServer();
        await startGyazoOAuthServer(3000);

        const res = makeRes();
        withRequestHandler()(
            {
                method: "GET",
                url: "/gyazo/callback?error=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
            },
            res
        );

        const html = String(res.body);
        expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
        expect(html).not.toContain("<script>");
    });

    it("sends callback payload to mainWindow when code/state are present", async () => {
        expect.assertions(3);

        const { startGyazoOAuthServer } = await importGyazoOAuthServer();
        appState.setAppState("mainWindow", getWindowLike());

        await startGyazoOAuthServer(3000);

        const res = makeRes();
        withRequestHandler()(
            { method: "GET", url: "/gyazo/callback?code=abc&state=xyz" },
            res
        );

        expect({
            statusCode: res.statusCode,
            statusHeaders: res.statusHeaders,
        }).toStrictEqual({
            statusCode: 200,
            statusHeaders: { "Content-Type": "text/html" },
        });
        expect(String(res.body)).toContain("Authorization Successful");
        expect(mockSend).toHaveBeenCalledWith("gyazo-oauth-callback", {
            code: "abc",
            state: "xyz",
        });
    });

    it("stop server clears state even if close throws", async () => {
        expect.assertions(1);

        const { startGyazoOAuthServer, stopGyazoOAuthServer } =
            await importGyazoOAuthServer();

        await startGyazoOAuthServer(3000);
        // Force close to throw
        mockServer.close.mockImplementationOnce(() => {
            throw new Error("boom");
        });

        const result = await stopGyazoOAuthServer();
        expect({
            result,
            state: getServerStateSnapshot(),
        }).toStrictEqual({
            result: {
                message: "Failed to stop OAuth callback server",
                success: false,
            },
            state: {
                gyazoServer: null,
                gyazoServerPort: null,
            },
        });
    });
});
