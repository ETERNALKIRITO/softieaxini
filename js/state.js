// js/state.js
export const state = {
    audioLibrary: {}, 
    flatAudioList: [],
    currentTrackIndex: -1,
    isPlaying: false,
    backgroundPlayEnabled: false,
    isBlackScreenLocked: false,
    tapCount: 0,
    tapTimeout: null,
    currentThemeIndex: 0,
    audioContext: null,
    gainNode: null,
    audioSource: null,
    isAudioContextInitialized: false,
    // Removed isZoomAllowed as zoom is now always prevented
};

export async function loadLibraryData() {
    try {
        const response = await fetch('library.json');
        if (!response.ok) throw new Error('Failed to load library.json');
        state.audioLibrary = await response.json();
        initializeFlatAudioList(); 
    } catch (error) {
        console.error("Error loading library:", error);
        alert("Failed to load audio library. Please refresh.");
    }
}

export function initializeFlatAudioList() {
    state.flatAudioList = []; 
    let globalIdx = 0;
    for (const categoryName in state.audioLibrary) {
        if (state.audioLibrary.hasOwnProperty(categoryName)) {
            state.audioLibrary[categoryName].forEach(track => {
                state.flatAudioList.push({
                    ...track,
                    category: categoryName,
                    originalIndexInFlatList: globalIdx++
                });
            });
        }
    }
}