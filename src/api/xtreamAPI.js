// src/api/xtreamAPI.js
import axios from 'axios';

/**
 * Xtream Codes API Integration
 * Documentation: Standard Xtream Codes API endpoints
 */

class XtreamAPI {
    constructor(serverUrl, username, password) {
        this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
        this.username = username;
        this.password = password;
        this.baseUrl = `${this.serverUrl}/player_api.php`;
    }

    // Build API URL with credentials
    buildUrl(action = null, params = {}) {
        let url = `${this.baseUrl}?username=${this.username}&password=${this.password}`;

        if (action) {
            url += `&action=${action}`;
        }

        Object.keys(params).forEach(key => {
            url += `&${key}=${params[key]}`;
        });

        return url;
    }

    // Authenticate user and get account info
    async authenticate() {
        try {
            const url = this.buildUrl();
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    // Get live TV categories
    async getLiveCategories() {
        try {
            const url = this.buildUrl('get_live_categories');
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching live categories:', error);
            throw error;
        }
    }

    // Get live TV streams
    async getLiveStreams(categoryId = null) {
        try {
            const params = categoryId ? { category_id: categoryId } : {};
            const url = this.buildUrl('get_live_streams', params);
            const response = await axios.get(url, { timeout: 15000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching live streams:', error);
            throw error;
        }
    }

    // Get VOD categories
    async getVODCategories() {
        try {
            const url = this.buildUrl('get_vod_categories');
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching VOD categories:', error);
            throw error;
        }
    }

    // Get VOD streams (movies)
    async getVODStreams(categoryId = null) {
        try {
            const params = categoryId ? { category_id: categoryId } : {};
            const url = this.buildUrl('get_vod_streams', params);
            const response = await axios.get(url, { timeout: 15000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching VOD streams:', error);
            throw error;
        }
    }

    // Get VOD info (movie details)
    async getVODInfo(vodId) {
        try {
            const url = this.buildUrl('get_vod_info', { vod_id: vodId });
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching VOD info:', error);
            throw error;
        }
    }

    // Get series categories
    async getSeriesCategories() {
        try {
            const url = this.buildUrl('get_series_categories');
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching series categories:', error);
            throw error;
        }
    }

    // Get series
    async getSeries(categoryId = null) {
        try {
            const params = categoryId ? { category_id: categoryId } : {};
            const url = this.buildUrl('get_series', params);
            const response = await axios.get(url, { timeout: 15000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching series:', error);
            throw error;
        }
    }

    // Get series info (with seasons and episodes)
    async getSeriesInfo(seriesId) {
        try {
            const url = this.buildUrl('get_series_info', { series_id: seriesId });
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching series info:', error);
            throw error;
        }
    }

    // Get EPG (Electronic Program Guide)
    async getEPG(streamId, limit = 100) {
        try {
            const url = this.buildUrl('get_simple_data_table', {
                stream_id: streamId,
                limit: limit
            });
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.error('Error fetching EPG:', error);
            throw error;
        }
    }

    // Build stream URL for live TV
    getLiveStreamUrl(streamId, extension = 'm3u8') {
        return `${this.serverUrl}/live/${this.username}/${this.password}/${streamId}.${extension}`;
    }

    // Build stream URL for VOD (movies)
    getVODStreamUrl(streamId, containerExtension = 'mp4') {
        return `${this.serverUrl}/movie/${this.username}/${this.password}/${streamId}.${containerExtension}`;
    }

    // Build stream URL for series episodes
    getSeriesStreamUrl(streamId, containerExtension = 'mp4') {
        return `${this.serverUrl}/series/${this.username}/${this.password}/${streamId}.${containerExtension}`;
    }
}

// Helper function to authenticate user (used in LoginScreen)
export const authenticateUser = async (serverUrl, username, password) => {
    const api = new XtreamAPI(serverUrl, username, password);
    return await api.authenticate();
};

// Helper function to create API instance from saved credentials
export const createAPIInstance = async () => {
    try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const savedCreds = await AsyncStorage.getItem('iptv_credentials');

        if (savedCreds) {
            const { serverUrl, username, password } = JSON.parse(savedCreds);
            return new XtreamAPI(serverUrl, username, password);
        }

        throw new Error('No saved credentials found');
    } catch (error) {
        console.error('Error creating API instance:', error);
        throw error;
    }
};

export default XtreamAPI;