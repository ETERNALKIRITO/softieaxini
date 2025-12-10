// js/main.js

import { dom } from './dom.js';
import { state, loadLibraryData, initializeFlatAudioList } from './state.js'; // Added loadLibraryData
import { renderLibrary, cycleTheme, showBlackScreenMode, hideBlackScreenMode, toggleLockScreen, formatTime, updatePlayPauseButtons, filterLibrary, updateTrackCacheStatus, applyZoomState, shuffleArray } from './ui.js';
import { togglePlayPause, playNext, playPrev, restartAudio, seek, pauseAudio, setVolume, loadTrack } from './player.js'; 
import { saveState, loadState } from './persistence.js';

let vConsole;
let isVConsoleVisible = false;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- SAFETY CHECK FOR VCONSOLE ---
    // This prevents the app from crashing if the script fails to load offline
    if (typeof VConsole !== 'undefined') {
        vConsole = new VConsole();
        vConsole.hideSwitch();
    } else {
        console.warn('VConsole script not loaded. Debug console unavailable.');
    }

    // Load the JSON Library
    await loadLibraryData();

    // Render Library
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
  // Update the Toggle Console Listener
    dom.toggleConsoleBtn.addEventListener('click', () => {
        // Safety check
        if (typeof vConsole === 'undefined') {
            alert("Debug Console is not available (script failed to load).");
            return;
        }

        if (isVConsoleVisible) {
            vConsole.hideSwitch();
        } else {
            vConsole.showSwitch();
        }
        isVConsoleVisible = !isVConsoleVisible;
        toggleSidebar();
    });

    if (dom.factoryResetBtn) {
        dom.factoryResetBtn.addEventListener('click', async () => {
            if (confirm("This will wipe all data, settings, and cached songs. The app will reset completely. Continue?")) {
                // 1. Clear LocalStorage
                localStorage.clear();

                // 2. Clear Service Worker Caches
                if ('caches' in window) {
                    const keys = await caches.keys();
                    for (const key of keys) {
                        await caches.delete(key);
                    }
                }

                // 3. Unregister Service Worker
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }

                // 4. Force Reload
                window.location.reload(true);
            }
        });
    }


    // Fullscreen Listener
    dom.fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Zoom Toggle Listener
    dom.zoomToggle.addEventListener('change', (e) => {
        state.isZoomAllowed = e.target.checked;
        applyZoomState();
        saveState(); 
    });

    dom.reloadAppBtn.addEventListener('click', () => {
        // Optional: Change text to show something is happening
        dom.reloadAppBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reloading...';
        
        // Reload the page
        window.location.reload();
    });

    // --- SHUFFLE DROPDOWN LOGIC ---
    // Toggle the dropdown menu
    dom.shuffleDropdownBtn.addEventListener('click', () => {
        dom.shuffleDropdownContainer.classList.toggle('active');
    });

    // The Logic Function
    const handleShuffle = (filterType) => {
        // 1. Reset list to original state first to get all tracks
        initializeFlatAudioList(); 
        let listToShuffle = [...state.flatAudioList];

        // 2. Filter based on button clicked
        if (filterType === 'songs') {
            listToShuffle = listToShuffle.filter(t => t.category === 'Songs');
        } else if (filterType === 'audios') {
            listToShuffle = listToShuffle.filter(t => t.category === 'Audios');
        }
        // 'all' passes through without filtering

        // 3. Shuffle the result
        const shuffledList = shuffleArray(listToShuffle);

        // 4. Update Global State
        state.flatAudioList = shuffledList; 
        state.currentTrackIndex = 0; 

        // 5. Update UI Title
        let title = filterType === 'songs' ? "Shuffled Songs" : 
                    filterType === 'audios' ? "Shuffled Audios" : "All Tracks (Randomized)";
        
        // 6. Render the shuffled list
        renderLibrary(shuffledList, title);
        
        // 7. Start Playing the first track of the new list
        loadTrack(0);
        
        // 8. Cleanup
        dom.shuffleDropdownContainer.classList.remove('active');
        toggleSidebar();
    };

    // Attach listeners to the specific shuffle buttons
    dom.shuffleSongsBtn.addEventListener('click', () => handleShuffle('songs'));
    dom.shuffleAudiosBtn.addEventListener('click', () => handleShuffle('audios'));
    dom.shuffleAllBtn.addEventListener('click', () => handleShuffle('all'));

    // Reset Button Logic
    dom.resetLibraryBtn.addEventListener('click', () => {
        initializeFlatAudioList(); // Reset state to default config order
        renderLibrary(); // Render default categorized view
        dom.shuffleDropdownContainer.classList.remove('active');
        toggleSidebar();
    });


    // --- STANDARD PLAYER CONTROLS ---
    dom.playPauseBtn.addEventListener('click', togglePlayPause);
    dom.nextBtn.addEventListener('click', playNext);
    dom.prevBtn.addEventListener('click', playPrev);
    dom.restartBtn.addEventListener('click', restartAudio);
    dom.volumeBar.addEventListener('input', (e) => setVolume(e.target.value));
    dom.searchInput.addEventListener('input', filterLibrary);

    // Progress Bars
    dom.progressBar.addEventListener('input', () => seek(dom.progressBar));
    dom.bsProgressBar.addEventListener('input', () => seek(dom.bsProgressBar));

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
    
    // Background Play toggle listener
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !state.backgroundPlayEnabled && state.isPlaying) {
            pauseAudio();
        }
    });

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
}

// --- FULLSCREEN LOGIC ---
function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); // Safari
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); // Safari
    }
}

function updateFullscreenButton() {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (isFullscreen) {
        dom.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
        dom.fullscreenBtn.title = 'Exit Fullscreen';
    } else {
        dom.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Toggle Fullscreen';
        dom.fullscreenBtn.title = 'Toggle Fullscreen';
    }
}

// --- EVENT HANDLER FUNCTIONS ---

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

    // Use state.flatAudioList but ensure we get the source URLs from config if needed,
    // though state.flatAudioList should be populated.
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