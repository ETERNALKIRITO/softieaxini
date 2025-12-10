// js/player.js

import { dom } from './dom.js';
import { state } from './state.js';
import { updatePlayPauseButtons, updatePlayingIndicator, showBlackScreenMode, updateProgressUI } from './ui.js';
import { saveState } from './persistence.js';

// --- HELPER: Get or Create Audio ---
function getAudio() {
    if (!state.activeAudio) {
        // Create the player dynamically (The "Ghost" Player)
        state.activeAudio = new Audio();
        state.activeAudio.crossOrigin = "anonymous";
        
        // Attach Event Listeners immediately
        state.activeAudio.addEventListener('timeupdate', () => {
            updateProgressUI(state.activeAudio.currentTime, state.activeAudio.duration);
            saveState(); // Save progress as we go
        });

        state.activeAudio.addEventListener('loadedmetadata', () => {
             updateProgressUI(state.activeAudio.currentTime, state.activeAudio.duration);
        });

        state.activeAudio.addEventListener('ended', playNext);
    }
    return state.activeAudio;
}

export function setVolume(volume) {
    state.pendingVolume = volume;
    dom.volumeBar.value = volume;
    if (state.activeAudio) {
        state.activeAudio.volume = volume;
    }
    saveState();
}

export function loadTrack(index, playImmediately = true, lazyLoad = false) {
    if (index >= 0 && index < state.flatAudioList.length) {
        state.currentTrackIndex = index;
        const track = state.flatAudioList[index];

        // 1. UI Update
        dom.npTitle.textContent = track.title;
        dom.npArtist.textContent = ""; 
        dom.bsTrackTitle.textContent = track.title;
        updatePlayingIndicator();

        // 2. Audio Logic
        if (lazyLoad) {
            state.isPlaying = false;
            updatePlayPauseButtons();
        } else {
            const audio = getAudio(); // Create if needed
            
            if (!audio.src || !audio.src.includes(track.url)) {
                audio.src = track.url;
                if (state.pendingVolume !== undefined) audio.volume = state.pendingVolume;
                audio.load();
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
    const audio = getAudio(); // Create if needed

    // Wake up from Lazy Load
    if (!audio.src) {
        if(state.currentTrackIndex !== -1) {
            loadTrack(state.currentTrackIndex, true, false); 
        }
        return;
    }

    // Apply Pending Time
    if (state.pendingCurrentTime > 0) {
        audio.currentTime = state.pendingCurrentTime;
        state.pendingCurrentTime = 0; 
    }

    audio.play().then(() => {
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
    if (state.activeAudio) {
        state.activeAudio.pause();
    }
    state.isPlaying = false;
    updatePlayPauseButtons();
}

export function togglePlayPause() {
    if (state.currentTrackIndex === -1 && state.flatAudioList.length > 0) {
        loadTrack(0, true, false); 
        return;
    }

    if (state.currentTrackIndex !== -1) {
        // If audio doesn't exist yet, we must "Wake Up"
        if (!state.activeAudio || !state.activeAudio.src) {
             loadTrack(state.currentTrackIndex, true, false);
             return;
        }

        if (state.isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    }
}

export function playNext() {
    if (state.flatAudioList.length === 0) return;
    state.pendingCurrentTime = 0; 
    let newIndex = (state.currentTrackIndex + 1) % state.flatAudioList.length;
    loadTrack(newIndex, true, false); 
}

export function playPrev() {
    if (state.flatAudioList.length === 0) return;
    state.pendingCurrentTime = 0; 
    let newIndex = (state.currentTrackIndex - 1 + state.flatAudioList.length) % state.flatAudioList.length;
    loadTrack(newIndex, true, false); 
}

export function restartAudio() {
    if (state.currentTrackIndex !== -1 && state.activeAudio) {
        state.activeAudio.currentTime = 0;
        state.pendingCurrentTime = 0;
        if (!state.isPlaying) playAudio();
    }
}

export function seek(barElement) {
    state.pendingCurrentTime = barElement.value;
    
    // If player exists, seek immediately
    if (state.activeAudio && state.activeAudio.src) {
        state.activeAudio.currentTime = state.pendingCurrentTime;
        state.pendingCurrentTime = 0; // Clear pending
    } else {
        // If in lazy mode, wake it up
        loadTrack(state.currentTrackIndex, true, false);
    }
}