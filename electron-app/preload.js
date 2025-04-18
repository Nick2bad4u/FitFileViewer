const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const fitParser = require('./fitParser');

contextBridge.exposeInMainWorld('electronAPI', {
	/**
	 * Opens a file dialog and returns the selected file path(s).
	 * @returns {Promise<string[]>}
	 */
	openFile: () => ipcRenderer.invoke('dialog:openFile'),

	/**
	 * Reads a file from the given file path and returns its contents as an ArrayBuffer.
	 * @param {string} filePath
	 * @returns {Promise<ArrayBuffer>}
	 */
	readFile: (filePath) => {
		return new Promise((resolve, reject) => {
			fs.readFile(filePath, (err, data) => {
				if (err) {
					console.error('Error reading file:', err); // Log error for debugging
					reject(err);
				} else {
					resolve(data.buffer);
				}
			});
		});
	},

	/**
	 * Parses a FIT file from an ArrayBuffer and returns the decoded data.
	 * @param {ArrayBuffer} arrayBuffer
	 * @returns {Promise<any>}
	 */
	parseFitFile: async (arrayBuffer) => {
		// Convert ArrayBuffer to Buffer
		const buffer = Buffer.from(arrayBuffer);
		return await fitParser.decodeFitFile(buffer);
	},
});
