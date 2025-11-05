// js/main.js: The main entry point for the application.

import { dom } from './dom.js';
import { state, initializeFlatAudioList } from './state.js';
import { renderLibrary, cycleTheme, showBlackScreenMode, hideBlackScreenMode, toggleLockScreen, formatTime, updatePlayPauseButtons, filterLibrary, updateTrackCacheStatus } from './ui.js';
import { togglePlayPause, playNext, playPrev, restartAudio, seek, pauseAudio, setVolume } from './player.js';
import { saveState, loadState } from './persistence.js';

let vConsole;
let isVConsoleVisible = false;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    vConsole = new VConsole();
    vConsole.hideSwitch();

    initializeFlatAudioList();
    renderLibrary().then(() => {
        checkInitialCacheStatus();
    });
    
    loadState();
    updatePlayPauseButtons();
    setupEventListeners();
    registerServiceWorker();
});

// --- Check cache on startup ---
async function checkInitialCacheStatus() {
    if (!('caches' in window)) return;
    const cache = await caches.open('softieaxin-audio-v1');
    for (let i = 0; i < state.flatAudioList.length; i++) {
        const track = state.flatAudioList[i];
        const response = await cache.match(track.url);
        if (response) {
            updateTrackCacheStatus(i, 'cached');
        }
    }
}

function toggleSidebar() {
    dom.sidebar.classList.toggle('open');
    dom.overlay.classList.toggle('open');
}

function setupEventListeners() {
    // Sidebar Controls
    dom.menuToggleBtn.addEventListener('click', toggleSidebar);
    dom.overlay.addEventListener('click', toggleSidebar);
    dom.toggleConsoleBtn.addEventListener('click', () => {
        if (isVConsoleVisible) {
            vConsole.hideSwitch();
        } else {
            vConsole.showSwitch();
        }
        isVConsoleVisible = !isVConsoleVisible;
        toggleSidebar();
    });

    // Player Controls
    dom.playPauseBtn.addEventListener('click', togglePlayPause);
    dom.nextBtn.addEventListener('click', playNext);
    dom.prevBtn.addEventListener('click', playPrev);
    dom.restartBtn.addEventListener('click', restartAudio);
    dom.volumeBar.addEventListener('input', (e) => setVolume(e.target.value));
    dom.searchInput.addEventListener('input', filterLibrary);

    // Progress Bars
    dom.progressBar.addEventListener('input', () => seek(dom.progressBar));
    dom.bsProgressBar.addEventListener('input', () => seek(dom.bsProgressBar));

    // Audio Player Events
    dom.audioPlayer.addEventListener('timeupdate', handleTimeUpdate);
    dom.audioPlayer.addEventListener('loadedmetadata', handleMetadataLoaded);
    dom.audioPlayer.addEventListener('ended', playNext);

    // App Controls (from sidebar)
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
    dom.bsTotalTime.textContent = formatTime(duration);
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
}

// --- SERVICE WORKER REGISTRATION ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('Service Worker registered.', reg);
                // Setup the global message listener for SW communication
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data.type === 'AUDIO_CACHING_PROGRESS') {
                        const { url, status } = event.data;
                        const trackIndex = state.flatAudioList.findIndex(track => track.url === url);
                        if (trackIndex > -1) {
                            updateTrackCacheStatus(trackIndex, status);
                        }
                    } else if (event.data.type === 'AUDIO_CACHING_COMPLETE') {
                        alert('Caching process complete!');
                        dom.cacheAllBtn.innerHTML = '<i class="fas fa-database"></i> Cache All';
                        dom.cacheAllBtn.disabled = false;
                    }
                });
            })
            .catch(err => console.error('Service Worker registration failed.', err));
    }
}