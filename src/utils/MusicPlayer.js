import play from 'play-dl';
import pkg from 'genius-lyrics';
const { Client: GeniusClient } = pkg;
import { createAudioResource, createAudioPlayer, AudioPlayerStatus } from '@discordjs/voice';
import SpotifyWebApi from 'spotify-web-api-node';
import logger from './logger.js';
import premiumManager from './PremiumManager.js';
import { ProgressBar } from './progressBar.js';

const genius = new GeniusClient(process.env.GENIUS_API_KEY);

export class MusicPlayer {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.currentSong = null;
    this.audioPlayer = createAudioPlayer();
    this.lyrics = null;
    this.currentLyricIndex = 0;
    this.lyricTimer = null;
    this.volume = 100;
    this.bassBoost = false;
    this.twentyFourSeven = false;
    this.karaokeMode = false;
    this.startTime = null;
    this.pausedAt = null;
    this.progressBar = null;
    this.textChannel = null;

    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });

    this.initializeSpotify();
    this.spotifyCache = new Map();
    this.cacheDuration = 3600000; // 1 hour

    // Handle audio player state changes
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.handleSongFinish();
    });

    this.audioPlayer.on('error', error => {
      logger.error(`Audio player error: ${error.message}`);
      this.handleSongFinish();
    });
  }

  async initializeSpotify() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body.access_token);

      // Refresh token before expiry
      setTimeout(() => this.initializeSpotify(), 
        (data.body.expires_in - 60) * 1000);

      logger.info('Spotify API initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Spotify:', error);
    }
  }

  async searchSpotify(query, type = 'track') {
    const cacheKey = `${type}:${query}`;

    // Check cache
    if (this.spotifyCache.has(cacheKey)) {
      const cached = this.spotifyCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.data;
      }
      this.spotifyCache.delete(cacheKey);
    }

    try {
      let data;
      switch (type) {
        case 'track':
          data = await this.spotifyApi.searchTracks(query, { limit: 1 });
          break;
        case 'playlist':
          data = await this.spotifyApi.searchPlaylists(query, { limit: 1 });
          break;
        case 'album':
          data = await this.spotifyApi.searchAlbums(query, { limit: 1 });
          break;
      }

      // Cache results
      this.spotifyCache.set(cacheKey, {
        timestamp: Date.now(),
        data: data.body
      });

      return data.body;
    } catch (error) {
      logger.error(`Spotify search error: ${error.message}`);
      return null;
    }
  }

  async addSong(query, userId) {
    try {
      // First try Spotify
      if (query.includes('spotify.com') || !query.includes('youtube.com')) {
        const spotifyData = await this.searchSpotify(query);
        if (spotifyData?.tracks?.items?.[0]) {
          const track = spotifyData.tracks.items[0];
          // Search YouTube for the Spotify track
          const ytQuery = `${track.name} ${track.artists[0].name}`;
          const ytResults = await play.search(ytQuery, { limit: 1 });

          if (ytResults?.[0]) {
            const song = {
              title: track.name,
              url: ytResults[0].url,
              duration: Math.floor(track.duration_ms / 1000),
              thumbnail: track.album.images[0]?.url,
              artist: track.artists[0].name,
              spotifyUrl: track.external_urls.spotify,
              requestedBy: userId
            };

            this.queue.push(song);
            return song;
          }
        }
      }

      // Fallback to regular YouTube search
      const ytResults = await play.search(query, { limit: 1 });
      if (!ytResults?.[0]) throw new Error('No results found');

      const song = {
        title: ytResults[0].title,
        url: ytResults[0].url,
        duration: ytResults[0].durationInSec,
        thumbnail: ytResults[0].thumbnails[0].url,
        requestedBy: userId
      };

      this.queue.push(song);
      return song;
    } catch (error) {
      logger.error(`Error adding song: ${error.message}`);
      throw error;
    }
  }

  async playSong(connection, textChannel) {
    if (!this.queue.length) return;

    try {
      this.currentSong = this.queue.shift();
      const stream = await play.stream(this.currentSong.url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });

      resource.volume.setVolume(this.volume / 100);
      
      if (this.bassBoost) {
        // Apply bass boost filter using prism-media
        const options = {
          frequency: 0.5,
          depth: 0.5
        };
        resource.encoder.setBassBoost(options);
      }

      this.audioPlayer.play(resource);
      connection.subscribe(this.audioPlayer);
      this.startTime = Date.now();
      this.textChannel = textChannel;

      // Create progress bar
      if (this.progressBar) {
        this.progressBar.destroy();
      }
      this.progressBar = new ProgressBar(this, textChannel);
      await this.progressBar.create();

      await this.fetchLyrics();
      if (this.karaokeMode) {
        this.startLyricSync();
      }

      logger.info(`Playing song: ${this.currentSong.title}`);
    } catch (error) {
      logger.error(`Error playing song: ${error.message}`);
      this.handleSongFinish();
      throw error;
    }
  }

  async fetchLyrics() {
    try {
      const searches = await genius.songs.search(this.currentSong.title);
      if (searches.length > 0) {
        const song = searches[0];
        this.lyrics = await song.lyrics();
        this.currentLyricIndex = 0;
        logger.info(`Lyrics fetched for: ${this.currentSong.title}`);
      } else {
        this.lyrics = null;
        logger.info(`No lyrics found for: ${this.currentSong.title}`);
      }
    } catch (error) {
      logger.error(`Error fetching lyrics: ${error.message}`);
      this.lyrics = null;
    }
  }

  startLyricSync() {
    if (!this.lyrics) return;
    
    const lines = this.lyrics.split('\n');
    const averageTimePerLine = (this.currentSong.duration * 1000) / lines.length;

    if (this.lyricTimer) {
      clearInterval(this.lyricTimer);
    }

    this.lyricTimer = setInterval(() => {
      if (this.currentLyricIndex >= lines.length) {
        clearInterval(this.lyricTimer);
        return;
      }
      // Emit current lyric line through the audio player
      this.audioPlayer.emit('lyricLine', {
        line: lines[this.currentLyricIndex],
        index: this.currentLyricIndex
      });
      this.currentLyricIndex++;
    }, averageTimePerLine);
  }

  handleSongFinish() {
    if (this.lyricTimer) {
      clearInterval(this.lyricTimer);
    }

    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = null;
    }

    if (this.queue.length > 0) {
      this.playSong(this.audioPlayer.playable, this.textChannel);
    } else if (!this.twentyFourSeven) {
      this.audioPlayer.stop();
    }
  }

  setVolume(volume) {
    if (volume < 0 || volume > 200) {
      throw new Error('Volume must be between 0 and 200');
    }
    this.volume = volume;
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.audioPlayer.state.resource.volume.setVolume(volume / 100);
    }
  }

  toggleBassBoost() {
    this.bassBoost = !this.bassBoost;
    return this.bassBoost;
  }

  async toggle24_7(guildId, userId) {
    if (!premiumManager.isPremiumServer(guildId) && !premiumManager.isPremiumUser(userId)) {
      throw new Error('24/7 mode is a premium feature');
    }
    this.twentyFourSeven = !this.twentyFourSeven;
    return this.twentyFourSeven;
  }

  toggleKaraokeMode() {
    this.karaokeMode = !this.karaokeMode;
    if (this.karaokeMode && this.currentSong) {
      this.startLyricSync();
    } else if (this.lyricTimer) {
      clearInterval(this.lyricTimer);
    }
    return this.karaokeMode;
  }

  async loadPlaylist(url, userId) {
    try {
      const playlist = await play.playlist_info(url);
      const videos = await playlist.all_videos();
      
      for (const video of videos) {
        this.queue.push({
          title: video.title,
          url: video.url,
          duration: video.durationInSec,
          requestedBy: userId
        });
      }
      
      return {
        title: playlist.title,
        count: videos.length
      };
    } catch (error) {
      logger.error(`Error loading playlist: ${error.message}`);
      throw error;
    }
  }

  shuffle() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getProgress() {
    if (!this.startTime || !this.currentSong) return null;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    const total = this.currentSong.duration;
    const progress = Math.min(elapsed / total, 1);
    
    const progressBar = '▬'.repeat(20);
    const position = Math.floor(progress * 20);
    
    return {
      bar: progressBar.slice(0, position) + '🔘' + progressBar.slice(position + 1),
      elapsed: this.formatDuration(Math.floor(elapsed)),
      total: this.formatDuration(total)
    };
  }

  getPlaybackTime() {
    if (!this.startTime) return 0;
    if (this.pausedAt) return this.pausedAt - this.startTime;
    return Date.now() - this.startTime;
  }

  async seek(seconds) {
    if (!this.currentSong) return;
    
    const stream = await play.stream(this.currentSong.url, { seek: seconds });
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true
    });

    resource.volume.setVolume(this.volume / 100);
    this.startTime = Date.now() - (seconds * 1000);
    this.audioPlayer.play(resource);
  }

  togglePlayback() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.pausedAt = Date.now();
      this.audioPlayer.pause();
    } else {
      this.startTime += Date.now() - this.pausedAt;
      this.pausedAt = null;
      this.audioPlayer.unpause();
    }
  }

  stop() {
    this.audioPlayer.stop();
    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = null;
    }
    this.currentSong = null;
    this.startTime = null;
    this.pausedAt = null;
  }
}

// Create an instance of the SpotifyWebApi
const spotifyApi = new SpotifyWebApi({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  redirectUri: 'your_redirect_uri'
});

// Example function to search for a track
async function searchTrack(trackName) {
  try {
    const data = await spotifyApi.searchTracks(trackName);
    console.log('Search results:', data.body);
  } catch (err) {
    console.error('Error searching for track:', err);
  }
}

// Call the function with a track name
searchTrack('Shape of You');