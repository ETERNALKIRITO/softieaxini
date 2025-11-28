// js/state.js

export const state = {
    audioLibrary: {}, // New: stores the raw JSON data
    flatAudioList: [],
    currentTrackIndex: -1,
    isPlaying: false,
    backgroundPlayEnabled: false,
    isBlackScreenLocked: false,
    tapCount: 0,
    tapTimeout: null,
    currentThemeIndex: 0,

    // Web Audio API State
    audioContext: null,
    gainNode: null,
    audioSource: null,
    isAudioContextInitialized: false,
    isZoomAllowed: true,
};

// NEW: Function to fetch the JSON file
export async function loadLibraryData() {
    try {
        const response = await fetch('library.json');
        if (!response.ok) throw new Error('Failed to load library.json');
        state.audioLibrary = await response.json();
        initializeFlatAudioList(); // Process the data immediately after loading
    } catch (error) {
        console.error("Error loading library:", error);
        alert("Failed to load audio library. Please refresh.");
    }
}

// Creates a single, flat array of all tracks from the categorized data
export function initializeFlatAudioList() {
    state.flatAudioList = []; 
    let globalIdx = 0;
    
    // Now iterates over state.audioLibrary instead of the imported object
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