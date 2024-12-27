import axios from 'axios';
import { CONFIG } from './config.js';

class SpotifyAPI {
    constructor() {
        this.token = null;
        this.tokenExpires = null;
    }

    async authenticate() {
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'client_credentials'
        }), {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${CONFIG.SPOTIFY_CLIENT_ID}:${CONFIG.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.token = response.data.access_token;
        this.tokenExpires = Date.now() + (response.data.expires_in * 1000);
    }

    async getToken() {
        if (!this.token || Date.now() >= this.tokenExpires) {
            await this.authenticate();
        }
        return this.token;
    }

    async getUserTopArtists() {
        const token = await this.getToken();
        const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.items;
    }

    async getUserTopTracks() {
        const token = await this.getToken();
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.items;
    }

    async getUserPlaylists() {
        const token = await this.getToken();
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.items;
    }
}

export default new SpotifyAPI();