// ==========================================
// TRACK DATA 
// ==========================================
const booksData = {
    book1: {
        title: "Nuovo Espresso 1",
        folder: "audio/book1/"
    },
    book2: {
        title: "Nuovo Espresso 2",
        folder: "audio/book2/"
    }
};

let currentTrackList = []; // Keeps track of all loaded tracks
let currentPlayingIndex = -1; // Knows which track number is currently playing

// --- LOCAL STORAGE ---
const STORAGE_KEYS = {
    PLAYER_SETTINGS: 'espressoPlayer_settings'
};


// DOM Elements
const bookSelect = document.getElementById('book-select');
const trackList = document.getElementById('track-list');
const audioPlayer = document.getElementById('audio-player');
const playlistTitle = document.getElementById('playlist-title');
const trackCount = document.getElementById('track-count');

// Bottom Player UI
const npCover = document.getElementById('np-cover');
const npTitle = document.getElementById('np-title');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seekBar = document.getElementById('seek-bar');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');
const volumeBar = document.getElementById('volume-bar');
const muteBtn = document.getElementById('mute-btn');
const speedBtn = document.getElementById('speed-btn');
const muteIcon = muteBtn.querySelector('svg'); // Get the SVG icon inside the mute button
let lastVolume = 1; // To remember volume before mute

const playbackSpeeds = [0.75, 1, 1.25, 1.5, 1.75, 2];
let currentSpeedIndex = 1; // Corresponds to 1x speed

// --- LOAD TRACK LIST ---

async function loadTracks(bookKey) {
    const book = booksData[bookKey];
    trackList.innerHTML = '';
    playlistTitle.textContent = book.title;
    currentTrackList = []; // reset internal list

    try {
        const response = await fetch(`${book.folder}manifest.json`);
        if (!response.ok) {
            throw new Error(`Manifest not found for ${book.title}. Please create a 'manifest.json' file in the '${book.folder}' directory.`);
        }
        const trackFiles = await response.json();

        trackCount.textContent = trackFiles.length;
    
        trackFiles.forEach((fileName, index) => {
            const li = document.createElement('li');
            
            const trackTitle = `Track ${String(index + 1).padStart(2, '0')}`;
            const trackSrc = `${book.folder}${fileName}`;

            // Save into our internal array so Next/Prev buttons know what to play
            currentTrackList.push({
                index: index,
                title: trackTitle,
                fileName: fileName,
                src: trackSrc
            });
            
            // Build the Row structure
            li.innerHTML = `
                <div class="col-num">${index + 1}</div>
                <div class="col-title">${trackTitle}</div>
                <div class="col-file">${fileName}</div>
            `;
            
            li.dataset.index = index;

            li.addEventListener('click', function() {
                playTrack(parseInt(this.dataset.index));
            });

            trackList.appendChild(li);
        });
    } catch (error) {
        console.error(error);
        let displayMessage = error.message;
        if (bookKey === 'book2' && error.message.includes("Manifest not found")) {
            displayMessage = `${book.title} is not yet available.`;
        }
        trackList.innerHTML = `<li style="color: #ff4d4d; background: rgba(255,0,0,0.1);">${displayMessage}</li>`;
        trackCount.textContent = 0;
    }
}

// --- PLAYBACK LOGIC ---

function playTrack(index) {
    if (index < 0 || index >= currentTrackList.length) return;
    
    currentPlayingIndex = index;
    const trackData = currentTrackList[index];

    // Remove active class from all rows
    const allRows = trackList.querySelectorAll('li');
    allRows.forEach(row => row.classList.remove('active-track'));
    
    // Add active class to current row
    allRows[index].classList.add('active-track');

    // Update Player UI
    audioPlayer.src = trackData.src;
    npTitle.textContent = trackData.title;
    npCover.style.opacity = 1; // Reveal the cover art thumbnail
    
    audioPlayer.play();
}

// Format seconds to M:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updatePlayPauseUI(isPlaying) {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

function updateRangeFill(input) {
    const progress = (input.value / input.max) * 100;
    input.style.setProperty('--progress-percent', `${progress}%`);
}


// --- EVENT LISTENERS ---

// Play/Pause
playPauseBtn.addEventListener('click', () => {
    if (audioPlayer.src === "" || currentPlayingIndex === -1) {
        // If nothing is playing, play track 1
        playTrack(0);
        return; 
    }
    
    if (audioPlayer.paused) {
        audioPlayer.play();
    } else {
        audioPlayer.pause();
    }
});

