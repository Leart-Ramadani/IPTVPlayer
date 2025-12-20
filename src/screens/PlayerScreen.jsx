// src/screens/PlayerScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Alert,
} from 'react-native';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';

const PlayerScreen = ({ route, navigation }) => {
    const { streamUrl, title, type } = route.params;
    const videoRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(null);

    const controlsTimeout = useRef(null);

    useEffect(() => {
        // Lock to landscape on mount
        Orientation.lockToLandscape();

        return () => {
            // Unlock orientation on unmount
            Orientation.unlockAllOrientations();
        };
    }, []);

    useEffect(() => {
        if (showControls) {
            resetControlsTimeout();
        }
    }, [showControls]);

    const resetControlsTimeout = () => {
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, 5000);
    };

    const handleScreenPress = () => {
        setShowControls(!showControls);
        if (!showControls) {
            resetControlsTimeout();
        }
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
        resetControlsTimeout();
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const handleBuffer = ({ isBuffering: buffering }) => {
        setIsBuffering(buffering);
    };

    const handleError = (error) => {
        console.error('Video error:', error);
        setError('Failed to load video stream');
        Alert.alert(
            'Playback Error',
            'Failed to play this stream. Please try again or select another stream.',
            [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]
        );
    };

    const handleProgress = ({ currentTime, seekableDuration }) => {
        setCurrentTime(currentTime);
        setDuration(seekableDuration || duration);
    };

    const handleLoad = ({ duration }) => {
        setDuration(duration);
        setError(null);
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Video Player */}
            <Video
                ref={videoRef}
                source={{ uri: streamUrl }}
                style={styles.video}
                resizeMode="contain"
                paused={!isPlaying}
                onBuffer={handleBuffer}
                onError={handleError}
                onProgress={handleProgress}
                onLoad={handleLoad}
                bufferConfig={{
                    minBufferMs: 15000,
                    maxBufferMs: 50000,
                    bufferForPlaybackMs: 2500,
                    bufferForPlaybackAfterRebufferMs: 5000,
                }}
                repeat={false}
                playInBackground={false}
                playWhenInactive={false}
            />

            {/* Tap to show/hide controls */}
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleScreenPress}
            >
                {/* Buffering Indicator */}
                {isBuffering && (
                    <View style={styles.bufferingContainer}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.bufferingText}>Buffering...</Text>
                    </View>
                )}

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                    </View>
                )}

                {/* Controls */}
                {showControls && !error && (
                    <View style={styles.controlsContainer}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Text style={styles.backIcon}>←</Text>
                            </TouchableOpacity>
                            <Text style={styles.title} numberOfLines={1}>
                                {title}
                            </Text>
                            <View style={styles.spacer} />
                        </View>

                        {/* Center Play/Pause */}
                        <View style={styles.centerControls}>
                            <TouchableOpacity
                                onPress={handlePlayPause}
                                style={styles.playPauseButton}
                            >
                                <Text style={styles.playPauseIcon}>
                                    {isPlaying ? '⏸' : '▶'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Bar - only for VOD/Series */}
                        {type !== 'live' && (
                            <View style={styles.bottomBar}>
                                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                {
                                                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.timeText}>{formatTime(duration)}</Text>
                            </View>
                        )}

                        {/* Live Indicator */}
                        {type === 'live' && (
                            <View style={styles.liveIndicator}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    bufferingContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        alignItems: 'center',
    },
    bufferingText: {
        color: '#ffffff',
        marginTop: 12,
        fontSize: 14,
    },
    errorContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -100 }, { translateY: -50 }],
        alignItems: 'center',
        width: 200,
    },
    errorText: {
        fontSize: 48,
        marginBottom: 12,
    },
    errorMessage: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 14,
    },
    controlsContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 24,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    backIcon: {
        color: '#ffffff',
        fontSize: 24,
    },
    title: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    spacer: {
        width: 40,
    },
    centerControls: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playPauseButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playPauseIcon: {
        color: '#ffffff',
        fontSize: 28,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 24,
    },
    timeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
        minWidth: 45,
    },
    progressBarContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#2563eb',
        borderRadius: 2,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        margin: 16,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
        marginRight: 6,
    },
    liveText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
});

export default PlayerScreen;