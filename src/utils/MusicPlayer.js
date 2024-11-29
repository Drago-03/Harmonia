import play from 'play-dl';
import { Genius } from 'genius-lyrics';
import { createAudioResource, createAudioPlayer, AudioPlayerStatus } from '@discordjs/voice';

const genius = new Genius(process.env.GENIUS_API_KEY);

export class MusicPlayer {
  constructor() {
    this.queue = [];
    this.currentSong = null;
    this.audioPlayer = createAudioPlayer();
    this.lyrics = null;
    this.currentLyricIndex = 0;
    this.lyricTimer = null;
  }

  async addSong(query) {
    const searchResult = await play.search(query, { limit: 1 });
    if (!searchResult.length) throw new Error('No results found');
    
    const song = {
      title: searchResult[0].title,
      url: searchResult[0].url,
      duration: searchResult[0].duration
    };
    
    this.queue.push(song);
    return song;
  }

  async playSong(connection) {
    if (!this.queue.length) return;

    this.currentSong = this.queue.shift();
    const stream = await play.stream(this.currentSong.url);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    this.audioPlayer.play(resource);
    connection.subscribe(this.audioPlayer);

    // Fetch and sync lyrics
    await this.fetchLyrics();
    this.startLyricSync();
  }

  async fetchLyrics() {
    try {
      const searches = await genius.songs.search(this.currentSong.title);
      const song = searches[0];
      this.lyrics = await song.lyrics();
      this.currentLyricIndex = 0;
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      this.lyrics = null;
    }
  }

  startLyricSync() {
    if (!this.lyrics) return;
    
    const lines = this.lyrics.split('\n');
    const averageTimePerLine = (this.currentSong.duration * 1000) / lines.length;

    this.lyricTimer = setInterval(() => {
      if (this.currentLyricIndex >= lines.length) {
        clearInterval(this.lyricTimer);
        return;
      }
      // Emit current lyric line (to be implemented in event handler)
      this.currentLyricIndex++;
    }, averageTimePerLine);
  }

  stop() {
    this.audioPlayer.stop();
    this.queue = [];
    if (this.lyricTimer) {
      clearInterval(this.lyricTimer);
    }
  }

  pause() {
    this.audioPlayer.pause();
  }

  resume() {
    this.audioPlayer.unpause();
  }

  skip() {
    this.audioPlayer.stop();
    if (this.lyricTimer) {
      clearInterval(this.lyricTimer);
    }
  }
}