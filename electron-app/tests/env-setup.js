// This file runs before the jsdom environment initializes
// Suppress jsdom's --localstorage-file warning
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...args) {
    if (typeof warning === 'string' && warning.includes('--localstorage-file')) {
        return;
    }
    // eslint-disable-next-line prefer-spread
    return originalEmitWarning.apply(process, [warning, ...args]);
};
