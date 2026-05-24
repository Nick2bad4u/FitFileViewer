"use strict";
{
    function createPreloadValidators(preloadLog) {
        function validateCallback(callback, methodName) {
            if (typeof callback !== "function") {
                preloadLog(
                    "error",
                    `[preload.js] ${methodName}: callback must be a function`
                );
                return false;
            }
            return true;
        }
        function validateChannelName(value, paramName, methodName) {
            if (typeof value !== "string") {
                preloadLog(
                    "error",
                    `[preload.js] ${methodName}: ${paramName} must be a string`
                );
                return false;
            }
            if (value.trim().length === 0) {
                preloadLog(
                    "error",
                    `[preload.js] ${methodName}: ${paramName} must be a non-empty string`
                );
                return false;
            }
            return true;
        }
        function validateOptionalNonEmptyString(value, paramName, methodName) {
            if (value === undefined || value === null) {
                return true;
            }
            if (typeof value !== "string") {
                preloadLog(
                    "error",
                    `[preload.js] ${methodName}: ${paramName} must be a string or null`
                );
                return false;
            }
            if (value.trim().length === 0) {
                preloadLog(
                    "error",
                    `[preload.js] ${methodName}: ${paramName} must be a non-empty string or null`
                );
                return false;
            }
            return true;
        }
        function validateRequiredNonEmptyString(value, paramName, methodName) {
            if (typeof value !== "string") {
                preloadLog(
                    "error",
                    `[preload.js] ${methodName}: ${paramName} must be a string`
                );
                return false;
            }
            if (value.trim().length === 0) {
                preloadLog(
                    "error",
                    `[preload.js] ${methodName}: ${paramName} must be a non-empty string`
                );
                return false;
            }
            return true;
        }
        return {
            validateCallback,
            validateChannelName,
            validateOptionalNonEmptyString,
            validateRequiredNonEmptyString,
        };
    }
    module.exports = {
        createPreloadValidators,
    };
}
