// js/ui.js: Contains all functions that update the user interface.

import { dom } from './dom.js';
import { state } from './state.js';
import { audioLibraryData, themes } from './config.js';
import { loadTrack, pauseAudio } from './player.js'; // Import pauseAudio

export function renderLibrary() {
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

                const titleSpan = document.createElement('span');
                titleSpan.className = 'track-title';
                titleSpan.textContent = trackInCategory.title;

                trackItem.appendChild(titleSpan);

                // --- THE FIX IS HERE ---
                // Create a new, block-scoped constant for each iteration of the loop.
                // The event listener's closure will capture this specific, unchanging value.
                const indexForListener = globalTrackRenderIndex;
                trackItem.addEventListener('click', () => loadTrack(indexForListener));
                // --- END OF FIX ---

                categoryDiv.appendChild(trackItem);
                globalTrackRenderIndex++;
            });
            dom.audioLibraryContainer.appendChild(categoryDiv);
        }
    }
    updatePlayingIndicator();
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