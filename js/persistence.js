// js/persistence.js

import { dom } from './dom.js';
import { state } from './state.js';
import { themes } from './config.js';
import { applyTheme, formatTime, applyZoomState } from './ui.js';
import { loadTrack, setVolume } from './player.js';

export function saveState() {
    // Save Zoom Preference
    localStorage.setItem('softieAxinZoom', state.isZoomAllowed);

    // Only save track state if we have a valid index
    if (state.currentTrackIndex === -1) return;
    
    const appState = {
        currentTrackIndex: state.currentTrackIndex,
        // We still SAVE the time, in case you want to use it later,
        // but we won't restore it automatically on boot for stability.
        currentTime: dom.audioPlayer.currentTime,
        volume: dom.volumeBar.value
    };
    localStorage.setItem('softieAxinState', JSON.stringify(appState));
}

export function loadState() {
    // 1. Load Theme
    const savedTheme = localStorage.getItem('softieAxinTheme');
    if (savedTheme && themes.includes(savedTheme)) {
        state.currentThemeIndex = themes.indexOf(savedTheme);
        applyTheme(savedTheme);
    } else {
        applyTheme(themes[0]);
    }

    // 2. Load Background Play setting
    const savedBgPlay = localStorage.getItem('softieAxinBgPlay');
    if (savedBgPlay !== null) {
        state.backgroundPlayEnabled = JSON.parse(savedBgPlay);
        dom.backgroundPlayToggle.checked = state.backgroundPlayEnabled;
    }

    // 3. Load Zoom Preference
    const savedZoom = localStorage.getItem('softieAxinZoom');
    if (savedZoom !== null) {
        state.isZoomAllowed = JSON.parse(savedZoom);
    } else {
        state.isZoomAllowed = true; 
    }
    applyZoomState(); 

    // 4. Load Player State (THE FIX IS HERE)
    const savedState = localStorage.getItem('softieAxinState');
    if (savedState) {
        try {
            const loaded = JSON.parse(savedState);
            
            // Restore Volume
            if (loaded.volume !== undefined) {
                dom.volumeBar.value = loaded.volume;
                dom.audioPlayer.volume = loaded.volume;
            }

            // Restore Track
            if (loaded.currentTrackIndex !== undefined && loaded.currentTrackIndex < state.flatAudioList.length) {
                // Load the track, but DO NOT play it yet
                loadTrack(loaded.currentTrackIndex, false); 
                
                // --- IOS FIX: DO NOT SET CURRENT TIME HERE ---
                // Attempts to set currentTime on a cold boot (startup) causes iOS to freeze/deadlock.
                // We intentionally leave the track at 0:00.
                // The visual sliders will update automatically when the track loads.
            }
        } catch (e) {
            console.error("Error loading state:", e);
            // If state is corrupt, clear it to prevent infinite crashes
            localStorage.removeItem('softieAxinState');
        }
    }
}