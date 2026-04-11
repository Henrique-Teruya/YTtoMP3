document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const formatSelect = document.getElementById('format-select');
    const downloadBtn = document.getElementById('download-btn');
    const statusContainer = document.getElementById('status-container');
    const statusMessage = document.getElementById('status-message');
    const errorBox = document.getElementById('error-box');
    const errorText = document.getElementById('error-text');
    const successBox = document.getElementById('success-box');

    // PLACEHOLDER: Replace with your actual backend URL from Railway
    // For local development, it can be http://localhost:3000
    const BACKEND_URL = '';

    /**
     * Basic YouTube URL validation
     * @param {string} url
     * @returns {boolean}
     */
    function isValidYouTubeUrl(url) {
        if (!url) return false;
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return pattern.test(url);
    }

    /**
     * Updates the UI state
     * @param {string} state - 'idle', 'loading', 'success', 'error'
     * @param {string} [message] - Optional message for error state
     */
    function updateUIState(state, message = '') {
        // Reset all
        statusContainer.classList.add('hidden');
        errorBox.classList.add('hidden');
        successBox.classList.add('hidden');
        downloadBtn.disabled = false;

        switch (state) {
            case 'loading':
                statusContainer.classList.remove('hidden');
                downloadBtn.disabled = true;
                break;
            case 'success':
                successBox.classList.remove('hidden');
                break;
            case 'error':
                errorBox.classList.remove('hidden');
                errorText.textContent = message || 'Something went wrong. Try again.';
                break;
            case 'idle':
            default:
                break;
        }
    }

    downloadBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        const format = formatSelect.value;

        console.log("Sending request:", { url, format });

        // Validate Input
        if (!url) {
            updateUIState('error', 'Please enter a YouTube URL.');
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            updateUIState('error', 'Please enter a valid YouTube link.');
            return;
        }

        // Set Loading State
        updateUIState('loading');

        try {
            const response = await fetch(`${BACKEND_URL}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, format }),
            });

            console.log("Response received");

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Conversion failed');
            }

            // Handle file download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = downloadUrl;

            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = `audio.${format}`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+?)"?$/);
                if (match && match[1]) {
                    fileName = match[1];
                }
            }

            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            updateUIState('success');
            console.log("Download complete");
        } catch (error) {
            console.error("Error:", error);
            updateUIState('error', error.message || 'An error occurred during download.');
        }
    });
});
