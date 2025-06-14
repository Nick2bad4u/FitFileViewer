// Utility for handling file open logic
export async function handleOpenFile({ isOpeningFileRef, openFileBtn, setLoading, showNotification }) {
    if (isOpeningFileRef.value) return;
    isOpeningFileRef.value = true;
    try {
        if (!window.electronAPI || !window.electronAPI.openFile || !window.electronAPI.readFile || !window.electronAPI.parseFitFile) {
            showNotification("Electron API not available. Please restart the app.", "error", 7000);
            openFileBtn.disabled = false;
            setLoading(false);
            isOpeningFileRef.value = false;
            return;
        }

        openFileBtn.disabled = true;
        setLoading(true);
        let filePath;
        try {
            filePath = await window.electronAPI.openFile();
        } catch (err) {
            showNotification(`Unable to open the file dialog. Please try again. Error details: ${err}`, "error");
            openFileBtn.disabled = false;
            setLoading(false);
            isOpeningFileRef.value = false;
            return;
        }
        if (filePath) {
            let arrayBuffer;
            try {
                arrayBuffer = await window.electronAPI.readFile(filePath);
            } catch (err) {
                showNotification(`Error reading file: ${err}`, "error");
                openFileBtn.disabled = false;
                setLoading(false);
                return;
            }
            let result;
            try {
                result = await window.electronAPI.parseFitFile(arrayBuffer);
            } catch (err) {
                showNotification(`Error parsing FIT file: ${err}`, "error");
                openFileBtn.disabled = false;
                setLoading(false);
                return;
            }
            if (result && result.error) {
                showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
            } else {
                if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
                    console.log("[DEBUG] FIT parse result:", result);
                }
                try {
                    window.showFitData(result, filePath);
                    if (window.sendFitFileToAltFitReader) {
                        window.sendFitFileToAltFitReader(arrayBuffer);
                    }
                } catch (err) {
                    showNotification(`Error displaying FIT data: ${err}`, "error");
                }
            }
        }
        openFileBtn.disabled = false;
        setLoading(false);
    } finally {
        isOpeningFileRef.value = false;
    }
}
