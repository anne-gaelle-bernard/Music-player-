
// ARCHITECTURE MVC AMÉLIORÉE

// MODEL - Gestion des données et état
class MusicModel {
  constructor() {
    this.tracks = [];
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.isShuffling = false;
    this.repeatMode = 0; // 0: off, 1: all, 2: single
    this.volume = 0.5;
    this.currentTime = 0;
    this.duration = 0;
    this.observers = new Set();
  }
  
  // Observer Pattern
  subscribe(observer) {
    this.observers.add(observer);
  }
  
  unsubscribe(observer) {
    this.observers.delete(observer);
  }
  
  notify(event, data) {
    this.observers.forEach(observer => {
      if (typeof observer[event] === 'function') {
        observer[event](data);
      }
    });
  }
  
  // Data Management
  setTracks(tracks) {
    this.tracks = tracks;
    this.notify('tracksUpdated', this.tracks);
  }
  
  getCurrentTrack() {
    return this.tracks[this.currentTrackIndex];
  }
  
  setCurrentTrack(index) {
    if (index >= 0 && index < this.tracks.length) {
      this.currentTrackIndex = index;
      this.notify('currentTrackChanged', this.getCurrentTrack());
    }
  }
  
  // Playback State
  setPlayState(playing) {
    this.isPlaying = playing;
    this.notify('playStateChanged', this.isPlaying);
  }
  
  setTimeProgress(current, total) {
    this.currentTime = current;
    this.duration = total;
    this.notify('timeUpdated', { current, total });
  }
  
  // Controls
  toggleShuffle() {
    this.isShuffling = !this.isShuffling;
    this.notify('shuffleChanged', this.isShuffling);
  }
  
  cycleRepeat() {
    this.repeatMode = (this.repeatMode + 1) % 3;
    this.notify('repeatChanged', this.repeatMode);
  }
  
  setVolume(volume) {
    this.volume = volume / 100;
    this.notify('volumeChanged', { volume: this.volume, percentage: volume });
  }
}

// VIEW - Interface utilisateur
class MusicView {
  constructor() {
    this.initElements();
    this.setupVisualizer();
    this.isCurrentlyPlaying = false;
  }
  
  initElements() {
    // Audio & Media
    this.audio = document.getElementById('audioPlayer');
    this.albumArt = document.getElementById('albumArt');
    this.vinylDisc = document.getElementById('vinylDisc');
    this.trackTitle = document.getElementById('trackTitle');
    this.trackArtist = document.getElementById('trackArtist');
    
    // Controls
    this.playBtn = document.getElementById('playBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.previousBtn = document.getElementById('previousBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.repeatBtn = document.getElementById('repeatBtn');
    
    // Progress
    this.progressTrack = document.getElementById('progressTrack');
    this.progressFill = document.getElementById('progressFill');
    this.currentTime = document.getElementById('currentTime');
    this.totalDuration = document.getElementById('totalDuration');
    
    // Volume
    this.volumeControl = document.getElementById('volumeControl');
    this.volumeDisplay = document.getElementById('volumeDisplay');
    
    // Search
    this.searchInput = document.getElementById('searchInput');
    this.searchButton = document.getElementById('searchButton');
    
    // Playlist
    this.playlistContent = document.getElementById('playlistContent');
    
    // Visual Effects
    this.musicPlayer = document.getElementById('musicPlayer');
    this.colorOverlay = document.getElementById('colorOverlay');
  }
  
  setupVisualizer() {
    this.visualizerBars = document.querySelectorAll('.visualizer-bar');
    this.startVisualizer();
  }
  
  startVisualizer() {
    setInterval(() => {
      this.visualizerBars.forEach((bar, index) => {
        const height = this.isCurrentlyPlaying ? 
          Math.random() * 35 + 5 : 
          4;
        bar.style.height = height + 'px';
        
        // Staggered animation
        bar.style.animationDelay = (index * 0.1) + 's';
      });
    }, 200);
  }
  
  // UI Updates
  updateTrackDisplay(track) {
    if (!track) return;
    
    this.trackTitle.textContent = track.title;
    this.trackArtist.textContent = track.artist;
    
    // Album art
    if (track.cover) {
      this.albumArt.style.backgroundImage = `url('${track.cover}')`;
      this.updateColorScheme(track.cover);
    } else {
      this.albumArt.style.backgroundImage = '';
    }
    
    // Audio source
    this.audio.src = track.src;
    
    // Visual feedback
    this.musicPlayer.classList.add('bounce-effect');
    setTimeout(() => this.musicPlayer.classList.remove('bounce-effect'), 800);
  }
  
  updateColorScheme(imageUrl) {
    if (!imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { r, g, b } = this.extractDominantColor(imageData.data);
        
        this.colorOverlay.style.background = `
          linear-gradient(135deg, 
            rgb(${r}, ${g}, ${b}) 0%, 
            rgb(${Math.max(0, r-60)}, ${Math.max(0, g-60)}, ${Math.max(0, b-60)}) 100%
          )
        `;
      } catch (e) {
        console.log('Color extraction failed');
      }
    };
    img.src = imageUrl;
  }
  
