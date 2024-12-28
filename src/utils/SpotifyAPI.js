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

    getAuthUrl() {
        const scopes = 'user-read-private user-read-email user-top-read playlist-read-private user-library-read';
        return `https://accounts.spotify.com/authorize?response_type=code&client_id=${CONFIG.SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(CONFIG.SPOTIFY_REDIRECT_URI)}`;
    }

    async getAccessToken(code) {
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: CONFIG.SPOTIFY_REDIRECT_URI,
            client_id: CONFIG.SPOTIFY_CLIENT_ID,
            client_secret: CONFIG.SPOTIFY_CLIENT_SECRET
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    }

    async getUserData(accessToken) {
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    }

    async getUserPlaylists(accessToken) {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data.items;
    }

    async getUserTopTracks(accessToken) {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data.items;
    }

    async getUserTopArtists(accessToken) {
        const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data.items;
    }
}

export default new SpotifyAPI();