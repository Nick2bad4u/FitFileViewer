// In electron-app/renderer.js

// Use window.utils if available, fallback to global
const rendererUtils = window.rendererUtils || {};
const setLoading = rendererUtils.setLoading || function () {};
const themeUtils = window.theme || {};
const applyTheme = themeUtils.applyTheme || function () {};
const listenForThemeChange = themeUtils.listenForThemeChange || function () {};

import { showNotification } from './utils/showNotification.js';
import { handleOpenFile } from './utils/handleOpenFile.js';
import { setupTheme } from './utils/setupTheme.js';
import { showUpdateNotification } from './utils/showUpdateNotification.js';
import { setupListeners } from './utils/listeners.js';
import { showAboutModal } from './utils/aboutModal.js';

// --- Optionally expose createExportGPXButton globally ---
import { createExportGPXButton } from './utils/mapActionButtons.js';
window.createExportGPXButton = createExportGPXButton;

const openFileBtn = document.getElementById('openFileBtn');
if (!openFileBtn) {
	showNotification('Open File button not found!', 'error', 7000);
}

const isOpeningFileRef = { value: false };

setupListeners({
	openFileBtn,
	isOpeningFileRef,
	setLoading,
	showNotification,
	handleOpenFile,
	showUpdateNotification,
	showAboutModal,
	applyTheme,
	listenForThemeChange,
});

// --- Theme wiring ---
setupTheme(applyTheme, listenForThemeChange);
