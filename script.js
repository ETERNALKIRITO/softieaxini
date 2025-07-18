// script.js
document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audioPlayer');
    const audioLibraryContainer = document.getElementById('audioLibrary');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const restartBtn = document.getElementById('restartBtn');
    const progressBar = document.getElementById('progressBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const totalTimeDisplay = document.getElementById('totalTime');
    const volumeBar = document.getElementById('volumeBar');
    const npTitle = document.getElementById('npTitle');
    const npArtist = document.getElementById('npArtist'); // Will be empty due to new data structure
    const cacheAllBtn = document.getElementById('cacheAllBtn');
    const backgroundPlayToggle = document.getElementById('backgroundPlayToggle');
    const themeSwitcherBtn = document.getElementById('themeSwitcherBtn');

    // Black Screen Mode Elements
    const blackScreenMode = document.getElementById('blackScreenMode');
    const bsTrackTitle = document.getElementById('bsTrackTitle');
    const bsCurrentTime = document.getElementById('bsCurrentTime');
    const bsTotalTime = document.getElementById('bsTotalTime');
    const bsProgressBar = document.getElementById('bsProgressBar');
    const bsPlayPauseBtn = document.getElementById('bsPlayPauseBtn');
    const bsRestartBtn = document.getElementById('bsRestartBtn');
    const bsLockBtn = document.getElementById('bsLockBtn');
    const focusModeToggleBtn = document.getElementById('focusModeToggleBtn');
    const nowPlayingBar = document.getElementById('nowPlayingBar');

    // --- Configuration ---
    const audioLibraryData = {
        "Audios": [
            { title: "Stained Brutal Calamity", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-stained-brutal-calamity.mp3?updatedAt=1747151322673" },
            { title: "Scourge Of The Universe", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-scourge-of-the-universe.mp3?updatedAt=1747151326458" },
            { title: "Hokma Battle 1", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/hokma-battle-1.mp3?updatedAt=1747151329996" },
            { title: "Open Frenzy", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-open-frenzy.mp3?updatedAt=1747151339790" },
            { title: "Bloody Coagulant", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-bloody-coagulant.mp3?updatedAt=1747151343203" },
            { title: "Domyeah Final Boss", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-domyeah-final-boss.mp3?updatedAt=1747151346799" },
            { title: "Unholy Insurgency", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-unholy-insurgency.mp3?updatedAt=1747151351583" },
            { title: "An Enigmatic Encounter (FDY Remastered)", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-an-enigmatic-encounter-fdy-remastered.mp3?updatedAt=1747151523125" },
            { title: "Threats Of The Ocean Floor", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-threats-of-the-ocean-floor.mp3?updatedAt=1747151527037" },
            { title: "Universal Collapse", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-universal-collapse.mp3?updatedAt=1747151531381" },
            { title: "Aura Of Glory", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/aura-of-glory.mp3?updatedAt=1747151550582" },
            { title: "Peacesong", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/peacesong.mp3?updatedAt=1747151539066" },
            { title: "Snail House Hot Milk", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/snail-house-hot-milk.mp3?updatedAt=1747151542443" },
            { title: "An Enigmatic Encounter", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-last-breath-sans.mp3?updatedAt=1747151546548" },
            { title: "Reality Perception", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/reality-perception.mp3?updatedAt=1747151554023" },
            { title: "Time Paradox Sans", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-time-paradox-sans.mp3?updatedAt=1747151558008" },
            { title: "Candyland", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-candyland.mp3?updatedAt=1747151561469" },
            { title: "Rage No 2 Reaper", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/rage-no-2-reaper.mp3?updatedAt=1747151725614" },
            { title: "Joyful Chess (Super Slowed)", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/joyful-chess-super-slowed.mp3?updatedAt=1747234121592" },
            { title: "Killstreak 500", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/killstreak-500.mp3?updatedAt=1747151573823" },
            { title: "Sunday In Bed", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/sunday-in-bed.mp3?updatedAt=1747151577328" },
            { title: "Crab Rave", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-crab-rave.mp3?updatedAt=1747151581197" },
            { title: "Dr Livesey Phonk", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/dr-livsey-phonk.mp3?updatedAt=1747151585081" },
            { title: "Lovely Bastard", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/lovely-bastard.mp3?updatedAt=1747151588672" },
            { title: "Dezire Burnout", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/dezire-burnout.mp3?updatedAt=1747151591982" },
            { title: "Blue Horizon (Ultra Slowed)", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/blue-horizion-ultra-slowed.mp3?updatedAt=1747151596123" },
            { title: "Vyrval - ❀H (Second Drop + Super Slowed)", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/vyrval%20-%20%E2%9C%BBH+(second%20drop%20+%20super%20slowed).mp3?updatedAt=1747157020792" },
            { title: "Passo Bem Sloto", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/passo-bem-sloto.mp3?updatedAt=1747151614296" },
            { title: "Undertale OST 080", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-undertale-OST-080.mp3?updatedAt=1747151610974" },
            { title: "Glitchtale OST True Love", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-glitchtale-ost-true-love.mp3?updatedAt=1747151607594" },
            { title: "JPN Amend", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/jpn-amend.mp3?updatedAt=1747151603012" },
            { title: "Cute Depressed", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/cute-depressed.mp3?updatedAt=1747151618812" },
            { title: "Blue Horizon (Slowed)", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/blue-horizion-slowed.mp3?updatedAt=1747151633639" },
            { title: "Montagem", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/montagem.mp3?updatedAt=1747151630278" },
            { title: "Nursery Phonk", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/nursery-phonk.mp3?updatedAt=1747151626695" },
            { title: "Doors Elevator Music", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/audioboard-doors-elevator-music.mp3?updatedAt=1747151637755" },
            { title: "Joyful Chess (Slowed)", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/joyful-chess-slowed.mp3?updatedAt=1747234161752" },
            { title: "Return To Slime", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/return-to-slime.mp3?updatedAt=1747151355606" },
            { title: "Harvest", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/harvest.mp3?updatedAt=1747400849909" },
            { title: "Doom Eternal", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/doom-eternal.mp3?updatedAt=1748347174996" },
            { title: "Automitov - Mangos", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/automitov-mangos.mp3?updatedAt=1748700948689" },
            { title: "Trap Royalty", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/trap-royalty.mp3?updatedAt=1748700948944" },
            { title: "Last Breath Sans Phase 3", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/last-breath-sans-phase-3.mp3?updatedAt=1749146538533" },
            { title: "Last Breath Sans Phase 6", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/last-breath-sans-phase-6.mp3?updatedAt=1749146538368" },
            { title: "Funk De Beleza (Slowed)", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/funk-de-beleza-slowed.mp3?updatedAt=1749230608767" },
            { title: "Interworld Rapture", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/interworld-rapture.mp3?updatedAt=1749230510873" },
            { title: "New Jersey Remix", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/new-jersey-remix.mp3?updatedAt=1749230623857" },
            { title: "Don't Stop", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/dont-stop.mp3?updatedAt=1751490971390" },
            { title: "Beast Fantasy", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/Beast%20Fantasy.mp3" },
            { title: "Wake Up!", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/wake-up.mp3?updatedAt=1752836409260" },
            { title: "Neon Blade", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/neon-blade.mp3" },
            { title: "Muder In My Mind", url: "https://ik.imagekit.io/ut3w2pq43i/AUDIO/muder-in-mind.mp3" },
        ],
        "Songs": [
            { title: "Skyfall", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/skyfall.mp3?updatedAt=1747151760064" },
            { title: "Touch Tone Telephone", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/audioboard-touch-tone-telephone.mp3?updatedAt=1747151764966" },
            { title: "2 Phut Hon", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/2-phut-hon.mp3?updatedAt=1747151768758" },
            { title: "Gangnam Style", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/gangam-style.mp3?updatedAt=1747151772839" },
            { title: "Dekho Na Dekho", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/dekho-na-dekho.mp3?updatedAt=1747151777337" },
            { title: "My Ordinary Life", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/my-ordinary-life.mp3?updatedAt=1747151781723" },
            { title: "Bloody Mary", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/bloody-marry.mp3?updatedAt=1747151785310" },
            { title: "NSYNC - Bye Bye Bye", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/nsync-bye-bye-bye.mp3?updatedAt=1747151789443" },
            { title: "Dusk Till Dawn", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/dusk-till-dawn.mp3?updatedAt=1747151793833" },
            { title: "Darkside", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/darkside.mp3?updatedAt=1747151797794" },
            { title: "Cradles", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/cradles.mp3?updatedAt=1747151801266" },
            { title: "Golden Hour", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/golden-hour.mp3?updatedAt=1747151805035" },
            { title: "House Of Memories", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/house-of-memories.mp3?updatedAt=1747151809195" },
            { title: "On And On And On", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/on-and-on-and-on.mp3?updatedAt=1747151812995" },
            { title: "Believer", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/believer.mp3?updatedAt=1747151816634" },
            { title: "Lovely", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/lovely.mp3?updatedAt=1747151820190" },
            { title: "Gas Gas Gas", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/audioboard-gas-gas-gas.mp3?updatedAt=1747151823643" },
            { title: "Wait A Minute", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/wait-a-minute.mp3?updatedAt=1747151827298" },
            { title: "Dancin", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/dancin.mp3?updatedAt=1747151835226" },
            { title: "It's Going Down Now", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/audioboard-its-going-down-now.mp3?updatedAt=1747151840027" },
            { title: "Bad Boy", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/bad-boy.mp3?updatedAt=1747151844989" },
            { title: "Middle Of The Night", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/audioboard-middle-of-the-night.mp3?updatedAt=1747151848617" },
            { title: "Fairytale", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/audioboard-fairytale.mp3?updatedAt=1747151852082" },
            { title: "Cupid", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/cupid.mp3?updatedAt=1747151855929" },
            { title: "Woman", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/woman.mp3?updatedAt=1747151859656" },
            { title: "Enemy", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/enemy.mp3?updatedAt=1747151863574" },
            { title: "All My Friends Are So Toxic", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/all-my-friends-are-so-toxic.mp3?updatedAt=1747151867544" },
            { title: "Worth Nothing", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/worth-nothing.mp3?updatedAt=1747151871062" },
            { title: "Montero", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/montero.mp3?updatedAt=1747151874330" },
            { title: "Honey Pie", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/honey-pie.mp3?updatedAt=1747151878061" },
            { title: "Wildside (Anime)", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/wildeside-anime.mp3?updatedAt=1747151881452" },
            { title: "Wildside (Anime, Extended)", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/wildside-extended-version.mp3" },
            { title: "Apt Apt", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/apt-apt.mp3?updatedAt=1747234063283" },
            { title: "Beggin", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/beggin.mp3?updatedAt=1747400310605" },
            { title: "The Search", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/the-search.mp3?updatedAt=1747400307177" },
            { title: "Alibi", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/alibi.mp3?updatedAt=1747401397114" },
            { title: "33 Max Verstappen", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/max-versteppen.mp3?updatedAt=1748347497351" },
            { title: "Khariyat Poochon", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/khariyat.mp3?updatedAt=1748347497898" },
            { title: "If We Being Real", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/if-we-being-real.mp3?updatedAt=1748347496854" },
            { title: "As The World Caves In", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/as-the-world-caves-in.mp3?updatedAt=1748701085716" },
            { title: "Blame It On The Kids", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/blame-it-on-the-kids.mp3?updatedAt=1748701086313" },
            { title: "Discord", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/discord.mp3?updatedAt=1748701086515" },
            { title: "Dil Wale Puch Ne Cha", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/dil-wale-puch-ne-cha.mp3?updatedAt=1748701086390" },
            { title: "Notion", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/notion.mp3?updatedAt=1748701086469" },
            { title: "California Gurls", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/california-gurls.mp3?updatedAt=1748701086775" },
            { title: "Love Story", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/love-story.mp3?updatedAt=1748701086735" },
            { title: "Sans Frisk Chara Trio", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/sans-frisk-chara-trio.mp3?updatedAt=1748701086950" },
            { title: "Moonlight", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/moonlight.mp3?updatedAt=1749230708818" },
            { title: "Metro Boomin", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/metro-boomin.mp3?updatedAt=1750627204558" },
            { title: "Meet The Frownies", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/meet-the-frownies.mp3" },
            { title: "INTASAMKA", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/intasamka.mp3"},
            { title: "Die With A Smile", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/die-with-a-smile.mp3"},
            { title: "Pasoori", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/pasoori.mp3"},
            { title: "Dance Monkey", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/dance-monkey.mp3"},
            { title: "Can You Feel My Heart", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/can-you-hear-the-silence.mp3"},
            { title: "Me Or The Ps5", url: "https://ik.imagekit.io/ut3w2pq43i/SONG/ps5.mp3"},
        ]
    };

    let flatAudioList = []; // This will be our primary list for playback logic

    const themes = ["default", "theme-blue", "theme-green", "theme-peach"];
    let currentThemeIndex = 0;

    let currentTrackIndex = -1; // Index in flatAudioList
    let isPlaying = false;
    let backgroundPlayEnabled = false;
    let isBlackScreenLocked = false;
    let tapCount = 0;
    let tapTimeout = null;


    // --- Helper to create a flat list from the categorized data ---
    function initializeFlatAudioList() {
        flatAudioList = [];
        let globalIdx = 0;
        for (const categoryName in audioLibraryData) {
            if (audioLibraryData.hasOwnProperty(categoryName)) {
                audioLibraryData[categoryName].forEach(track => {
                    flatAudioList.push({
                        ...track, // Contains title, url
                        category: categoryName,
                        originalIndexInFlatList: globalIdx++
                    });
                });
            }
        }
    }


    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // --- UI Rendering ---
    function renderLibrary() {
        audioLibraryContainer.innerHTML = '';
        let globalTrackRenderIndex = 0;

        for (const categoryName in audioLibraryData) {
            if (audioLibraryData.hasOwnProperty(categoryName)) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category';
                const categoryTitle = document.createElement('h2');
                categoryTitle.textContent = categoryName;
                categoryDiv.appendChild(categoryTitle);

                audioLibraryData[categoryName].forEach(trackInCategory => {
                    const trackItem = document.createElement('div');
                    trackItem.className = 'track-item';
                    trackItem.dataset.index = globalTrackRenderIndex; // This index maps to flatAudioList

                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'track-title';
                    titleSpan.textContent = trackInCategory.title;

                    const trackInfoDiv = document.createElement('div');
                    trackInfoDiv.appendChild(titleSpan);
                    // Artist info is not in the new data, so we don't display it in the list

                    trackItem.appendChild(trackInfoDiv);

                    const currentIndexForListener = globalTrackRenderIndex;
                    trackItem.addEventListener('click', () => loadTrack(currentIndexForListener));

                    categoryDiv.appendChild(trackItem);
                    globalTrackRenderIndex++;
                });
                audioLibraryContainer.appendChild(categoryDiv);
            }
        }
        updatePlayingIndicator();
    }

    // --- Audio Control ---
    function loadTrack(index, playImmediately = true) {
        if (index >= 0 && index < flatAudioList.length) {
            currentTrackIndex = index;
            const track = flatAudioList[index]; // Get track from the flat list
            audioPlayer.src = track.url;        // Use .url property
            audioPlayer.load();

            npTitle.textContent = track.title;
            npArtist.textContent = "";          // No artist info in the new data
            bsTrackTitle.textContent = track.title;

            if (playImmediately) {
                playAudio();
            } else {
                updatePlayPauseButtons();
            }
            updatePlayingIndicator();
            saveState();
        }
    }

    function playAudio() {
        audioPlayer.play().then(() => {
            isPlaying = true;
            updatePlayPauseButtons();
            if (!blackScreenMode.style.display || blackScreenMode.style.display === 'none') {
                showBlackScreenMode();
            }
        }).catch(error => {
            console.error("Error playing audio:", error);
            isPlaying = false;
            updatePlayPauseButtons();
        });
    }

    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        updatePlayPauseButtons();
    }

    function togglePlayPause() {
        if (currentTrackIndex === -1 && flatAudioList.length > 0) {
            loadTrack(0); // Load first track if none selected
        } else if (currentTrackIndex !== -1) {
            if (isPlaying) {
                pauseAudio();
            } else {
                playAudio();
            }
        }
    }

    function playNext() {
        if (flatAudioList.length === 0) return;
        let newIndex = (currentTrackIndex + 1) % flatAudioList.length;
        if (currentTrackIndex === -1 && flatAudioList.length > 0) newIndex = 0;
        loadTrack(newIndex);
    }

    function playPrev() {
        if (flatAudioList.length === 0) return;
        let newIndex = (currentTrackIndex - 1 + flatAudioList.length) % flatAudioList.length;
         if (currentTrackIndex === -1 && flatAudioList.length > 0) newIndex = flatAudioList.length -1;
        loadTrack(newIndex);
    }

    function restartAudio() {
        if (currentTrackIndex !== -1) {
            audioPlayer.currentTime = 0;
            if (!isPlaying) playAudio();
        }
    }

    function updatePlayPauseButtons() {
        const playIcon = '<i class="fas fa-play"></i>';
        const pauseIcon = '<i class="fas fa-pause"></i>';
        playPauseBtn.innerHTML = isPlaying ? pauseIcon : playIcon;
        bsPlayPauseBtn.innerHTML = isPlaying ? pauseIcon : playIcon;
        playPauseBtn.title = isPlaying ? "Pause" : "Play";
        bsPlayPauseBtn.title = isPlaying ? "Pause" : "Play";
    }

    function updatePlayingIndicator() {
        document.querySelectorAll('.track-item').forEach(item => {
            item.classList.remove('playing');
            if (parseInt(item.dataset.index) === currentTrackIndex) {
                item.classList.add('playing');
            }
        });
    }

    // --- Progress & Time ---
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    audioPlayer.addEventListener('loadedmetadata', () => {
        const duration = audioPlayer.duration;
        progressBar.max = duration;
        bsProgressBar.max = duration;
        totalTimeDisplay.textContent = formatTime(duration);
        bsTotalTime.textContent = formatTime(duration);
    });

    audioPlayer.addEventListener('timeupdate', () => {
        const currentTime = audioPlayer.currentTime;
        progressBar.value = currentTime;
        bsProgressBar.value = currentTime;
        currentTimeDisplay.textContent = formatTime(currentTime);
        bsCurrentTime.textContent = formatTime(currentTime);
        saveState();
    });

    audioPlayer.addEventListener('ended', () => {
        playNext();
    });

    function seek(barElement) {
        audioPlayer.currentTime = barElement.value;
    }
    progressBar.addEventListener('input', () => seek(progressBar));
    bsProgressBar.addEventListener('input', () => seek(bsProgressBar));

    // --- Volume Control ---
    volumeBar.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value;
    });

    // --- Theming ---
    function applyTheme(themeName) {
        document.body.className = '';
        if (themeName !== "default") {
            document.body.classList.add(themeName);
        }
        localStorage.setItem('softieAxinTheme', themeName);
    }

    function cycleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme(themes[currentThemeIndex]);
    }

    // --- Black Screen Focus Mode ---
    function showBlackScreenMode() {
        if(currentTrackIndex === -1) return;
        blackScreenMode.style.display = 'flex';
        bsProgressBar.value = audioPlayer.currentTime;
        bsCurrentTime.textContent = formatTime(audioPlayer.currentTime);
        bsTotalTime.textContent = formatTime(audioPlayer.duration || 0);
        updatePlayPauseButtons();
    }

    function hideBlackScreenMode() {
        if (isBlackScreenLocked) return;
        blackScreenMode.style.display = 'none';
        pauseAudio(); // Pause the audio when exiting focus mode
    }

    function toggleLockScreen() {
        isBlackScreenLocked = !isBlackScreenLocked;
        bsLockBtn.innerHTML = isBlackScreenLocked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-unlock"></i>';
        bsLockBtn.title = isBlackScreenLocked ? "Unlock Screen" : "Lock Screen";
        blackScreenMode.classList.toggle('locked', isBlackScreenLocked);
    }

    blackScreenMode.addEventListener('click', (e) => {
        if (e.target.closest('.bs-content') && !e.target.closest('.focus-mode-toggle')) {
            // Click inside content, not on exit button
        } else if (e.target.closest('.focus-mode-toggle')) {
            if (!isBlackScreenLocked) hideBlackScreenMode();
        } else {
            if (isBlackScreenLocked) return;
            tapCount++;
            if (tapTimeout) clearTimeout(tapTimeout);
            if (tapCount >= 4) {
                hideBlackScreenMode();
                tapCount = 0;
            } else {
                tapTimeout = setTimeout(() => { tapCount = 0; }, 500);
            }
        }
    });
    
    nowPlayingBar.addEventListener('dblclick', (e) => {
        if (!e.target.closest('button, input[type="range"]')) {
            showBlackScreenMode();
        }
    });

    // --- Offline Caching ("Cache All") ---
    cacheAllBtn.addEventListener('click', async () => {
        if (!('caches' in window)) {
            alert('Caching API not supported.');
            return;
        }
        cacheAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caching...';
        cacheAllBtn.disabled = true;

        try {
            if (navigator.serviceWorker.controller) {
                const audioUrlsToCache = flatAudioList.map(track => track.url); // Use flatAudioList
                navigator.serviceWorker.controller.postMessage({
                    type: 'CACHE_AUDIO_FILES',
                    urls: audioUrlsToCache
                });
                navigator.serviceWorker.addEventListener('message', function onCacheMessage(event) {
                    if (event.data.type === 'AUDIO_CACHING_COMPLETE') {
                        alert(`Audio caching complete! ${event.data.successCount} successful, ${event.data.failCount} failed.`);
                        cacheAllBtn.innerHTML = '<i class="fas fa-database"></i> Cache All';
                        cacheAllBtn.disabled = false;
                        navigator.serviceWorker.removeEventListener('message', onCacheMessage); // Clean up listener
                    }
                });
            } else {
                alert("Service worker not active. Please reload or try again.");
                cacheAllBtn.innerHTML = '<i class="fas fa-database"></i> Cache All';
                cacheAllBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error triggering audio caching:', error);
            alert('Error during caching. Check console.');
            cacheAllBtn.innerHTML = '<i class="fas fa-database"></i> Cache All';
            cacheAllBtn.disabled = false;
        }
    });

    // --- Background Play Toggle ---
    backgroundPlayToggle.addEventListener('change', (e) => {
        backgroundPlayEnabled = e.target.checked;
        localStorage.setItem('softieAxinBgPlay', backgroundPlayEnabled);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !backgroundPlayEnabled && isPlaying) {
            pauseAudio();
        }
    });

    // --- State Persistence (localStorage) ---
    function saveState() {
        if (currentTrackIndex === -1) return;
        const state = {
            currentTrackIndex: currentTrackIndex, // Index in flatAudioList
            currentTime: audioPlayer.currentTime,
            volume: audioPlayer.volume
        };
        localStorage.setItem('softieAxinState', JSON.stringify(state));
    }

    function loadState() {
        const savedTheme = localStorage.getItem('softieAxinTheme');
        if (savedTheme && themes.includes(savedTheme)) {
            currentThemeIndex = themes.indexOf(savedTheme);
            applyTheme(savedTheme);
        } else {
            applyTheme(themes[0]);
        }

        const savedBgPlay = localStorage.getItem('softieAxinBgPlay');
        if (savedBgPlay !== null) {
            backgroundPlayEnabled = JSON.parse(savedBgPlay);
            backgroundPlayToggle.checked = backgroundPlayEnabled;
        }

        const savedState = localStorage.getItem('softieAxinState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                // Ensure flatAudioList is populated before using its length or accessing tracks
                if (state.currentTrackIndex !== undefined && state.currentTrackIndex < flatAudioList.length) {
                    loadTrack(state.currentTrackIndex, false);
                    if (state.currentTime) {
                        const setTime = () => {
                            audioPlayer.currentTime = state.currentTime;
                            if (audioPlayer.onloadedmetadata === setTime) { // Remove self if it was set
                                audioPlayer.onloadedmetadata = null;
                            }
                            totalTimeDisplay.textContent = formatTime(audioPlayer.duration);
                            bsTotalTime.textContent = formatTime(audioPlayer.duration);
                            currentTimeDisplay.textContent = formatTime(state.currentTime);
                            bsCurrentTime.textContent = formatTime(state.currentTime);
                            progressBar.value = state.currentTime;
                            bsProgressBar.value = state.currentTime;
                        };

                        if (audioPlayer.readyState >= 1) { // HAVE_METADATA or more
                           setTime();
                        } else {
                           audioPlayer.onloadedmetadata = setTime;
                        }
                    }
                    if (state.volume !== undefined) {
                        audioPlayer.volume = state.volume;
                        volumeBar.value = state.volume;
                    }
                }
            } catch (e) {
                console.error("Error loading state:", e);
                localStorage.removeItem('softieAxinState');
            }
        } else {
            audioPlayer.volume = volumeBar.value;
        }
    }

    // --- Event Listeners ---
    playPauseBtn.addEventListener('click', togglePlayPause);
    bsPlayPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);
    restartBtn.addEventListener('click', restartAudio);
    bsRestartBtn.addEventListener('click', restartAudio);
    bsLockBtn.addEventListener('click', toggleLockScreen);
    themeSwitcherBtn.addEventListener('click', cycleTheme);

    // Initial Setup
    initializeFlatAudioList(); // IMPORTANT: Create the flat list first
    renderLibrary();
    loadState(); // Load last state after library is rendered and flat list is ready
    updatePlayPauseButtons();

});