{
    type StateUpdateOptions = Record<string, unknown>;

    interface FitParserSettingsConf {
        get: (key: string) => unknown;
        set: (key: string, value: unknown) => void;
    }

    type FitParserSettingsConfConstructor = new (options?: {
        name?: string;
    }) => FitParserSettingsConf;

    interface MainProcessStateLike {
        cleanupEventHandlers: () => void;
        data: Record<string, unknown>;
        get: (statePath: string) => unknown;
        set: (
            statePath: string,
            value: unknown,
            options?: StateUpdateOptions
        ) => void;
    }

    const { mainProcessState } =
        require("../../utils/state/integration/mainProcessStateManager") as {
            mainProcessState: MainProcessStateLike;
        };
    const { CONSTANTS } = require("../constants") as {
        CONSTANTS: { SETTINGS_CONFIG_NAME: string };
    };

    let fitParserSettingsConf: FitParserSettingsConf | null | undefined;

    /**
     * Clears all event handlers registered within the main process state (used
     * by dev helpers/tests).
     */
    function cleanupEventHandlers(): void {
        mainProcessState.cleanupEventHandlers();
    }

    /**
     * Returns the current value for a state key from the main process state
     * manager.
     *
     * @param statePath - Dot-notation state path, for example
     *   "fitFile.lastResult".
     *
     * @returns Stored state value.
     */
    function getAppState(statePath: string): unknown {
        return mainProcessState.get(statePath);
    }

    /**
     * Lazily resolves the configuration store used for fit parser decoder
     * settings. The factory mirrors the previous implementation to keep test
     * hooks unchanged.
     *
     * @returns Electron-conf instance or null when unavailable.
     */
    function resolveFitParserSettingsConf(): FitParserSettingsConf | null {
        if (fitParserSettingsConf !== undefined) {
            return fitParserSettingsConf;
        }

        try {
            const { Conf } = require("electron-conf") as {
                Conf: FitParserSettingsConfConstructor;
            };
            fitParserSettingsConf = new Conf({
                name: CONSTANTS.SETTINGS_CONFIG_NAME,
            });
        } catch {
            fitParserSettingsConf = null;
        }

        return fitParserSettingsConf;
    }

    /**
     * Persists a value into main process state.
     *
     * @param statePath - Dot-notation path to update.
     * @param value - Value to persist.
     * @param options - Additional metadata forwarded to the state manager.
     */
    function setAppState(
        statePath: string,
        value: unknown,
        options: StateUpdateOptions = {}
    ): void {
        mainProcessState.set(statePath, value, options);
    }

    module.exports = {
        cleanupEventHandlers,
        getAppState,
        mainProcessState,
        resolveFitParserSettingsConf,
        setAppState,
    };
}
