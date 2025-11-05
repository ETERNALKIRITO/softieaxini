// js/ui.js: Contains all functions that update the user interface.

import { dom } from './dom.js';
import { state } from './state.js';
import { audioLibraryData, themes } from './config.js';
import { loadTrack, pauseAudio } from './player.js';

export function filterLibrary() {
    const searchTerm = dom.searchInput.value.toLowerCase().trim();
    const categories = dom.audioLibraryContainer.querySelectorAll('.category');

    categories.forEach(category => {
        const trackItems = category.querySelectorAll('.track-item');
        let visibleTracksInCategory = 0;

        trackItems.forEach(item => {
            const title = item.querySelector('.track-title').textContent.toLowerCase();
            const isMatch = title.includes(searchTerm);

            item.style.display = isMatch ? 'flex' : 'none';

            if (isMatch) {
                visibleTracksInCategory++;
            }
        });

        category.style.display = visibleTracksInCategory > 0 ? 'block' : 'none';
    });
}

export function renderLibrary() {
    return new Promise(resolve => { // Return a promise to know when it's done
        dom.audioLibraryContainer.innerHTML = '';
        let globalTrackRenderIndex = 0;

        for (const categoryName in audioLibraryData) {
            if (audioLibraryData.hasOwnProperty(categoryName)) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category';
                const categoryTitle = document.createElement('h2');
                categoryTitle.textContent = categoryName;
                categoryDiv.appendChild(categoryTitle);

                audioLibraryData[categoryName].forEach(trackInCategory => {
                    const trackItem = document.createElement('div');
                    trackItem.className = 'track-item';
                    trackItem.dataset.index = globalTrackRenderIndex;

                    // Create a container for the title/artist
                    const infoContainer = document.createElement('div');
                    infoContainer.className = 'track-info-container';
                    
                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'track-title';
                    titleSpan.textContent = trackInCategory.title;
                    infoContainer.appendChild(titleSpan);

                    // Create the cache status element
                    const cacheStatusSpan = document.createElement('span');
                    cacheStatusSpan.className = 'cache-status';
                    
                    trackItem.appendChild(infoContainer); // Add the text container
                    trackItem.appendChild(cacheStatusSpan); // Add the status icon

                    const indexForListener = globalTrackRenderIndex;
                    trackItem.addEventListener('click', () => loadTrack(indexForListener));

                    categoryDiv.appendChild(trackItem);
                    globalTrackRenderIndex++;
                });
                dom.audioLibraryContainer.appendChild(categoryDiv);
            }
        }
        updatePlayingIndicator();
        resolve(); // Resolve the promise
    });
}

// NEW FUNCTION to update the icon based on status
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
                    iconHtml = ''; // No icon for 'not-cached'
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
    pauseAudio(); // Pause audio when exiting focus mode
}

export function toggleLockScreen() {
    state.isBlackScreenLocked = !state.isBlackScreenLocked;
    dom.bsLockBtn.innerHTML = state.isBlackScreenLocked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-unlock"></i>';
    dom.bsLockBtn.title = state.isBlackScreenLocked ? "Unlock Screen" : "Lock Screen";
    dom.blackScreenMode.classList.toggle('locked', state.isBlackScreenLocked);
}