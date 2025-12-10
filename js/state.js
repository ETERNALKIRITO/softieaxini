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
    
    // Zoom state
    isZoomAllowed: true,

    // --- ADD THESE NEW VARIABLES ---
    // These hold the saved data until the user taps "Play"
    pendingVolume: 1, 
    pendingCurrentTime: 0,

    activeAudio: null  // This will hold the dynamic player
};

// ... keep loadLibraryData and initializeFlatAudioList as they were ...
export async function loadLibraryData() {
    try {
        const response = await fetch('library.json');
        if (!response.ok) throw new Error('Failed to load library.json');
        state.audioLibrary = await response.json();
        initializeFlatAudioList(); 
    } catch (error) {
        console.error("Error loading library:", error);
        // alert("Failed to load audio library. Please refresh."); // Optional: remove alert to be less annoying
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