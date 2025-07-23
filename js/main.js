// js/main.js: The main entry point for the application.

import { dom } from './dom.js';
import { state, initializeFlatAudioList } from './state.js';
import { renderLibrary, cycleTheme, showBlackScreenMode, hideBlackScreenMode, toggleLockScreen, formatTime, updatePlayPauseButtons } from './ui.js';
import { togglePlayPause, playNext, playPrev, restartAudio, seek, pauseAudio } from './player.js';
import { saveState, loadState } from './persistence.js';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initializeFlatAudioList();
    renderLibrary();
    loadState();
    updatePlayPauseButtons();
    setupEventListeners();
    registerServiceWorker();
});

// --- EVENT LISTENERS SETUP ---
function setupEventListeners() {
    // Player Controls
    dom.playPauseBtn.addEventListener('click', togglePlayPause);
    dom.nextBtn.addEventListener('click', playNext);
    dom.prevBtn.addEventListener('click', playPrev);
    dom.restartBtn.addEventListener('click', restartAudio);
    dom.volumeBar.addEventListener('input', (e) => (dom.audioPlayer.volume = e.target.value));

    // Progress Bars
    dom.progressBar.addEventListener('input', () => seek(dom.progressBar));
    dom.bsProgressBar.addEventListener('input', () => seek(dom.bsProgressBar));

    // Audio Player Events
    dom.audioPlayer.addEventListener('timeupdate', handleTimeUpdate);
    dom.audioPlayer.addEventListener('loadedmetadata', handleMetadataLoaded);
    dom.audioPlayer.addEventListener('ended', playNext);

    // App Controls
    dom.themeSwitcherBtn.addEventListener('click', cycleTheme);
    dom.backgroundPlayToggle.addEventListener('change', handleBackgroundToggle);
    dom.cacheAllBtn.addEventListener('click', handleCacheAll);

    // Focus Mode
    dom.bsPlayPauseBtn.addEventListener('click', togglePlayPause);
    dom.bsRestartBtn.addEventListener('click', restartAudio);
    dom.bsLockBtn.addEventListener('click', toggleLockScreen);
    dom.focusModeToggleBtn.addEventListener('click', () => {
        if (!state.isBlackScreenLocked) hideBlackScreenMode();
    });
    dom.nowPlayingBar.addEventListener('dblclick', (e) => {
        if (!e.target.closest('button, input[type="range"]')) showBlackScreenMode();
    });
    dom.blackScreenMode.addEventListener('click', handleBlackScreenClick);
    
    // Background Play toggle
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !state.backgroundPlayEnabled && state.isPlaying) {
            pauseAudio();
        }
    });
}

// --- EVENT HANDLER FUNCTIONS ---
function handleTimeUpdate() {
    const currentTime = dom.audioPlayer.currentTime;
    dom.progressBar.value = currentTime;
    dom.bsProgressBar.value = currentTime;
    dom.currentTimeDisplay.textContent = formatTime(currentTime);
    dom.bsCurrentTime.textContent = formatTime(currentTime);
    saveState();
}

function handleMetadataLoaded() {
    const duration = dom.audioPlayer.duration;
    dom.progressBar.max = duration;
    dom.bsProgressBar.max = duration;
    dom.totalTimeDisplay.textContent = formatTime(duration);
    bsTotalTime.textContent = formatTime(duration);
}

function handleBackgroundToggle(e) {
    state.backgroundPlayEnabled = e.target.checked;
    localStorage.setItem('softieAxinBgPlay', state.backgroundPlayEnabled);
}

function handleBlackScreenClick(e) {
    if (e.target.closest('.bs-content') || e.target.closest('.focus-mode-toggle')) return;
    if (state.isBlackScreenLocked) return;
    
    state.tapCount++;
    if (state.tapTimeout) clearTimeout(state.tapTimeout);

    if (state.tapCount >= 4) {
        hideBlackScreenMode();
        state.tapCount = 0;
    } else {
        state.tapTimeout = setTimeout(() => { state.tapCount = 0; }, 500);
    }
}

async function handleCacheAll() {
    if (!('caches' in window) || !navigator.serviceWorker.controller) {
        alert('Caching API not available or service worker not active.');
        return;
    }
    dom.cacheAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caching...';
    dom.cacheAllBtn.disabled = true;

    const audioUrlsToCache = state.flatAudioList.map(track => track.url);
    navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_AUDIO_FILES',
        urls: audioUrlsToCache
    });

    navigator.serviceWorker.addEventListener('message', function onCacheMessage(event) {
        if (event.data.type === 'AUDIO_CACHING_COMPLETE') {
            alert(`Caching complete! Success: ${event.data.successCount}, Failed: ${event.data.failCount}.`);
            dom.cacheAllBtn.innerHTML = '<i class="fas fa-database"></i> Cache All';
            dom.cacheAllBtn.disabled = false;
            navigator.serviceWorker.removeEventListener('message', onCacheMessage);
        }
    });
}

// --- SERVICE WORKER REGISTRATION ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered.', reg))
            .catch(err => console.error('Service Worker registration failed.', err));
    }
}