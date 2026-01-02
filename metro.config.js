// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Important: This helps prevent issues with video player in production
config.transformer = {
    ...config.transformer,
    minifierConfig: {
        keep_classnames: true, // Preserve class names
        keep_fnames: true, // Preserve function names
        mangle: {
            keep_classnames: true,
            keep_fnames: true,
        },
    },
};

module.exports = config;