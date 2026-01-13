// js/main.js
import { dom } from './dom.js';
import { state, loadLibraryData, initializeFlatAudioList } from './state.js'; 
import { renderLibrary, cycleTheme, showBlackScreenMode, hideBlackScreenMode, toggleLockScreen, formatTime, updatePlayPauseButtons, filterLibrary, updateTrackCacheStatus, shuffleArray, blockGesture, blockDoubleTap } from './ui.js'; // Added blockGesture, blockDoubleTap
import { togglePlayPause, playNext, playPrev, restartAudio, seek, pauseAudio, setVolume, loadTrack } from './player.js'; 
import { saveState, loadState } from './persistence.js';
import { AUDIO_CACHE_NAME } from './config.js'; // Import AUDIO_CACHE_NAME

document.addEventListener('DOMContentLoaded', async () => {
    
    // Always apply permanent zoom prevention on load
    applyPermanentZoomPrevention();

    await loadLibraryData();

    renderLibrary().then(() => {
        checkInitialCacheStatus();
    });
    
    loadState();
    updatePlayPauseButtons();
    setupEventListeners();
    registerServiceWorker();
});

// NEW: Function to permanently prevent zoom
function applyPermanentZoomPrevention() {
    // Add brute force listeners directly here for consistent behavior
    document.addEventListener('gesturestart', blockGesture);
    document.addEventListener('touchend', blockDoubleTap, false);
    // Removed desktop specific zoom prevention (wheel, keydown) as requested for simplicity
}

async function checkInitialCacheStatus() {
    if (!('caches' in window)) return;
    const cache = await caches.open(AUDIO_CACHE_NAME); // FIX: Use correct AUDIO_CACHE_NAME
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
    dom.menuToggleBtn.addEventListener('click', toggleSidebar);
    dom.overlay.addEventListener('click', toggleSidebar);

    dom.fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Removed Zoom Toggle event listener as zoom is always prevented now

    // Removed Hard Reset button and its event listener

    dom.reloadAppBtn.addEventListener('click', () => {
        dom.reloadAppBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reloading...';
        window.location.reload();
    });

    dom.shuffleDropdownBtn.addEventListener('click', () => {
        dom.shuffleDropdownContainer.classList.toggle('active');
    });

    const handleShuffle = (filterType) => {
        initializeFlatAudioList(); 
        let listToShuffle = [...state.flatAudioList];

        if (filterType === 'songs') {
            listToShuffle = listToShuffle.filter(t => t.category === 'Songs');
        } else if (filterType === 'audios') {
            listToShuffle = listToShuffle.filter(t => t.category === 'Audios');
        }

        const shuffledList = shuffleArray(listToShuffle);
        state.flatAudioList = shuffledList; 
        state.currentTrackIndex = 0; 

        let title = filterType === 'songs' ? "Shuffled Songs" : 
                    filterType === 'audios' ? "Shuffled Audios" : "All Tracks (Randomized)";
        
        renderLibrary(shuffledList, title);
        loadTrack(0);
        
        dom.shuffleDropdownContainer.classList.remove('active');
        toggleSidebar();
    };

    dom.shuffleSongsBtn.addEventListener('click', () => handleShuffle('songs'));
    dom.shuffleAudiosBtn.addEventListener('click', () => handleShuffle('audios'));
    dom.shuffleAllBtn.addEventListener('click', () => handleShuffle('all'));

    dom.resetLibraryBtn.addEventListener('click', () => {
        initializeFlatAudioList(); 
        renderLibrary(); 
        dom.shuffleDropdownContainer.classList.remove('active');
        toggleSidebar();
    });

    dom.playPauseBtn.addEventListener('click', togglePlayPause);
    dom.nextBtn.addEventListener('click', playNext);
    dom.prevBtn.addEventListener('click', playPrev);
    dom.restartBtn.addEventListener('click', restartAudio);
    dom.volumeBar.addEventListener('input', (e) => setVolume(e.target.value));
    dom.searchInput.addEventListener('input', filterLibrary);

    dom.progressBar.addEventListener('input', () => seek(dom.progressBar));
    dom.bsProgressBar.addEventListener('input', () => seek(dom.bsProgressBar));

    dom.audioPlayer.addEventListener('timeupdate', handleTimeUpdate);
    dom.audioPlayer.addEventListener('loadedmetadata', handleMetadataLoaded);
    dom.audioPlayer.addEventListener('ended', playNext);

    dom.themeSwitcherBtn.addEventListener('click', cycleTheme);
    dom.backgroundPlayToggle.addEventListener('change', handleBackgroundToggle);
    dom.cacheAllBtn.addEventListener('click', handleCacheAll);

    dom.bsPlayPauseBtn.addEventListener('click', togglePlayPause);
    dom.bsRestartBtn.addEventListener('click', restartAudio);
    dom.bsLockBtn.addEventListener('click', toggleLockScreen);
    dom.focusModeToggleBtn.addEventListener('click', () => {
        if (!state.isBlackScreenLocked) hideBlackScreenMode();
    });
//  dom.nowPlayingBar.addEventListener('dblclick', (e) => {
//  if (!e.target.closest('button, input[type="range"]')) showBlackScreenMode();
//  });
    dom.blackScreenMode.addEventListener('click', handleBlackScreenClick);
    dom.blackScreenMode.addEventListener('touchend', handleBlackScreenClick);
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !state.backgroundPlayEnabled && state.isPlaying) {
            pauseAudio();
        }
    });

    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
}

// Removed performHardReset function

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); 
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); 
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
    // If clicking the inner controls (Play, Pause, Slider), ignore this background tap logic
    if (e.target.closest('.bs-content') || e.target.closest('.focus-mode-toggle')) return;

    // FIX FOR MOBILE: 
    // If this is a touch event, we must preventDefault() to stop the browser from 
    // firing a subsequent 'click' event (which would cause double counting).
    // We also stopPropagation() so the global zoom blocker in ui.js doesn't interfere.
    if (e.type === 'touchend') {
        e.preventDefault();
        e.stopPropagation();
    }

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

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js', { type: 'module' }) // FIX: Added { type: 'module' }
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