  extractDominantColor(data) {
    let r = 0, g = 0, b = 0;
    const sampleSize = Math.min(2000, data.length / 4);
    
    for (let i = 0; i < sampleSize * 4; i += 16) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    
    return {
      r: Math.floor(r / sampleSize),
      g: Math.floor(g / sampleSize),
      b: Math.floor(b / sampleSize)
    };
  }
  
  updatePlayButton(isPlaying) {
    this.isCurrentlyPlaying = isPlaying;
    this.playBtn.textContent = isPlaying ? '⏸' : '▶';
    this.vinylDisc.classList.toggle('spinning', isPlaying);
    this.musicPlayer.classList.toggle('playing', isPlaying);
  }
  
  updateProgress(current, total) {
    if (!total) return;
    
    const percentage = (current / total) * 100;
    this.progressFill.style.width = percentage + '%';
    this.currentTime.textContent = this.formatTime(current);
  }
  
  updateDuration(duration) {
    this.totalDuration.textContent = this.formatTime(duration);
  }
  
  updateShuffleState(isShuffling) {
    this.shuffleBtn.style.background = isShuffling ? 
      'rgba(99, 102, 241, 0.5)' : 
      'rgba(255, 255, 255, 0.1)';
    this.shuffleBtn.style.color = isShuffling ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
  }
  
  updateRepeatState(mode) {
    const backgrounds = [
      'rgba(255, 255, 255, 0.1)',
      'rgba(99, 102, 241, 0.5)',
      'rgba(236, 72, 153, 0.5)'
    ];
    const icons = ['🔁', '🔁', '🔂'];
    
    this.repeatBtn.style.background = backgrounds[mode];
    this.repeatBtn.textContent = icons[mode];
  }
  
  updateVolume(volume, percentage) {
    this.audio.volume = volume;
    this.volumeDisplay.textContent = Math.round(percentage) + '%';
  }
  
  renderPlaylist(tracks, currentIndex) {
    this.playlistContent.innerHTML = '';
    
    tracks.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = `playlist-item fade-in ${index === currentIndex ? 'current' : ''}`;
      
      item.innerHTML = `
        <img src="${track.cover || '/api/placeholder/50/50'}" alt="Album" 
             onerror="this.src='/api/placeholder/50/50'">
        <div class="playlist-item-details">
          <div class="playlist-item-name">${track.title}</div>
          <div class="playlist-item-performer">${track.artist}</div>
        </div>
        <div class="playlist-item-time">${this.formatTime(track.duration)}</div>
      `;
      
      item.onclick = () => {
        if (this.onTrackSelect) {
          this.onTrackSelect(index);
        }
      };
      
      this.playlistContent.appendChild(item);
      
      // Staggered animation
      setTimeout(() => item.classList.add('fade-in'), index * 30);
    });
  }
  
  showErrorMessage(message) {
    const existing = document.querySelector('.error-notification');
    if (existing) existing.remove();
    
    const error = document.createElement('div');
    error.className = 'error-notification';
    error.textContent = message;
    
    document.querySelector('.search-section').appendChild(error);
    
    setTimeout(() => {
      if (error.parentNode) error.remove();
    }, 5000);
  }
  
  setSearchLoading(loading) {
    this.searchButton.textContent = loading ? 'Recherche...' : 'Rechercher';
    this.searchButton.classList.toggle('loading-state', loading);
    this.searchInput.disabled = loading;
  }
  
  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// CONTROLLER - Logique de l'application
