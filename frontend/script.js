document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const formatSelect = document.getElementById('format-select');
    const downloadBtn = document.getElementById('download-btn');
    const statusContainer = document.getElementById('status-container');
    const statusMessage = document.getElementById('status-message');
    const loader = document.getElementById('loader');

    // PLACEHOLDER: Replace with your actual backend URL from Railway
    // For local development, it can be http://localhost:3000
    const BACKEND_URL = '';

    downloadBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        const format = formatSelect.value;

        if (!url) {
            showStatus('Please enter a YouTube URL', 'error');
            return;
        }

        // Reset UI
        showStatus('Converting... this may take a minute.', 'loading');
        downloadBtn.disabled = true;

        try {
            const response = await fetch(`${BACKEND_URL}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, format }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Conversion failed');
            }

            // Handle file download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            // Create a temporary link
            const a = document.createElement('a');
            a.href = downloadUrl;

            // Try to get filename from content-disposition header
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

            // Cleanup
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            showStatus('Download started successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showStatus(error.message || 'An error occurred during download', 'error');
        } finally {
            downloadBtn.disabled = false;
        }
    });

    /**
     * Updates the status UI
     * @param {string} message - Message to display
     * @param {string} type - 'loading', 'success', or 'error'
     */
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusContainer.classList.remove('hidden', 'error', 'success');
        loader.classList.add('hidden');

        if (type === 'loading') {
            loader.classList.remove('hidden');
        } else if (type === 'error') {
            statusContainer.classList.add('error');
        } else if (type === 'success') {
            statusContainer.classList.add('success');
        }
    }
});
