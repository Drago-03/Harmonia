import { createAudioResource, createAudioPlayer, AudioPlayerStatus } from '@discordjs/voice';
import { applyBassBoost, setVolume } from './audioEffects.js';
import logger from './logger.js';

export class MusicQueue {
  constructor() {
    this.queue = [];
    this.currentSong = null;
    this.audioPlayer = createAudioPlayer();
    this.volume = 100;
    this.bassBoost = false;

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => this.handleSongFinish());
    this.audioPlayer.on('error', error => {
      logger.error('Audio player error:', error);
      this.handleSongFinish();
    });
  }

  addSong(song) {
    this.queue.push(song);
    logger.info(`Added song to queue: ${song.title}`);
  }

  async playSong(connection, stream) {
    try {
      const resource = createAudioResource(stream, {
        inputType: stream.type,
        inlineVolume: true
      });

      setVolume(resource, this.volume / 100);
      
      if (this.bassBoost) {
        applyBassBoost(resource);
      }

      this.audioPlayer.play(resource);
      connection.subscribe(this.audioPlayer);
      
      logger.info(`Playing song: ${this.currentSong?.title}`);
    } catch (error) {
      logger.error('Error playing song:', error);
      throw error;
    }
  }

  handleSongFinish() {
    if (this.queue.length > 0) {
      this.currentSong = this.queue.shift();
      this.playSong(this.audioPlayer.playable);
    }
  }

  setVolume(newVolume) {
    this.volume = Math.max(0, Math.min(200, newVolume));
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      setVolume(this.audioPlayer.state.resource, this.volume / 100);
    }
  }

  toggleBassBoost() {
    this.bassBoost = !this.bassBoost;
    return this.bassBoost;
  }

  clear() {
    this.queue = [];
    this.currentSong = null;
    this.audioPlayer.stop();
  }
}