import prismMedia from 'prism-media';

export function applyBassBoost(resource, options = { frequency: 0.5, depth: 0.5 }) {
  try {
    resource.encoder.setBassBoost(options);
    return true;
  } catch (error) {
    return false;
  }
}

export function setVolume(resource, volume) {
  if (!resource.volume) return false;
  try {
    resource.volume.setVolume(volume);
    return true;
  } catch (error) {
    return false;
  }
}