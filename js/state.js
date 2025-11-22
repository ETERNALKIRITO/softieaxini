// js/state.js

import { audioLibraryData } from './config.js';

export const state = {
    flatAudioList: [],
    currentTrackIndex: -1,
    isPlaying: false,
    backgroundPlayEnabled: false,
    isBlackScreenLocked: false,
    tapCount: 0,
    tapTimeout: null,
    currentThemeIndex: 0,

    // --- NEW: Web Audio API State ---
    audioContext: null,
    gainNode: null,
    audioSource: null,
    isAudioContextInitialized: false,
    isZoomAllowed: true,
};

// Creates a single, flat array of all tracks from the categorized data
export function initializeFlatAudioList() {
    state.flatAudioList = []; // Reset the list
    let globalIdx = 0;
    for (const categoryName in audioLibraryData) {
        if (audioLibraryData.hasOwnProperty(categoryName)) {
            audioLibraryData[categoryName].forEach(track => {
                state.flatAudioList.push({
                    ...track,
                    category: categoryName,
                    originalIndexInFlatList: globalIdx++
                });
            });
        }
    }
}