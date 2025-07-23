// js/persistence.js: Handles saving state to and loading from localStorage.

import { dom } from './dom.js';
import { state } from './state.js';
import { themes } from './config.js';
import { applyTheme, formatTime } from './ui.js';
import { loadTrack } from './player.js';

export function saveState() {
    if (state.currentTrackIndex === -1) return;
    const appState = {
        currentTrackIndex: state.currentTrackIndex,
        currentTime: dom.audioPlayer.currentTime,
        volume: dom.audioPlayer.volume
    };
    localStorage.setItem('softieAxinState', JSON.stringify(appState));
}

export function loadState() {
    // Load Theme
    const savedTheme = localStorage.getItem('softieAxinTheme');
    if (savedTheme && themes.includes(savedTheme)) {
        state.currentThemeIndex = themes.indexOf(savedTheme);
        applyTheme(savedTheme);
    } else {
        applyTheme(themes[0]);
    }

    // Load Background Play setting
    const savedBgPlay = localStorage.getItem('softieAxinBgPlay');
    if (savedBgPlay !== null) {
        state.backgroundPlayEnabled = JSON.parse(savedBgPlay);
        dom.backgroundPlayToggle.checked = state.backgroundPlayEnabled;
    }

    // Load Player State
    const savedState = localStorage.getItem('softieAxinState');
    if (savedState) {
        try {
            const loaded = JSON.parse(savedState);
            if (loaded.currentTrackIndex !== undefined && loaded.currentTrackIndex < state.flatAudioList.length) {
                loadTrack(loaded.currentTrackIndex, false); // Don't autoplay on load

                if (loaded.currentTime) {
                    const setTimeOnMetadata = () => {
                        dom.audioPlayer.currentTime = loaded.currentTime;
                        // Update UI elements that depend on duration
                        dom.totalTimeDisplay.textContent = formatTime(dom.audioPlayer.duration);
                        dom.bsTotalTime.textContent = formatTime(dom.audioPlayer.duration);
                        // Update UI elements for current time
                        dom.currentTimeDisplay.textContent = formatTime(loaded.currentTime);
                        dom.bsCurrentTime.textContent = formatTime(loaded.currentTime);
                        dom.progressBar.value = loaded.currentTime;
                        dom.bsProgressBar.value = loaded.currentTime;
                    };

                    if (dom.audioPlayer.readyState >= 1) { // If metadata is already loaded
                        setTimeOnMetadata();
                    } else { // Otherwise, wait for it to load
                        dom.audioPlayer.addEventListener('loadedmetadata', setTimeOnMetadata, { once: true });
                    }
                }
                if (loaded.volume !== undefined) {
                    dom.audioPlayer.volume = loaded.volume;
                    dom.volumeBar.value = loaded.volume;
                }
            }
        } catch (e) {
            console.error("Error loading state:", e);
            localStorage.removeItem('softieAxinState');
        }
    } else {
        dom.audioPlayer.volume = dom.volumeBar.value;
    }
}