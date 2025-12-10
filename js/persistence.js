// js/persistence.js

import { dom } from './dom.js';
import { state } from './state.js';
import { themes } from './config.js';
import { applyTheme, formatTime, applyZoomState, updateProgressUI } from './ui.js'; // Add updateProgressUI
import { loadTrack } from './player.js';

export function saveState() {
    localStorage.setItem('softieAxinZoom', state.isZoomAllowed);
    if (state.currentTrackIndex === -1) return;
    
    // SAFELY GET TIME
    let timeToSave = state.pendingCurrentTime;
    if (state.activeAudio) {
        timeToSave = state.activeAudio.currentTime;
    }

    const appState = {
        currentTrackIndex: state.currentTrackIndex,
        currentTime: timeToSave,
        volume: dom.volumeBar.value
    };
    localStorage.setItem('softieAxinState', JSON.stringify(appState));
}

export function loadState() {
    // ... Themes, BgPlay, Zoom logic (keep same) ...
    // ...
    // ...

    // 4. Player State
    const savedState = localStorage.getItem('softieAxinState');
    if (savedState) {
        try {
            const loaded = JSON.parse(savedState);
            
            if (loaded.volume !== undefined) {
                state.pendingVolume = parseFloat(loaded.volume);
                dom.volumeBar.value = state.pendingVolume;
            }

            if (loaded.currentTime !== undefined) {
                state.pendingCurrentTime = parseFloat(loaded.currentTime);
                // Update UI directly using the helper
                updateProgressUI(state.pendingCurrentTime, 0);
            }

            if (loaded.currentTrackIndex !== undefined && loaded.currentTrackIndex < state.flatAudioList.length) {
                loadTrack(loaded.currentTrackIndex, false, true); 
            }
        } catch (e) {
            console.error("Error loading state:", e);
        }
    }
}