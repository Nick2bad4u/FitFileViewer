/**
 * Dev Runner for Electron with Vite HMR
 * This script starts Vite dev server and Electron with proper debugging
 */

import electron from 'electron';
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { createServer } from 'vite';

const DEV_SERVER_PORT = 5273;
const ELECTRON_DEBUG_PORT = 9230;
const RENDERER_DEBUG_PORT = 9222;

let electronProcess = null;
let manualRestart = false;

/**
 * Main function
 */
async function main() {
    try {
        // Start Vite dev server
        await startVite();

        // Start Electron
        startElectron();

        // Watch main process files
        watchMainProcess();

        console.log('\n🎉 Development environment ready!');
        console.log(`📊 Main process debugger: chrome://inspect on port ${ELECTRON_DEBUG_PORT}`);
        console.log(`🎨 Renderer process debugger: chrome://inspect on port ${RENDERER_DEBUG_PORT}`);
        console.log('🔥 HMR enabled for renderer process\n');

    } catch (error) {
        console.error('❌ Error starting development environment:', error);
        process.exit(1);
    }
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
            process.exit(code || 0);
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

    await server.listen();

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
        watch(file, (eventType) => {
            if (eventType === 'change') {
                console.log(`📝 ${file} changed, restarting Electron...`);
                restartElectron();
            }
        });
    }
}

// Handle process termination
process.on('SIGINT', () => {
    if (electronProcess) {
        electronProcess.kill();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    if (electronProcess) {
        electronProcess.kill();
    }
    process.exit(0);
});

// Start
main();
