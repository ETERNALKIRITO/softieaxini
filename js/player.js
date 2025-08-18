// js/player.js (Corrected for iOS Background Play)

import { dom } from './dom.js';
import { state } from './state.js';
import { updatePlayPauseButtons, updatePlayingIndicator, showBlackScreenMode } from './ui.js';
import { saveState } from './persistence.js';

// --- Web Audio API Section - We will bypass this for iOS compatibility ---
/*
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
*/

// --- MODIFIED: Function to set volume using the native <audio> element property ---
export function setVolume(volume) {
    // This now directly controls the audio element, which is compatible with background play.
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
    // --- MODIFIED: Removed AudioContext resume logic ---
    /*
    if (state.audioContext && state.audioContext.state === 'suspended') {
        state.audioContext.resume();
    }
    */
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
    // --- MODIFIED: Removed AudioContext initialization on first play ---
    /*
    if (!state.isAudioContextInitialized) {
        initializeAudioContext();
    }
    */
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