"use strict";
{
    function createPreloadLogger(consoleRef = console) {
        return (level, message, ...details) => {
            if (!isPreloadObjectRecord(consoleRef)) {
                return;
            }
            const methodName = level === "info" ? "log" : level;
            const method = Reflect.get(consoleRef, methodName);
            if (typeof method !== "function") {
                return;
            }
            method.call(consoleRef, message, ...details);
        };
    }
    function isPreloadObjectRecord(value) {
        return typeof value === "object" && value !== null;
    }
    module.exports = {
        createPreloadLogger,
    };
}
