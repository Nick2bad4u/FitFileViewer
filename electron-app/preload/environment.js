"use strict";
{
    function getProcessEnvValue(processRef, name) {
        const env = processRef?.env;
        if (!isPreloadObjectRecord(env)) {
            return undefined;
        }
        const value = Reflect.get(env, name);
        return typeof value === "string" ? value : undefined;
    }
    function getProcessVersionValue(processRef, name) {
        const versions = processRef?.versions;
        if (!isPreloadObjectRecord(versions)) {
            return undefined;
        }
        const value = Reflect.get(versions, name);
        return typeof value === "string" ? value : undefined;
    }
    function isPreloadDevelopmentMode(processRef = process) {
        return getProcessEnvValue(processRef, "NODE_ENV") === "development";
    }
    function isPreloadElectronRuntime(processRef = process) {
        return getProcessVersionValue(processRef, "electron") !== undefined;
    }
    function isPreloadObjectRecord(value) {
        return typeof value === "object" && value !== null;
    }
    function shouldEnforceGenericIpcAllowlist(processRef = process) {
        return (
            isPreloadElectronRuntime(processRef) &&
            getProcessEnvValue(processRef, "FFV_ALLOW_GENERIC_IPC") !== "true"
        );
    }
    module.exports = {
        isPreloadDevelopmentMode,
        isPreloadElectronRuntime,
        shouldEnforceGenericIpcAllowlist,
    };
}