// Next Button
nextBtn.addEventListener('click', () => {
    playTrack(currentPlayingIndex + 1);
});

// Previous Button
prevBtn.addEventListener('click', () => {
    // If we are more than 3 seconds in, restart the song. Otherwise, go to previous song.
    if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
    } else {
        playTrack(currentPlayingIndex - 1);
    }
});

// Auto-play Next Song when current one finishes
audioPlayer.addEventListener('ended', () => {
    playTrack(currentPlayingIndex + 1);
});

// Update UI based on actual audio events
audioPlayer.addEventListener('play', () => updatePlayPauseUI(true));
audioPlayer.addEventListener('pause', () => updatePlayPauseUI(false));

// Handle cases where an audio file might be missing
audioPlayer.addEventListener('error', () => {
    console.error(`Failed to load track: ${audioPlayer.currentSrc}`);
    nextBtn.click(); // Attempt to play the next track automatically
});

// Seek Bar Updates
audioPlayer.addEventListener('timeupdate', () => {
    seekBar.value = audioPlayer.currentTime;
    updateRangeFill(seekBar);
    currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener('loadedmetadata', () => {
    seekBar.max = audioPlayer.duration;
    updateRangeFill(seekBar);
    totalTimeDisplay.textContent = formatTime(audioPlayer.duration);
});

seekBar.addEventListener('input', () => {
    audioPlayer.currentTime = seekBar.value;
    updateRangeFill(seekBar);
});

// Volume Controls
volumeBar.addEventListener('input', () => {
    lastVolume = volumeBar.value;
    audioPlayer.volume = volumeBar.value;
    audioPlayer.muted = false;
    updateRangeFill(volumeBar);
});

muteBtn.addEventListener('click', () => {
    audioPlayer.muted = !audioPlayer.muted;
});

audioPlayer.addEventListener('volumechange', () => {
    // Update UI based on volume changes, including mute
    volumeBar.value = audioPlayer.muted ? 0 : audioPlayer.volume;
    updateRangeFill(volumeBar);
    muteIcon.style.fill = audioPlayer.muted || audioPlayer.volume === 0 ? 'var(--brand-green)' : 'currentColor';
    if (!audioPlayer.muted) {
        lastVolume = audioPlayer.volume;
    }
    saveSettings();
});

// Playback Speed Control
speedBtn.addEventListener('click', () => {
    // Cycle to the next speed
    currentSpeedIndex = (currentSpeedIndex + 1) % playbackSpeeds.length;
    const newSpeed = playbackSpeeds[currentSpeedIndex];
    
    audioPlayer.playbackRate = newSpeed;
    speedBtn.textContent = `${newSpeed}x`;
    
    saveSettings();
});

// Handle Book Change via Dropdown
bookSelect.addEventListener('change', (e) => {
    loadTracks(e.target.value);
    audioPlayer.pause();
    updatePlayPauseUI(false);
    npTitle.textContent = "Select a track";
    npCover.style.opacity = 0;
    currentPlayingIndex = -1;
    seekBar.value = 0;
    currentTimeDisplay.textContent = "0:00";
    totalTimeDisplay.textContent = "0:00";
});

// --- PERSISTENCE (LOCAL STORAGE) ---

function saveSettings() {
    const settings = {
        volume: audioPlayer.volume,
        muted: audioPlayer.muted,
        speed: audioPlayer.playbackRate
    };
    localStorage.setItem(STORAGE_KEYS.PLAYER_SETTINGS, JSON.stringify(settings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.PLAYER_SETTINGS);
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Restore Volume and Mute state
        audioPlayer.volume = settings.volume ?? 1;
        audioPlayer.muted = settings.muted ?? false;

        // Restore Playback Speed
        const savedSpeed = settings.speed ?? 1;
        currentSpeedIndex = playbackSpeeds.indexOf(savedSpeed);
        if (currentSpeedIndex === -1) currentSpeedIndex = 1; // Default to 1x if not found
        
        audioPlayer.playbackRate = playbackSpeeds[currentSpeedIndex];
        speedBtn.textContent = `${playbackSpeeds[currentSpeedIndex]}x`;
    }
    updateRangeFill(volumeBar);
    updateRangeFill(seekBar);
}

// Init on first load
loadTracks('book1');
loadSettings(); // Load user settings from previous session