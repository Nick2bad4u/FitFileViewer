/**
 * Registers IPC handlers that expose platform and application metadata.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.appRef
 * @param {{ readFileSync?: Function }} options.fs
 * @param {{ join: Function }} options.path
 * @param {{ DEFAULT_THEME: string, SETTINGS_CONFIG_NAME: string }} options.CONSTANTS
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 * @param {() => { Conf: new (options: { name: string }) => { get: (key: string, fallback: any) => any } }} [options.loadConf]
 */
function createInfoHandlers({ appRef, fs, path, CONSTANTS, logWithContext, loadConf }) {
    const resolveConfModule = typeof loadConf === 'function'
        ? loadConf
        : /* c8 ignore next */ function loadElectronConf() {
            // The real electron-conf pulls electron.app paths which are inaccessible in unit tests.
            return require('electron-conf');
        };

    return {
        getAppVersion: async function getAppVersion() {
            const app = appRef?.();
            return app && typeof app.getVersion === 'function' ? app.getVersion() : '';
        },
        getChromeVersion: async function getChromeVersion() {
            return process.versions.chrome;
        },
        getElectronVersion: async function getElectronVersion() {
            return process.versions.electron;
        },
        getLicenseInfo: async () => {
            try {
                const app = appRef?.();
                const basePath = app && typeof app.getAppPath === 'function' ? app.getAppPath() : process.cwd();
                if (!fs || typeof fs.readFileSync !== 'function') {
                    throw new Error('Filesystem module unavailable');
                }
                const pkgPath = path.join(basePath, 'package.json');
                const packageJsonBuffer = fs.readFileSync(pkgPath);
                const packageJson = JSON.parse(packageJsonBuffer.toString('utf8'));
                return packageJson.license || 'Unknown';
            } catch (error) {
                logWithContext?.('error', 'Failed to read license from package.json:', {
                    error: /** @type {Error} */ (error)?.message,
                });
                return 'Unknown';
            }
        },
        getNodeVersion: async function getNodeVersion() {
            return process.versions.node;
        },
        getPlatformInfo: async () => ({
            arch: process.arch,
            platform: process.platform,
        }),
        'map-tab:get': async function getMapTab() {
            const { Conf } = resolveConfModule();
            const conf = new Conf({ name: CONSTANTS?.SETTINGS_CONFIG_NAME });
            return conf.get('selectedMapTab', 'map');
        },
        'theme:get': async function getTheme() {
            const { Conf } = resolveConfModule();
            const conf = new Conf({ name: CONSTANTS?.SETTINGS_CONFIG_NAME });
            return conf.get('theme', CONSTANTS?.DEFAULT_THEME);
        },
    };
}

function registerInfoHandlers(options) {
    wireInfoHandlers(options ?? {});
}

function wireInfoHandlers(options = {}) {
    const registerIpcHandle = options?.registerIpcHandle;
    const logWithContext = options?.logWithContext;

    if (typeof registerIpcHandle !== 'function') {
        return;
    }

    const handlers = createInfoHandlers({
        appRef: options?.appRef,
        fs: options?.fs,
        path: options?.path,
        CONSTANTS: options?.CONSTANTS,
        logWithContext,
        loadConf: options?.loadConf,
    });

    for (const [channel, handler] of Object.entries(handlers)) {
        registerIpcHandle(channel, async (...args) => {
            try {
                return await handler(...args);
            } catch (error) {
                logWithContext?.('error', `Error in ${channel}:`, {
                    error: /** @type {Error} */ (error)?.message,
                });
                throw error;
            }
        });
    }
}

module.exports = { registerInfoHandlers, wireInfoHandlers, createInfoHandlers };
