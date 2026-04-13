document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const formatSelect = document.getElementById('format-select');
    const downloadBtn = document.getElementById('download-btn');
    const statusContainer = document.getElementById('status-container');
    const statusMessage = document.getElementById('status-message');
    const errorBox = document.getElementById('error-box');
    const errorText = document.getElementById('error-text');
    const successBox = document.getElementById('success-box');

    // Preview elements
    const previewContainer = document.getElementById('preview-container');
    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoTitle = document.getElementById('video-title');

    // BACKEND_URL should be empty for relative calls if served from same origin
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
     * @param {string} state - 'idle', 'loading', 'success', 'error', 'fetching-info'
     * @param {string} [message] - Optional message
     */
    function updateUIState(state, message = '') {
        // Reset all
        statusContainer.classList.add('hidden');
        errorBox.classList.add('hidden');
        successBox.classList.add('hidden');
        downloadBtn.disabled = false;

        switch (state) {
            case 'fetching-info':
                statusContainer.classList.remove('hidden');
                statusMessage.textContent = 'Buscando informações do vídeo...';
                downloadBtn.disabled = true;
                break;
            case 'loading':
                statusContainer.classList.remove('hidden');
                statusMessage.textContent = 'Convertendo e preparando download...';
                downloadBtn.disabled = true;
                break;
            case 'success':
                successBox.classList.remove('hidden');
                break;
            case 'error':
                errorBox.classList.remove('hidden');
                errorText.textContent = message || 'Ocorreu um erro. Tente novamente.';
                break;
            case 'idle':
            default:
                break;
        }
    }

    /**
     * Fetches video info and updates preview
     */
    async function fetchVideoInfo() {
        const url = urlInput.value.trim();
        if (!isValidYouTubeUrl(url)) {
            previewContainer.classList.add('hidden');
            return;
        }

        updateUIState('fetching-info');

        try {
            const response = await fetch(`${BACKEND_URL}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Não foi possível carregar as informações do vídeo.');
            }

            const data = await response.json();
            videoThumbnail.src = data.thumbnail;
            videoTitle.textContent = data.title;
            previewContainer.classList.remove('hidden');
            updateUIState('idle');
        } catch (error) {
            console.error("Erro ao buscar info:", error);
            // We don't necessarily want to block the download if info fails,
            // but we should inform the user if it's a critical failure.
            updateUIState('error', error.message);
            previewContainer.classList.add('hidden');
        }
    }

    // Debounce URL input for info fetching
    let timeout = null;
    urlInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fetchVideoInfo();
        }, 800);
    });

    downloadBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        const format = formatSelect.value;

        // Validate Input
        if (!url) {
            updateUIState('error', 'Por favor, insira um link do YouTube.');
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            updateUIState('error', 'Por favor, insira um link válido do YouTube.');
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

            if (!response.ok) {
                let errorMsg = 'Falha na conversão.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    // response might not be JSON
                }
                throw new Error(errorMsg);
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
        } catch (error) {
            console.error("Erro no download:", error);
            updateUIState('error', error.message || 'Ocorreu um erro durante o download.');
        }
    });
});
