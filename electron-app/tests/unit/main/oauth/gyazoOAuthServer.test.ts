/**
 * @vitest-environment node
 */

import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);

const mockLogWithContext = vi.fn();

let requestHandler: ((req: any, res: any) => void) | null = null;

const mockServer = {
    on: vi.fn(),
    listen: vi.fn((_port: number, _host: string, cb: () => void) => cb()),
    close: vi.fn((cb: () => void) => cb()),
};

const mockHttp = {
    createServer: vi.fn((handler: any) => {
        requestHandler = handler;
        return mockServer;
    }),
};

const state = new Map<string, any>();

function injectCjsMock(modulePath: string, exportsObj: any) {
    const cache = (require as unknown as { cache: Record<string, any> }).cache;
    cache[modulePath] = {
        id: modulePath,
        filename: modulePath,
        loaded: true,
        exports: exportsObj,
    } as any;
}

function makeRes() {
    const headers: Record<string, string> = {};
    return {
        headers,
        setHeader: (k: string, v: string) => {
            headers[k] = v;
        },
        writeHead: vi.fn(),
        end: vi.fn(),
    };
}

describe("gyazoOAuthServer", () => {
    beforeEach(() => {
        state.clear();
        requestHandler = null;
        mockLogWithContext.mockClear();
        mockHttp.createServer.mockClear();
        mockServer.listen.mockClear();
        mockServer.close.mockClear();
        mockServer.on.mockClear();

        // Inject mocks for the CJS requires used by the module under test.
        injectCjsMock(
            require.resolve("../../../../main/logging/logWithContext"),
            {
                logWithContext: (...args: any[]) => mockLogWithContext(...args),
            }
        );
        injectCjsMock(require.resolve("../../../../main/runtime/nodeModules"), {
            httpRef: () => mockHttp,
        });
        injectCjsMock(require.resolve("../../../../main/state/appState"), {
            getAppState: (key: string) => state.get(key),
            setAppState: (key: string, value: any) => state.set(key, value),
        });
        injectCjsMock(
            require.resolve("../../../../main/window/windowValidation"),
            {
                validateWindow: () => true,
            }
        );

        // Ensure we reload the module under test with the new cache injections.
        const sutPath =
            require.resolve("../../../../main/oauth/gyazoOAuthServer.js");
        const cache = (require as unknown as { cache: Record<string, any> })
            .cache;
        delete cache[sutPath];
    });

    it("starts server and applies safe headers (no CORS)", async () => {
        const {
            startGyazoOAuthServer,
        } = require("../../../../main/oauth/gyazoOAuthServer.js");

        const result = await startGyazoOAuthServer(3000);
        expect(result.success).toBe(true);
        expect(mockServer.listen).toHaveBeenCalledWith(
            3000,
            "localhost",
            expect.any(Function)
        );
        expect(requestHandler).toBeTypeOf("function");

        const res = makeRes();
        requestHandler!({ method: "GET", url: "/not-found" }, res);

        // Ensure standard headers exist and no Access-Control-* headers were set
        expect(res.headers["X-Content-Type-Options"]).toBe("nosniff");
        expect(res.headers["Cache-Control"]).toBe("no-store");
        expect(
            Object.keys(res.headers).some((k) =>
                k.toLowerCase().startsWith("access-control-")
            )
        ).toBe(false);
    });

    it("rejects non-GET/HEAD methods", async () => {
        const {
            startGyazoOAuthServer,
        } = require("../../../../main/oauth/gyazoOAuthServer.js");
        await startGyazoOAuthServer(3000);

        const res = makeRes();
        requestHandler!({ method: "POST", url: "/gyazo/callback" }, res);
        expect(res.writeHead).toHaveBeenCalledWith(405, expect.any(Object));
        expect(res.end).toHaveBeenCalledWith("Method Not Allowed");
    });

    it("escapes error parameter in HTML response", async () => {
        const {
            startGyazoOAuthServer,
        } = require("../../../../main/oauth/gyazoOAuthServer.js");
        await startGyazoOAuthServer(3000);

        const res = makeRes();
        requestHandler!(
            {
                method: "GET",
                url: "/gyazo/callback?error=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
            },
            res
        );

        const html = String((res.end as any).mock.calls[0][0]);
        expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
        expect(html).not.toContain("<script>");
    });

    it("sends callback payload to mainWindow when code/state are present", async () => {
        const {
            startGyazoOAuthServer,
        } = require("../../../../main/oauth/gyazoOAuthServer.js");

        const send = vi.fn();
        state.set("mainWindow", { webContents: { send } });

        await startGyazoOAuthServer(3000);

        const res = makeRes();
        requestHandler!(
            { method: "GET", url: "/gyazo/callback?code=abc&state=xyz" },
            res
        );

        expect(send).toHaveBeenCalledWith("gyazo-oauth-callback", {
            code: "abc",
            state: "xyz",
        });
    });

    it("stop server clears state even if close throws", async () => {
        const {
            startGyazoOAuthServer,
            stopGyazoOAuthServer,
        } = require("../../../../main/oauth/gyazoOAuthServer.js");

        await startGyazoOAuthServer(3000);
        // Force close to throw
        mockServer.close.mockImplementationOnce(() => {
            throw new Error("boom");
        });

        const result = await stopGyazoOAuthServer();
        expect(result.success).toBe(false);
        expect(state.get("gyazoServer")).toBeNull();
        expect(state.get("gyazoServerPort")).toBeNull();
    });
});
