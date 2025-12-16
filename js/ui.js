// js/ui.js

import { dom } from './dom.js';
import { state } from './state.js';
import { themes } from './config.js'; 
import { loadTrack, pauseAudio } from './player.js';

// --- LEVEL 3: JavaScript Brute Force Functions for Permanent Zoom Prevention ---
// These are now always active, no toggle.

// Block "Pinch to Zoom" (iOS Safari / Mobile)
export const blockGesture = (e) => { // Exported for use in main.js
    e.preventDefault();
    // console.log("Blocked: Gesture/Pinch");
};

// Block "Double-Tap to Zoom"
let lastTouchEnd = 0;
export const blockDoubleTap = (e) => { // Exported for use in main.js
    const now = (new Date()).getTime();
    // If the time between two taps is less than 300ms, it's a double tap
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
        // console.log("Blocked: Double Tap");
    }
    lastTouchEnd = now;
};

// Removed applyZoomState as zoom is now always prevented
// Removed blockWheel and blockKey as they are generally not needed for mobile Safari zoom prevention,
// and keeping the viewport meta tag combined with gesture/double-tap blocking is usually sufficient.


// Helper: Fisher-Yates Shuffle Algorithm
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function filterLibrary() {
    const searchTerm = dom.searchInput.value.toLowerCase().trim();
    
    if (dom.audioLibraryContainer.querySelector('.category h2').textContent.includes('Shuffled') || 
        dom.audioLibraryContainer.querySelector('.category h2').textContent.includes('All Tracks')) {
        
        const trackItems = dom.audioLibraryContainer.querySelectorAll('.track-item');
        trackItems.forEach(item => {
            const title = item.querySelector('.track-title').textContent.toLowerCase();
            item.style.display = title.includes(searchTerm) ? 'flex' : 'none';
        });
        return;
    }

    const categories = dom.audioLibraryContainer.querySelectorAll('.category');
    categories.forEach(category => {
        const trackItems = category.querySelectorAll('.track-item');
        let visibleTracksInCategory = 0;

        trackItems.forEach(item => {
            const title = item.querySelector('.track-title').textContent.toLowerCase();
            const isMatch = title.includes(searchTerm);
            item.style.display = isMatch ? 'flex' : 'none';
            if (isMatch) visibleTracksInCategory++;
        });

        category.style.display = visibleTracksInCategory > 0 ? 'block' : 'none';
    });
}

function createTrackElement(track, index) {
    const trackItem = document.createElement('div');
    trackItem.className = 'track-item';
    trackItem.dataset.index = index;

    const infoContainer = document.createElement('div');
    infoContainer.className = 'track-info-container';
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'track-title';
    titleSpan.textContent = track.title;
    infoContainer.appendChild(titleSpan);

    const cacheStatusSpan = document.createElement('span');
    cacheStatusSpan.className = 'cache-status';
    
    trackItem.appendChild(infoContainer);
    trackItem.appendChild(cacheStatusSpan);

    trackItem.addEventListener('click', () => loadTrack(index));
    return trackItem;
}

export function renderLibrary(customList = null, customTitle = null) {
    return new Promise(resolve => {
        dom.audioLibraryContainer.innerHTML = '';
        
        if (customList) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = customTitle || "Shuffled Playlist";
            categoryDiv.appendChild(categoryTitle);

            customList.forEach((track, index) => {
                const trackItem = createTrackElement(track, index);
                categoryDiv.appendChild(trackItem);
            });
            dom.audioLibraryContainer.appendChild(categoryDiv);
        } 
        else {
            let globalTrackRenderIndex = 0;
            for (const categoryName in state.audioLibrary) {
                if (state.audioLibrary.hasOwnProperty(categoryName)) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'category';
                    const categoryTitle = document.createElement('h2');
                    categoryTitle.textContent = categoryName;
                    categoryDiv.appendChild(categoryTitle);

                    state.audioLibrary[categoryName].forEach(track => {
                        const trackItem = createTrackElement(track, globalTrackRenderIndex);
                        categoryDiv.appendChild(trackItem);
                        globalTrackRenderIndex++;
                    });
                    dom.audioLibraryContainer.appendChild(categoryDiv);
                }
            }
        }
        
        updatePlayingIndicator();
        resolve();
    });
}

export function updateTrackCacheStatus(trackIndex, status) {
    const trackItem = dom.audioLibraryContainer.querySelector(`.track-item[data-index='${trackIndex}']`);
    if (trackItem) {
        const statusIconEl = trackItem.querySelector('.cache-status');
        if (statusIconEl) {
            let iconHtml = '';
            let title = '';
            switch (status) {
                case 'caching':
                    iconHtml = '<i class="fas fa-spinner fa-spin"></i>';
                    title = 'Caching...';
                    break;
                case 'cached':
                    iconHtml = '<i class="fas fa-check-circle"></i>';
                    title = 'Available Offline';
                    break;
                case 'failed':
                    iconHtml = '<i class="fas fa-times-circle"></i>';
                    title = 'Caching Failed';
                    break;
                default:
                    iconHtml = ''; 
                    title = 'Online Only';
            }
            statusIconEl.innerHTML = iconHtml;
            statusIconEl.title = title;
        }
    }
}

export function updatePlayPauseButtons() {
    const playIcon = '<i class="fas fa-play"></i>';
    const pauseIcon = '<i class="fas fa-pause"></i>';
    dom.playPauseBtn.innerHTML = state.isPlaying ? pauseIcon : playIcon;
    dom.bsPlayPauseBtn.innerHTML = state.isPlaying ? pauseIcon : playIcon;
    dom.playPauseBtn.title = state.isPlaying ? "Pause" : "Play";
    dom.bsPlayPauseBtn.title = state.isPlaying ? "Pause" : "Play";
}

export function updatePlayingIndicator() {
    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('playing');
        if (parseInt(item.dataset.index) === state.currentTrackIndex) {
            item.classList.add('playing');
        }
    });
}

export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

export function applyTheme(themeName) {
    // Removed zoom-locked class handling, as zoom is now always prevented
    document.body.className = '';
    
    if (themeName !== "default") {
        document.body.classList.add(themeName);
    }
    
    localStorage.setItem('softieAxinTheme', themeName);
}

export function cycleTheme() {
    state.currentThemeIndex = (state.currentThemeIndex + 1) % themes.length;
    applyTheme(themes[state.currentThemeIndex]);
}

export function showBlackScreenMode() {
    if (state.currentTrackIndex === -1) return;
    dom.blackScreenMode.style.display = 'flex';
    dom.bsProgressBar.value = dom.audioPlayer.currentTime;
    dom.bsCurrentTime.textContent = formatTime(dom.audioPlayer.currentTime);
    dom.bsTotalTime.textContent = formatTime(dom.audioPlayer.duration || 0);
    updatePlayPauseButtons();
}

export function hideBlackScreenMode() {
    if (state.isBlackScreenLocked) return;
    dom.blackScreenMode.style.display = 'none';
    pauseAudio(); 
}

export function toggleLockScreen() {
    state.isBlackScreenLocked = !state.isBlackScreenLocked;
    dom.bsLockBtn.innerHTML = state.isBlackScreenLocked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-unlock"></i>';
    dom.bsLockBtn.title = state.isBlackScreenLocked ? "Unlock Screen" : "Lock Screen";
    dom.blackScreenMode.classList.toggle('locked', state.isBlackScreenLocked);
}