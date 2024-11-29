import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadEvents(client) {
  const eventFiles = readdirSync(join(__dirname, '../events')).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    import(`../events/${file}`).then(event => {
      if (event.default.once) {
        client.once(event.default.name, (...args) => event.default.execute(...args));
      } else {
        client.on(event.default.name, (...args) => event.default.execute(...args));
      }
    });
  }
}