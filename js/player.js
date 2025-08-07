// js/player.js

import { dom } from './dom.js';
import { state } from './state.js';
import { updatePlayPauseButtons, updatePlayingIndicator, showBlackScreenMode } from './ui.js';
import { saveState } from './persistence.js';

// --- NEW: Function to initialize the Web Audio API components ---
function initializeAudioContext() {
    if (state.isAudioContextInitialized) return;

    // Create the master AudioContext
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create a GainNode for volume control
    state.gainNode = state.audioContext.createGain();

    // Connect the <audio> element as the source
    state.audioSource = state.audioContext.createMediaElementSource(dom.audioPlayer);

    // Create the audio graph: source -> gain -> speakers (destination)
    state.audioSource.connect(state.gainNode);
    state.gainNode.connect(state.audioContext.destination);

    // Set the initial volume from the slider
    state.gainNode.gain.value = dom.volumeBar.value;

    state.isAudioContextInitialized = true;
    console.log("Web Audio API Initialized.");
}

// --- NEW: Function to set volume using the GainNode ---
export function setVolume(volume) {
    if (state.gainNode) {
        state.gainNode.gain.value = volume;
    }
    // Also update the original element's volume for state saving
    dom.audioPlayer.volume = volume;
    dom.volumeBar.value = volume;
    saveState(); // Save volume change immediately
}


export function loadTrack(index, playImmediately = true) {
    if (index >= 0 && index < state.flatAudioList.length) {
        state.currentTrackIndex = index;
        const track = state.flatAudioList[index];
        dom.audioPlayer.src = track.url;
        dom.audioPlayer.load();

        dom.npTitle.textContent = track.title;
        dom.npArtist.textContent = "";
        dom.bsTrackTitle.textContent = track.title;

        if (playImmediately) {
            playAudio();
        } else {
            updatePlayPauseButtons();
        }
        updatePlayingIndicator();
        saveState();
    }
}

export function playAudio() {
    // --- MODIFIED: Ensure AudioContext is resumed ---
    if (state.audioContext && state.audioContext.state === 'suspended') {
        state.audioContext.resume();
    }
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
    // --- MODIFIED: Initialize AudioContext on first play ---
    if (!state.isAudioContextInitialized) {
        initializeAudioContext();
    }

    if (state.currentTrackIndex === -1 && state.flatAudioList.length > 0) {
        loadTrack(0);
    } else if (state.currentTrackIndex !== -1) {
        if (state.isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    }
}

export function playNext() {
    if (state.flatAudioList.length === 0) return;
    let newIndex = (state.currentTrackIndex + 1) % state.flatAudioList.length;
    loadTrack(newIndex);
}

export function playPrev() {
    if (state.flatAudioList.length === 0) return;
    let newIndex = (state.currentTrackIndex - 1 + state.flatAudioList.length) % state.flatAudioList.length;
    loadTrack(newIndex);
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