class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.shuffledIndices = [];
    
    this.initialize();
  }
  
  initialize() {
    // Subscribe to model changes
    this.model.subscribe(this);
    
    // Bind events
    this.bindEvents();
    
    // Initialize audio
    this.setupAudio();
    
    // Set initial volume
    this.view.audio.volume = this.model.volume;
  }
  
  bindEvents() {
    // Playback controls
    this.view.playBtn.onclick = () => this.togglePlayback();
    this.view.nextBtn.onclick = () => this.playNext();
    this.view.previousBtn.onclick = () => this.playPrevious();
    this.view.shuffleBtn.onclick = () => this.model.toggleShuffle();
    this.view.repeatBtn.onclick = () => this.model.cycleRepeat();
    
    // Progress control
    this.view.progressTrack.onclick = (e) => this.seekToPosition(e);
    
    // Volume control
    this.view.volumeControl.oninput = (e) => this.model.setVolume(e.target.value);
    
    // Search
    this.view.searchButton.onclick = () => this.performSearch();
    this.view.searchInput.onkeyup = (e) => {
      if (e.key === 'Enter') this.performSearch();
    };
    
    // Genre shortcuts
    document.querySelectorAll('.genre-tag').forEach(tag => {
      tag.onclick = () => this.searchByGenre(tag.dataset.genre);
    });
    
    // Playlist interaction
    this.view.onTrackSelect = (index) => {
      this.model.setCurrentTrack(index);
      this.loadCurrentTrack();
    };
  }
  
  setupAudio() {
    const audio = this.view.audio;
    
    audio.ontimeupdate = () => {
      this.model.setTimeProgress(audio.currentTime, audio.duration);
    };
    
    audio.onloadedmetadata = () => {
      this.view.updateDuration(audio.duration);
    };
    
    audio.onended = () => this.handleTrackEnd();
    audio.onplay = () => this.model.setPlayState(true);
    audio.onpause = () => this.model.setPlayState(false);
    
    audio.onerror = () => {
      this.view.showErrorMessage('Erreur de lecture. Essayez une autre chanson.');
    };
  }
  
  // Model Observer Methods
  tracksUpdated(tracks) {
    this.view.renderPlaylist(tracks, this.model.currentTrackIndex);
    this.generateShuffledOrder();
  }
  
  currentTrackChanged(track) {
    this.view.updateTrackDisplay(track);
    this.view.renderPlaylist(this.model.tracks, this.model.currentTrackIndex);
  }
  
  playStateChanged(isPlaying) {
    this.view.updatePlayButton(isPlaying);
  }
  
  timeUpdated({ current, total }) {
    this.view.updateProgress(current, total);
  }
  
  shuffleChanged(isShuffling) {
    this.view.updateShuffleState(isShuffling);
    if (isShuffling) {
      this.generateShuffledOrder();
    }
  }
  
  repeatChanged(mode) {
    this.view.updateRepeatState(mode);
  }
  
  volumeChanged({ volume, percentage }) {
    this.view.updateVolume(volume, percentage);
  }
  
  // Core Functionality
  async performSearch() {
    const query = this.view.searchInput.value.trim();
    if (!query) return;
    
    try {
      this.view.setSearchLoading(true);
      
      const tracks = await this.searchTracks(query);
      if (tracks.length === 0) {
        this.view.showErrorMessage('Aucune chanson trouvée. Essayez un autre terme.');
        return;
      }
      
      this.model.setTracks(tracks);
      this.model.setCurrentTrack(0);
      this.loadCurrentTrack();
      
    } catch (error) {
      this.view.showErrorMessage('Erreur de recherche. Vérifiez votre connexion.');
      console.error('Search error:', error);
    } finally {
      this.view.setSearchLoading(false);
    }
  }
  
  async searchByGenre(genre) {
    this.view.searchInput.value = genre;
    await this.performSearch();
  }
  
  async searchTracks(query, limit = 40) {
    const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}&media=music&country=FR`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results
      .filter(item => item.previewUrl && item.trackName && item.artistName)
      .map(item => ({
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || 'Unknown Album',
        src: item.previewUrl,
        cover: item.artworkUrl100 ? 
          item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg') : 
          null,
        duration: item.trackTimeMillis ? 
          Math.floor(item.trackTimeMillis / 1000) : 
          30
      }));
  }
  
  loadCurrentTrack() {
    const track = this.model.getCurrentTrack();
    if (track && this.view.audio.src !== track.src) {
      this.view.audio.src = track.src;
      this.view.audio.load();
    }
  }
  
  togglePlayback() {
    if (this.model.tracks.length === 0) return;
    
    if (this.view.audio.paused) {
      this.view.audio.play().catch(e => {
        this.view.showErrorMessage('Impossible de lire cette chanson.');
        console.error('Playback error:', e);
      });
    } else {
      this.view.audio.pause();
    }
  }
  
  playNext() {
    if (this.model.tracks.length === 0) return;
    
    let nextIndex;
    if (this.model.isShuffling) {
      const currentShuffleIndex = this.shuffledIndices.indexOf(this.model.currentTrackIndex);
      const nextShuffleIndex = (currentShuffleIndex + 1) % this.shuffledIndices.length;
      nextIndex = this.shuffledIndices[nextShuffleIndex];
    } else {
      nextIndex = (this.model.currentTrackIndex + 1) % this.model.tracks.length;
    }
    
    this.model.setCurrentTrack(nextIndex);
    this.loadCurrentTrack();
    if (this.model.isPlaying) {
      this.view.audio.play();
    }
  }
  
  playPrevious() {
    if (this.model.tracks.length === 0) return;
    
    let prevIndex;
    if (this.model.isShuffling) {
      const currentShuffleIndex = this.shuffledIndices.indexOf(this.model.currentTrackIndex);
      const prevShuffleIndex = currentShuffleIndex === 0 ? 
        this.shuffledIndices.length - 1 : 
        currentShuffleIndex - 1;
      prevIndex = this.shuffledIndices[prevShuffleIndex];
    } else {
      prevIndex = this.model.currentTrackIndex === 0 ? 
        this.model.tracks.length - 1 : 
        this.model.currentTrackIndex - 1;
    }
    
    this.model.setCurrentTrack(prevIndex);
    this.loadCurrentTrack();
    if (this.model.isPlaying) {
      this.view.audio.play();
    }
  }
  
  handleTrackEnd() {
    switch (this.model.repeatMode) {
      case 2: // Repeat single
        this.view.audio.currentTime = 0;
        this.view.audio.play();
        break;
      case 1: // Repeat all
        this.playNext();
        break;
      default: // No repeat
        if (this.model.currentTrackIndex < this.model.tracks.length - 1 || this.model.isShuffling) {
          this.playNext();
        } else {
          this.model.setPlayState(false);
        }
    }
  }
  
  seekToPosition(event) {
    if (!this.view.audio.duration) return;
    
    const rect = this.view.progressTrack.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    
    this.view.audio.currentTime = (percentage / 100) * this.view.audio.duration;
  }
  
  generateShuffledOrder() {
    this.shuffledIndices = Array.from({ length: this.model.tracks.length }, (_, i) => i);
    
    // Fisher-Yates shuffle
    for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledIndices[i], this.shuffledIndices[j]] = 
      [this.shuffledIndices[j], this.shuffledIndices[i]];
    }
  }
}

// APPLICATION LAUNCHER
class MusicPlayerApplication {
  constructor() {
    this.model = new MusicModel();
    this.view = new MusicView();
    this.controller = new MusicController(this.model, this.view);
    
    this.displayWelcomeMessage();
  }
  
  displayWelcomeMessage() {
    setTimeout(() => {
      console.log(`
        🎵 ADVANCED MUSIC PLAYER 🎵
        ============================
        
        🏗️  Architecture: MVC Pattern
        🎨 Design: Modern & Responsive  
        🎧 Source: iTunes API
        ✨ Features: Complete Music Experience
        
        📱 Mobile & Desktop Optimized
        🎮 Full Playback Controls
        🔀 Shuffle & Repeat Modes
        🎛️  Volume & Progress Control
        🎨 Dynamic Color Themes
        
        Ready to rock! 🚀
      `);
    }, 1500);
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  new MusicPlayerApplication();
});
