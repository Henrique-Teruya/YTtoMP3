/**
 * YTMP3 — Frontend Application
 *
 * Vanilla JS application handling URL input, format selection,
 * conversion requests, SSE progress streaming, and download.
 */

(function () {
  'use strict';

  // ─── DOM References ─────────────────────────────────
  const $urlInput      = document.getElementById('url-input');
  const $btnClear      = document.getElementById('btn-clear');
  const $inputHint     = document.getElementById('input-hint');
  const $btnConvert    = document.getElementById('btn-convert');
  const $btnConvertText   = document.querySelector('.btn-convert-text');
  const $btnConvertLoader = document.querySelector('.btn-convert-loader');
  const $previewCard   = document.getElementById('preview-card');
  const $previewThumb  = document.getElementById('preview-thumbnail');
  const $previewTitle  = document.getElementById('preview-title');
  const $previewChannel = document.getElementById('preview-channel');
  const $previewDuration = document.getElementById('preview-duration');
  const $progressCard  = document.getElementById('progress-card');
  const $statusBadge   = document.getElementById('status-badge');
  const $statusText    = document.getElementById('status-text');
  const $progressTicker = document.getElementById('progress-ticker');
  const $progressFill  = document.getElementById('progress-bar-fill');
  const $progressSpeed = document.getElementById('progress-speed');
  const $progressEta   = document.getElementById('progress-eta');
  const $waveform      = document.getElementById('waveform');
  const $downloadCard  = document.getElementById('download-card');
  const $downloadTitle = document.getElementById('download-title');
  const $downloadFilename = document.getElementById('download-filename');
  const $btnDownload   = document.getElementById('btn-download');
  const $btnNew        = document.getElementById('btn-new');
  const $errorCard     = document.getElementById('error-card');
  const $errorMessage  = document.getElementById('error-message');
  const $btnRetry      = document.getElementById('btn-retry');
  const $historySection = document.getElementById('history-section');
  const $historyList   = document.getElementById('history-list');
  const $toastContainer = document.getElementById('toast-container');
  const $formatBtns    = document.querySelectorAll('.format-btn');

  // ─── State ──────────────────────────────────────────
  const state = {
    url: '',
    format: 'mp3',
    jobId: null,
    status: 'idle', // idle | fetching | converting | completed | error
    eventSource: null,
    history: loadHistory(),
  };


  // ─── YouTube URL Validation ─────────────────────────
  const YT_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|playlist\?list=)|youtu\.be\/|music\.youtube\.com\/watch\?v=)/;

  function isValidUrl(url) {
    return YT_REGEX.test(url.trim());
  }

  // ─── Init ───────────────────────────────────────────
  function init() {
    renderHistory();
    initBackgroundVideo();
    bindEvents();
  }

  function initBackgroundVideo() {
    const video = document.getElementById('bg-video');
    if (video) {
      video.play()
        .then(() => console.log('[Video] Playing background motion'))
        .catch((err) => console.error('[Video] Playback failed:', err));
    }
  }

  function bindEvents() {
    $urlInput.addEventListener('input', onUrlInput);
    $urlInput.addEventListener('paste', onUrlPaste);
    $urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $btnConvert.click();
    });
    $btnClear.addEventListener('click', clearInput);
    $btnConvert.addEventListener('click', startConversion);
    $btnDownload.addEventListener('click', downloadFile);
    $btnNew.addEventListener('click', resetUI);
    $btnRetry.addEventListener('click', () => {
      hideSection($errorCard);
      startConversion();
    });
    $formatBtns.forEach((btn) => {
      btn.addEventListener('click', () => selectFormat(btn.dataset.format));
    });
  }


  // ─── URL Input Handling ─────────────────────────────
  function onUrlInput() {
    const val = $urlInput.value.trim();
    state.url = val;
    $btnClear.style.display = val ? 'block' : 'none';
    $btnConvert.disabled = !isValidUrl(val);

    if (val && !isValidUrl(val)) {
      setHint('URL inválida. Cole um link do YouTube.', 'error');
    } else {
      setHint('');
    }
  }

  function onUrlPaste() {
    setTimeout(() => {
      onUrlInput();
      if (isValidUrl($urlInput.value.trim())) {
        setHint('URL detectada ✓', 'success');
        fetchVideoInfo($urlInput.value.trim());
      }
    }, 50);
  }

  function clearInput() {
    $urlInput.value = '';
    state.url = '';
    $btnClear.style.display = 'none';
    $btnConvert.disabled = true;
    setHint('');
    hideSection($previewCard);
  }

  function setHint(text, type) {
    $inputHint.textContent = text;
    $inputHint.className = 'input-hint' + (type ? ` ${type}` : '');
  }

  // ─── Format Selection ──────────────────────────────
  function selectFormat(format) {
    state.format = format;
    $formatBtns.forEach((btn) => {
      const active = btn.dataset.format === format;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-checked', active);
    });
  }

  // ─── Fetch Video Info ──────────────────────────────
  async function fetchVideoInfo(url) {
    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (data.status === 'ok' && data.data) {
        showPreview(data.data);
      }
    } catch {
      // Silently fail — preview is optional
    }
  }

  function showPreview(info) {
    if (info.thumbnail) {
      $previewThumb.src = info.thumbnail;
      $previewThumb.alt = info.title || 'Thumbnail';
    }
    $previewTitle.textContent = info.title || 'Sem título';
    $previewChannel.textContent = info.channel || '';
    $previewDuration.textContent = info.duration ? formatDuration(info.duration) : '';
    showSection($previewCard);
  }

  // ─── Conversion Flow ───────────────────────────────
  async function startConversion() {
    const url = $urlInput.value.trim();
    if (!isValidUrl(url)) return;

    // UI: loading state
    setConverting(true);
    hideSection($downloadCard);
    hideSection($errorCard);
    showSection($progressCard);
    updateProgress(0, 'queued');
    $waveform.classList.add('active');

    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format: state.format }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao iniciar conversão');
      }

      state.jobId = data.jobId;
      $btnConvertLoader.querySelector('span:last-child').textContent = 'Processando...';
      subscribeToProgress(data.jobId);
    } catch (err) {
      showError(err.message);
      setConverting(false);
    }
  }

  function setConverting(loading) {
    state.status = loading ? 'converting' : 'idle';
    $btnConvert.disabled = loading;
    $btnConvert.classList.toggle('loading', loading);
    $btnConvertText.style.display = loading ? 'none' : '';
    $btnConvertLoader.style.display = loading ? 'flex' : 'none';
  }

  // ─── SSE Progress ──────────────────────────────────
  function subscribeToProgress(jobId) {
    if (state.eventSource) {
      state.eventSource.close();
    }

    const es = new EventSource(`/api/convert/${jobId}/status`);
    state.eventSource = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleProgressUpdate(data);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      state.eventSource = null;
      // Only show error if not already completed
      if (state.status === 'converting') {
        showError('Conexão perdida. Tente novamente.');
        setConverting(false);
      }
    };
  }

  function handleProgressUpdate(data) {
    console.log('[SSE] Progress Update:', data);

    // Update preview info if available (fallback if fetchVideoInfo failed)
    if (data.title && data.thumbnail && $previewCard.classList.contains('hidden')) {
      showPreview(data);
    }

    const progress = data.progress || 0;
    const status = data.status || 'queued';

    updateProgress(progress, status);

    if (data.speed) {
      $progressSpeed.textContent = data.speed;
      $progressSpeed.style.display = 'inline';
    } else {
      $progressSpeed.style.display = 'none';
    }

    if (data.eta) {
      $progressEta.textContent = `ETA ${data.eta}`;
      $progressEta.style.display = 'inline';
    } else {
      $progressEta.style.display = 'none';
    }

    if (status === 'completed') {
      console.log('[SSE] Job completed, triggering download...');
      onCompleted(data);
    } else if (status === 'error') {
      console.error('[SSE] Job failed:', data.error);
      showError(data.error || 'Erro desconhecido');
      setConverting(false);
    }
  }

  function updateProgress(percent, status) {
    const p = Math.round(percent);
    $progressFill.style.width = `${p}%`;
    updateTicker(p);

    const statusLabels = {
      queued: 'Na fila',
      downloading: 'Baixando',
      converting: 'Convertendo',
      completed: 'Finalizado',
      error: 'Erro',
      cancelled: 'Cancelado',
    };

    $statusText.textContent = statusLabels[status] || status;
    $statusBadge.className = `status-badge ${status || ''}`;
  }

  function updateTicker(value) {
    const str = value.toString().padStart(3, ' ');
    const columns = $progressTicker.querySelectorAll('.ticker-column');
    
    str.split('').forEach((char, i) => {
      const digit = char === ' ' ? -1 : parseInt(char, 10);
      const column = columns[i];
      if (digit === -1) {
        column.style.transform = 'translateY(1.5rem)'; // Hide
        column.style.opacity = '0';
      } else {
        column.style.transform = `translateY(-${digit * 1.5}rem)`;
        column.style.opacity = '1';
      }
    });
  }

  // ─── Completed ─────────────────────────────────────
  function onCompleted(data) {
    if (state.eventSource) {
      state.eventSource.close();
      state.eventSource = null;
    }

    state.status = 'completed';
    $waveform.classList.remove('active');
    setConverting(false);
    hideSection($progressCard);

    $downloadTitle.textContent = 'Pronto!';
    $downloadFilename.textContent = data.filename || data.title || 'audio';
    showSection($downloadCard);

    // Save to history
    addToHistory({
      id: data.id,
      title: data.title || data.filename || 'Audio',
      thumbnail: data.thumbnail || null,
      format: state.format,
      completedAt: Date.now(),
    });

    showToast('Conversão finalizada!', 'success');

    // AUTO DOWNLOAD: Trigger the file download in the browser
    setTimeout(() => {
      downloadFile();
    }, 500);
  }

  // ─── Download ──────────────────────────────────────
  function downloadFile() {
    if (!state.jobId) return;
    const a = document.createElement('a');
    a.href = `/api/convert/${state.jobId}/download`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ─── Error ─────────────────────────────────────────
  function showError(message) {
    if (state.eventSource) {
      state.eventSource.close();
      state.eventSource = null;
    }

    state.status = 'error';
    $waveform.classList.remove('active');
    hideSection($progressCard);
    $errorMessage.textContent = message;
    showSection($errorCard);
    showToast(message, 'error');
  }

  // ─── Reset ─────────────────────────────────────────
  function resetUI() {
    state.jobId = null;
    state.status = 'idle';
    hideSection($previewCard);
    hideSection($progressCard);
    hideSection($downloadCard);
    hideSection($errorCard);
    $progressFill.style.width = '0%';
    updateTicker(0);
    $progressSpeed.textContent = '';
    $progressEta.textContent = '';
    $waveform.classList.remove('active');
    $urlInput.value = '';
    $urlInput.focus();
    $btnClear.style.display = 'none';
    $btnConvert.disabled = true;
    setHint('');
    setConverting(false);
  }

  // ─── History ───────────────────────────────────────
  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem('ytmp3pro_history') || '[]');
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem('ytmp3pro_history', JSON.stringify(state.history.slice(0, 20)));
    } catch {
      // ignore
    }
  }

  function addToHistory(item) {
    state.history.unshift(item);
    if (state.history.length > 20) state.history.pop();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (state.history.length === 0) {
      hideSection($historySection);
      return;
    }

    showSection($historySection);
    $historyList.innerHTML = state.history.map((item) => `
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-item-title">${escapeHtml(item.title)}</div>
          <div class="history-item-meta">${timeAgo(item.completedAt)}</div>
        </div>
        <span class="history-item-format">${escapeHtml(item.format)}</span>
      </div>
    `).join('');
  }

  // ─── UI Helpers ────────────────────────────────────
  function showSection(el) { el.classList.remove('hidden'); }
  function hideSection(el) { el.classList.add('hidden'); }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type || ''}`;
    toast.textContent = message;
    $toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ─── Utilities ─────────────────────────────────────
  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    const days = Math.floor(hrs / 24);
    return `${days}d atrás`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Start ─────────────────────────────────────────
  init();
})();
