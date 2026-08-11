// ==========================================
// TRACK DATA 
// ==========================================
const booksData = {
    book1: {
        title: "Nuovo Espresso 1",
        folder: "audio/book1/",
        totalTracks: 68 // <--- Set for 68 tracks
    },
    book2: {
        title: "Nuovo Espresso 2",
        folder: "audio/book2/",
        totalTracks: 45
    }
};

let currentTrackList = []; // Keeps track of all loaded tracks
let currentPlayingIndex = -1; // Knows which track number is currently playing

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

// --- LOAD TRACK LIST ---

function loadTracks(bookKey) {
    const book = booksData[bookKey];
    trackList.innerHTML = '';
    playlistTitle.textContent = book.title;
    trackCount.textContent = book.totalTracks;
    
    currentTrackList = []; // reset internal list

    for (let i = 1; i <= book.totalTracks; i++) {
        const li = document.createElement('li');
        
        const trackNumberFormatted = String(i).padStart(2, '0');
        const fileName = `T_${trackNumberFormatted}.mp3`; 
        const trackTitle = `Track ${trackNumberFormatted}`;
        const trackSrc = `${book.folder}${fileName}`;

        // Save into our internal array so Next/Prev buttons know what to play
        currentTrackList.push({
            index: i - 1,
            title: trackTitle,
            fileName: fileName,
            src: trackSrc
        });
        
        // Build the Row structure
        li.innerHTML = `
            <div class="col-num">${i}</div>
            <div class="col-title">${trackTitle}</div>
            <div class="col-file">${fileName}</div>
        `;
        
        li.dataset.index = i - 1;

        li.addEventListener('click', function() {
            playTrack(parseInt(this.dataset.index));
        });

        trackList.appendChild(li);
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
    updatePlayPauseUI(true);
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
        updatePlayPauseUI(true);
    } else {
        audioPlayer.pause();
        updatePlayPauseUI(false);
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

// Seek Bar Updates
audioPlayer.addEventListener('timeupdate', () => {
    seekBar.value = audioPlayer.currentTime;
    currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener('loadedmetadata', () => {
    seekBar.max = audioPlayer.duration;
    totalTimeDisplay.textContent = formatTime(audioPlayer.duration);
});

seekBar.addEventListener('input', () => {
    audioPlayer.currentTime = seekBar.value;
});

// Volume Controls
volumeBar.addEventListener('input', () => {
    audioPlayer.volume = volumeBar.value;
    audioPlayer.muted = false;
});

muteBtn.addEventListener('click', () => {
    audioPlayer.muted = !audioPlayer.muted;
    if (audioPlayer.muted) {
        volumeBar.value = 0;
    } else {
        volumeBar.value = audioPlayer.volume || 1;
    }
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

// Init on first load
loadTracks('book1');
audioPlayer.volume = 1;