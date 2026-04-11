document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const fetchInfoBtn = document.getElementById('fetch-info-btn');
    const downloadBtn = document.getElementById('download-btn');
    const formatSelect = document.getElementById('format-select');
    const videoPreview = document.getElementById('video-preview');
    const thumbnail = document.getElementById('thumbnail');
    const videoTitle = document.getElementById('video-title');
    const loader = document.getElementById('loader');
    const statusText = document.getElementById('status-text');
    const errorMessage = document.getElementById('error-message');

    let currentVideoUrl = '';

    // Fetch video info
    fetchInfoBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            showError('Please paste a YouTube URL');
            return;
        }

        hideError();
        showLoader('Fetching video info...');
        videoPreview.classList.add('hidden');

        try {
            const response = await fetch('/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                currentVideoUrl = url;
                thumbnail.src = data.thumbnail;
                videoTitle.textContent = data.title;
                videoPreview.classList.remove('hidden');
            } else {
                showError(data.error || 'Failed to fetch video info');
            }
        } catch (error) {
            showError('Network error. Please try again.');
        } finally {
            hideLoader();
        }
    });

    // Handle download
    downloadBtn.addEventListener('click', async () => {
        const format = formatSelect.value;

        hideError();
        showLoader(`Processing your ${format.toUpperCase()}... this may take a moment.`);
        downloadBtn.disabled = true;

        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentVideoUrl, format })
            });

            if (response.ok) {
                // Get the blob from the response
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                // Create a temporary link to trigger download
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                // Try to extract filename from header
                const contentDisposition = response.headers.get('Content-Disposition');
                let fileName = `audio.${format}`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename="(.+)"/);
                    if (match) fileName = match[1];
                }

                a.download = fileName;
                document.body.appendChild(a);
                a.click();

                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                showError(errorData.error || 'Download failed');
            }
        } catch (error) {
            showError('Network error during download.');
        } finally {
            hideLoader();
            downloadBtn.disabled = false;
        }
    });

    function showLoader(text) {
        statusText.textContent = text;
        loader.classList.remove('hidden');
    }

    function hideLoader() {
        loader.classList.add('hidden');
    }

    function showError(text) {
        errorMessage.textContent = text;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
    }
});
