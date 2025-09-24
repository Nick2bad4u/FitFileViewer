/**
 * @fileoverview Barrel Export for files/recent
 * @description Re-exports all modules in the files/recent category
 */

// Import the CommonJS module and re-export as named exports
import recentFilesModule from "./recentFiles.js";

export const { addRecentFile, getShortRecentName, loadRecentFiles, saveRecentFiles } = recentFilesModule;
