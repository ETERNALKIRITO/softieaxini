// js/persistence.js

import { dom } from './dom.js';
import { state } from './state.js';
import { themes } from './config.js';
import { applyTheme, formatTime, applyZoomState } from './ui.js';
import { loadTrack } from './player.js'; // Removed setVolume import

export function saveState() {
    localStorage.setItem('softieAxinZoom', state.isZoomAllowed);

    if (state.currentTrackIndex === -1) return;
    
    const appState = {
        currentTrackIndex: state.currentTrackIndex,
        // Save current time (or pending time if we haven't played yet)
        currentTime: dom.audioPlayer.currentTime || state.pendingCurrentTime,
        // Save current volume (or pending volume)
        volume: dom.volumeBar.value
    };
    localStorage.setItem('softieAxinState', JSON.stringify(appState));
}

export function loadState() {
    // 1. Theme
    const savedTheme = localStorage.getItem('softieAxinTheme');
    if (savedTheme && themes.includes(savedTheme)) {
        state.currentThemeIndex = themes.indexOf(savedTheme);
        applyTheme(savedTheme);
    } else {
        applyTheme(themes[0]);
    }

    // 2. Background Play
    const savedBgPlay = localStorage.getItem('softieAxinBgPlay');
    if (savedBgPlay !== null) {
        state.backgroundPlayEnabled = JSON.parse(savedBgPlay);
        dom.backgroundPlayToggle.checked = state.backgroundPlayEnabled;
    }

    // 3. Zoom
    const savedZoom = localStorage.getItem('softieAxinZoom');
    if (savedZoom !== null) {
        state.isZoomAllowed = JSON.parse(savedZoom);
    } else {
        state.isZoomAllowed = true; 
    }
    applyZoomState(); 

    // 4. Player State (ZERO TOUCH MODE)
    const savedState = localStorage.getItem('softieAxinState');
    if (savedState) {
        try {
            const loaded = JSON.parse(savedState);
            
            // Restore Volume to STATE and UI only. Do NOT touch audioPlayer.
            if (loaded.volume !== undefined) {
                state.pendingVolume = parseFloat(loaded.volume);
                dom.volumeBar.value = state.pendingVolume;
            }

            // Restore Time to STATE only.
            if (loaded.currentTime !== undefined) {
                state.pendingCurrentTime = parseFloat(loaded.currentTime);
                // Update visual time displays
                dom.currentTimeDisplay.textContent = formatTime(state.pendingCurrentTime);
                dom.bsCurrentTime.textContent = formatTime(state.pendingCurrentTime);
                dom.progressBar.value = state.pendingCurrentTime;
                dom.bsProgressBar.value = state.pendingCurrentTime;
            }

            // Restore Track (Visual Only)
            if (loaded.currentTrackIndex !== undefined && loaded.currentTrackIndex < state.flatAudioList.length) {
                loadTrack(loaded.currentTrackIndex, false, true); 
            }
        } catch (e) {
            console.error("Error loading state:", e);
        }
    }
}