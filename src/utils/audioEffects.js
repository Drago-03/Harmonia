import prismMedia from 'prism-media';

export class AudioEffects {
  static applyBassBoost(resource, level = 0.5) {
    const filter = new prismMedia.FFmpeg({
      args: [
        '-i', '-',
        '-af', `bass=g=${level * 20}:f=110:w=0.3`,
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2'
      ]
    });
    return resource.pipe(filter);
  }

  static applyNightcore(resource) {
    const filter = new prismMedia.FFmpeg({
      args: [
        '-i', '-',
        '-af', 'asetrate=48000*1.25,aresample=48000',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2'
      ]
    });
    return resource.pipe(filter);
  }

  static setVolume(resource, volume) {
    if (resource.volume) {
      resource.volume.setVolume(volume);
      return true;
    }
    return false;
  }
}