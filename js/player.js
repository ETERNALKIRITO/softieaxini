// js/player.js (Final iOS Fix)

import { dom } from './dom.js';
import { state } from './state.js';
import { updatePlayPauseButtons, updatePlayingIndicator, showBlackScreenMode } from './ui.js';
import { saveState } from './persistence.js';

export function setVolume(volume) {
    dom.audioPlayer.volume = volume;
    dom.volumeBar.value = volume;
    saveState();
}

/**
 * Loads a track.
 * @param {number} index - The index of the track in flatAudioList
 * @param {boolean} playImmediately - Whether to start playing automatically
 * @param {boolean} lazyLoad - IF TRUE: Updates text/UI only. Does NOT load the audio file.
 */
export function loadTrack(index, playImmediately = true, lazyLoad = false) {
    if (index >= 0 && index < state.flatAudioList.length) {
        state.currentTrackIndex = index;
        const track = state.flatAudioList[index];

        // 1. ALWAYS update the Visual UI immediately
        dom.npTitle.textContent = track.title;
        dom.npArtist.textContent = ""; // Add artist here if your JSON has it
        dom.bsTrackTitle.textContent = track.title;
        updatePlayingIndicator();

        // 2. Logic for Audio Element
        if (lazyLoad) {
            // --- LAZY MODE (On App Startup) ---
            // We do NOT set dom.audioPlayer.src here.
            // We just set the state to paused and update icons.
            state.isPlaying = false;
            updatePlayPauseButtons();
        } else {
            // --- ACTIVE MODE (User Clicked) ---
            // Only reload src if it's different (prevents stutter if clicking same track)
            // We check 'includes' because currentSrc is a full absolute URL
            if (!dom.audioPlayer.src || !dom.audioPlayer.src.includes(track.url)) {
                dom.audioPlayer.src = track.url;
                dom.audioPlayer.load();
            }

            if (playImmediately) {
                playAudio();
            } else {
                updatePlayPauseButtons();
            }
        }
        
        // Save state (unless it's the startup load, but saving here is harmless)
        saveState();
    }
}

export function playAudio() {
    // Safety check: If src is empty (from a lazy load), we can't play yet.
    if (!dom.audioPlayer.src) {
        console.warn("Attempted to play with no source. Loading current track...");
        if(state.currentTrackIndex !== -1) {
            loadTrack(state.currentTrackIndex, true, false); // Load for real
        }
        return;
    }

    dom.audioPlayer.play().then(() => {
        state.isPlaying = true;
        updatePlayPauseButtons();
        // Only show black screen if it's not already visible
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
    if (state.currentTrackIndex === -1 && state.flatAudioList.length > 0) {
        // First run: Load and Play the first track
        loadTrack(0, true, false); 
        return;
    }

    if (state.currentTrackIndex !== -1) {
        const track = state.flatAudioList[state.currentTrackIndex];
        
        // CHECK: Is the file actually loaded in the hardware player?
        // If we did a "Lazy Load" on startup, audioPlayer.src will be empty or wrong.
        const isSourceLoaded = dom.audioPlayer.src && dom.audioPlayer.src.includes(track.url);

        if (!isSourceLoaded) {
            // WAKE UP: User hit play after a cold boot. Load the file NOW.
            loadTrack(state.currentTrackIndex, true, false); // lazyLoad = false
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
    let newIndex = (state.currentTrackIndex + 1) % state.flatAudioList.length;
    loadTrack(newIndex, true, false); // Force real load
}

export function playPrev() {
    if (state.flatAudioList.length === 0) return;
    let newIndex = (state.currentTrackIndex - 1 + state.flatAudioList.length) % state.flatAudioList.length;
    loadTrack(newIndex, true, false); // Force real load
}

export function restartAudio() {
    if (state.currentTrackIndex !== -1) {
        dom.audioPlayer.currentTime = 0;
        if (!state.isPlaying) playAudio();
    }
}

export function seek(barElement) {
    dom.audioPlayer.currentTime = barElement.value;
}