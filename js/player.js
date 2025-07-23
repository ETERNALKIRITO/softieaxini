// js/player.js: Handles core audio playback logic.

import { dom } from './dom.js';
import { state } from './state.js';
import { updatePlayPauseButtons, updatePlayingIndicator, showBlackScreenMode } from './ui.js';
import { saveState } from './persistence.js';

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
