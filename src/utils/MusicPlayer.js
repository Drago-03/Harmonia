import play from 'play-dl';
import pkg from 'genius-lyrics';
const { Client: GeniusClient } = pkg;
import { createAudioResource, createAudioPlayer, AudioPlayerStatus } from '@discordjs/voice';
import SpotifyWebApi from 'spotify-web-api-node';
import logger from './logger.js';
import premiumManager from './PremiumManager.js';

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

    // Handle audio player state changes
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.handleSongFinish();
    });

    this.audioPlayer.on('error', error => {
      logger.error(`Audio player error: ${error.message}`);
      this.handleSongFinish();
    });
  }

  async addSong(query, userId) {
    try {
      // Search both YouTube and Spotify
      const [ytResults, spotifyResults] = await Promise.all([
        play.search(query, { limit: 1 }),
        this.searchSpotify(query)
      ]);

      let selectedResult = ytResults[0];
      if (spotifyResults && spotifyResults.popularity > (ytResults[0]?.views || 0)) {
        selectedResult = spotifyResults;
      }

      if (!selectedResult) throw new Error('No results found');

      const song = {
        title: selectedResult.title,
        url: selectedResult.url,
        duration: selectedResult.duration,
        requestedBy: userId
      };

      this.queue.push(song);
      logger.info(`Added song to queue: ${song.title}`);
      return song;
    } catch (error) {
      logger.error(`Error adding song: ${error.message}`);
      throw error;
    }
  }

  async playSong(connection) {
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

    if (this.queue.length > 0) {
      this.playSong(this.audioPlayer.playable);
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

  async searchSpotify(query) {
    // Implementation of Spotify search
    // This would require proper Spotify API credentials
    return null;
  }
}