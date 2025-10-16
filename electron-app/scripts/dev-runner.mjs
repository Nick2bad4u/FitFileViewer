/**
 * Dev Runner for Electron with Vite HMR
 * This script starts Vite dev server and Electron with proper debugging
 */

import electron from 'electron';
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { createServer } from 'vite';
import { randomBytes } from 'node:crypto';

const DEV_SERVER_PORT = process.env.DEV_SERVER_PORT ? Number(process.env.DEV_SERVER_PORT) : 5273;
const ELECTRON_DEBUG_PORT = 9230;
const RENDERER_DEBUG_PORT = 9222;

let electronProcess = null;
let manualRestart = false;
let viteServer = null;
let mcpProcess = null;
const fileWatchers = [];
let shuttingDown = false;

/**
 * Main function
 */
async function main() {
    try {
        // Start Vite dev server
        viteServer = await startVite();

        // Start Electron
        startElectron();

        // Optionally start an MCP server for debugging if requested
        if (process.env.ENABLE_MCP === '1' || process.argv.includes('--mcp')) {
            try {
                startMcpServer();
            } catch (err) {
                console.warn('⚠️  Failed to start MCP server:', err?.message || err);
            }
        }

        // Watch main process files
        watchMainProcess();

        console.log('\n🎉 Development environment ready!');
        console.log(`📊 Main process debugger: chrome://inspect on port ${ELECTRON_DEBUG_PORT}`);
        console.log(`🎨 Renderer process debugger: chrome://inspect on port ${RENDERER_DEBUG_PORT}`);
        console.log('🔥 HMR enabled for renderer process\n');

    } catch (error) {
        console.error('❌ Error starting development environment:', error);
        await shutdown();
        throw error;
    }
}

/**
 * Start an external MCP server (optional in development).
 * This launches `npx electron-mcp-server` (or fallback to other MCP implementations available via npx).
 * If you prefer a local install, add `electron-mcp-server` as a devDependency.
 */
function startMcpServer() {
    if (mcpProcess) return;

    console.log('⚙️  Starting MCP server (optional)...');

    // Use npx so users can run without fully installing the package globally.
    // shell:true gives Windows-friendly command resolution.
    // Ensure required env vars for the MCP server are present in development.
    const mcpEnv = { ...process.env };
    if (!mcpEnv.SCREENSHOT_ENCRYPTION_KEY) {
        // Generate a secure random 32-byte hex string for screenshots encryption in dev.
        try {
            mcpEnv.SCREENSHOT_ENCRYPTION_KEY = randomBytes(32).toString('hex');
            console.log('🔐 Generated temporary SCREENSHOT_ENCRYPTION_KEY for MCP server (dev only)');
        } catch (err) {
            console.warn('⚠️  Failed to generate SCREENSHOT_ENCRYPTION_KEY automatically:', err && err.message ? err.message : err);
        }
    }

    mcpProcess = spawn('npx electron-mcp-server --quiet', {
        shell: true,
        env: mcpEnv,
        stdio: 'inherit',
    });

    mcpProcess.on('error', (err) => {
        console.warn('⚠️  MCP process error:', err && err.message ? err.message : err);
    });

    mcpProcess.on('close', (code, signal) => {
        console.log(`ℹ️  MCP process exited (code=${code || 0}, signal=${signal || 'none'})`);
        mcpProcess = null;
    });

    console.log('✅ MCP server launch requested (will be downloaded/used via npx if not installed).');
}

/**
 * Restart Electron process
 */
function restartElectron() {
    if (electronProcess) {
        manualRestart = true;
        electronProcess.kill();
        electronProcess = null;

        setTimeout(() => {
            manualRestart = false;
            startElectron();
        }, 1000);
    }
}

/**
 * Start Electron process
 */
async function shutdown() {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;

    if (electronProcess) {
        electronProcess.removeAllListeners('close');
        electronProcess.kill();
        electronProcess = null;
    }

    while (fileWatchers.length > 0) {
        const watcher = fileWatchers.pop();
        watcher?.close();
    }

    if (viteServer) {
        try {
            await viteServer.close();
        } catch (error) {
            console.error('⚠️  Failed to close Vite server cleanly:', error);
        }
        viteServer = null;
    }
}

function startElectron() {
    console.log('⚡ Starting Electron...');

    const args = [
        '.',
        `--inspect=${ELECTRON_DEBUG_PORT}`,
        `--remote-debugging-port=${RENDERER_DEBUG_PORT}`,
    ];

    electronProcess = spawn(electron, args, {
        env: {
            ...process.env,
            NODE_ENV: 'development',
            ELECTRON_IS_DEV: '1',
            VITE_DEV_SERVER_URL: `http://localhost:${DEV_SERVER_PORT}`,
        },
        stdio: 'inherit',
    });

    electronProcess.on('close', (code) => {
        if (!manualRestart) {
            console.log('Electron exited with code:', code);
            shutdown()
                .then(() => {
                    if ((code ?? 0) !== 0) {
                        setImmediate(() => {
                            throw new Error(`Electron process exited with code ${code}`);
                        });
                    }
                })
                .catch((error) => {
                    console.error('⚠️  Error during shutdown:', error);
                });
        }
    });

    console.log('✅ Electron started');
}

/**
 * Start Vite dev server
 */
async function startVite() {
    console.log('🚀 Starting Vite dev server...');

    const server = await createServer({
        configFile: './vite.config.js',
        mode: 'development',
    });

    // Listen on the configured port (allow override via DEV_SERVER_PORT env var)
    try {
        await server.listen({ port: DEV_SERVER_PORT });
    } catch (err) {
        // Re-throw so upstream shutdown handles it
        throw err;
    }

    console.log(`✅ Vite dev server running at http://localhost:${DEV_SERVER_PORT}`);

    return server;
}

/**
 * Watch main process files
 */
function watchMainProcess() {
    const mainFiles = ['main.js', 'preload.js', 'fitParser.js', 'windowStateUtils.js'];

    console.log('👀 Watching main process files...');

    for (const file of mainFiles) {
        const watcher = watch(file, (eventType) => {
            if (eventType === 'change') {
                console.log(`📝 ${file} changed, restarting Electron...`);
                restartElectron();
            }
        });
        fileWatchers.push(watcher);
    }

}


// Handle process termination
process.on('SIGINT', () => {
    shutdown().catch((error) => {
        console.error('⚠️  Error during shutdown:', error);
    });
});

process.on('SIGTERM', () => {
    shutdown().catch((error) => {
        console.error('⚠️  Error during shutdown:', error);
    });
});

// Start
main();
