// js/player.js

import { dom } from './dom.js';
import { state } from './state.js';
import { updatePlayPauseButtons, updatePlayingIndicator, showBlackScreenMode, formatTime } from './ui.js'; // Ensure formatTime is imported
import { saveState } from './persistence.js';

export function setVolume(volume) {
    // Standard volume change
    dom.audioPlayer.volume = volume;
    dom.volumeBar.value = volume;
    state.pendingVolume = volume; // Keep state in sync
    saveState();
}

export function loadTrack(index, playImmediately = true, lazyLoad = false) {
    if (index >= 0 && index < state.flatAudioList.length) {
        state.currentTrackIndex = index;
        const track = state.flatAudioList[index];

        // 1. UI Update (Always safe)
        dom.npTitle.textContent = track.title;
        dom.npArtist.textContent = ""; 
        dom.bsTrackTitle.textContent = track.title;
        updatePlayingIndicator();

        // 2. Audio Logic
        if (lazyLoad) {
            // --- LAZY MODE ---
            // Do absolutely nothing to the audio hardware.
            state.isPlaying = false;
            updatePlayPauseButtons();
        } else {
            // --- ACTIVE MODE ---
            // Check if we need to load the source
            if (!dom.audioPlayer.src || !dom.audioPlayer.src.includes(track.url)) {
                dom.audioPlayer.src = track.url;
                
                // APPLY PENDING VOLUME NOW
                if (state.pendingVolume !== undefined) {
                    dom.audioPlayer.volume = state.pendingVolume;
                }
                
                dom.audioPlayer.load();
            }

            if (playImmediately) {
                playAudio();
            } else {
                updatePlayPauseButtons();
            }
        }
        
        saveState();
    }
}

export function playAudio() {
    // 1. Handle Lazy Load Wake-up
    if (!dom.audioPlayer.src) {
        if(state.currentTrackIndex !== -1) {
            // Force a real load now
            loadTrack(state.currentTrackIndex, true, false); 
        }
        return;
    }

    // 2. Apply Pending Time (Seek) if it exists
    // We only do this ONCE after a fresh boot
    if (state.pendingCurrentTime > 0) {
        const targetTime = state.pendingCurrentTime;
        state.pendingCurrentTime = 0; // Clear it so we don't seek every time we hit play
        dom.audioPlayer.currentTime = targetTime;
    }

    // 3. Play
    dom.audioPlayer.play().then(() => {
        state.isPlaying = true;
        updatePlayPauseButtons();
        if (!dom.blackScreenMode.style.display || dom.blackScreenMode.style.display === 'none') {
            showBlackScreenMode();
        }
    }).catch(error => {
        console.error("Error playing audio:", error);
        state.isPlaying = false;
        updatePlayPauseButtons();
    });
}

export function pauseAudio() {
    dom.audioPlayer.pause();
    state.isPlaying = false;
    updatePlayPauseButtons();
}

export function togglePlayPause() {
    // Case 1: First run ever
    if (state.currentTrackIndex === -1 && state.flatAudioList.length > 0) {
        loadTrack(0, true, false); 
        return;
    }

    // Case 2: Resume from saved state
    if (state.currentTrackIndex !== -1) {
        const track = state.flatAudioList[state.currentTrackIndex];
        const isSourceLoaded = dom.audioPlayer.src && dom.audioPlayer.src.includes(track.url);

        if (!isSourceLoaded) {
            // Wake up from Lazy Load
            loadTrack(state.currentTrackIndex, true, false);
        } else {
            // Normal toggle
            if (state.isPlaying) {
                pauseAudio();
            } else {
                playAudio();
            }
        }
    }
}

export function playNext() {
    if (state.flatAudioList.length === 0) return;
    state.pendingCurrentTime = 0; // Reset pending time on manual change
    let newIndex = (state.currentTrackIndex + 1) % state.flatAudioList.length;
    loadTrack(newIndex, true, false); 
}

export function playPrev() {
    if (state.flatAudioList.length === 0) return;
    state.pendingCurrentTime = 0; // Reset pending time on manual change
    let newIndex = (state.currentTrackIndex - 1 + state.flatAudioList.length) % state.flatAudioList.length;
    loadTrack(newIndex, true, false); 
}

export function restartAudio() {
    if (state.currentTrackIndex !== -1) {
        dom.audioPlayer.currentTime = 0;
        state.pendingCurrentTime = 0;
        if (!state.isPlaying) playAudio();
    }
}

export function seek(barElement) {
    // If user seeks while in "Lazy Mode", we must wake up the player first
    if (!dom.audioPlayer.src && state.currentTrackIndex !== -1) {
        // Set the pending time to where they dragged
        state.pendingCurrentTime = barElement.value;
        // Load and play
        loadTrack(state.currentTrackIndex, true, false);
    } else {
        dom.audioPlayer.currentTime = barElement.value;
    }
}