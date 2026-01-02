// src/screens/PlayerScreen.jsx - Production Safe Version
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Alert,
    Modal,
    ScrollView,
    Platform,
} from 'react-native';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import Slider from '@react-native-community/slider';

const PlayerScreen = ({ route, navigation }) => {
    const { streamUrl, title, type } = route.params;
    const videoRef = useRef(null);

    // State management
    const [isPlaying, setIsPlaying] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [selectedTextTrack, setSelectedTextTrack] = useState(null);
    const [textTracks, setTextTracks] = useState([]);
    const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);

    const controlsTimeout = useRef(null);
    const MAX_RETRIES = 2;
    const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

    useEffect(() => {
        console.log('PlayerScreen mounted with URL:', streamUrl);
        Orientation.lockToLandscape();
        return () => {
            console.log('PlayerScreen unmounting');
            Orientation.unlockAllOrientations();
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
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
            if (!showSpeedMenu && !showQualityMenu && !showSubtitlesMenu) {
                setShowControls(false);
            }
        }, 5000);
    };

    const handleScreenPress = () => {
        setShowControls(!showControls);
        if (!showControls) {
            resetControlsTimeout();
        }
    };

    const handlePlayPause = () => {
        console.log('Play/Pause toggled:', !isPlaying);
        setIsPlaying(!isPlaying);
        resetControlsTimeout();
    };

    const handleBack = () => {
        console.log('Back button pressed');
        navigation.goBack();
    };

    const handleSkipForward = () => {
        try {
            if (videoRef.current && duration > 0) {
                const newTime = Math.min(currentTime + 10, duration);
                console.log('Skipping forward to:', newTime);
                videoRef.current.seek(newTime);
                setCurrentTime(newTime);
            }
            resetControlsTimeout();
        } catch (err) {
            console.error('Skip forward error:', err);
        }
    };

    const handleSkipBackward = () => {
        try {
            if (videoRef.current) {
                const newTime = Math.max(currentTime - 10, 0);
                console.log('Skipping backward to:', newTime);
                videoRef.current.seek(newTime);
                setCurrentTime(newTime);
            }
            resetControlsTimeout();
        } catch (err) {
            console.error('Skip backward error:', err);
        }
    };

    const handleSeek = (value) => {
        setIsSeeking(true);
        setCurrentTime(value);
    };

    const handleSlidingComplete = (value) => {
        try {
            if (videoRef.current) {
                console.log('Seeking to:', value);
                videoRef.current.seek(value);
            }
            setIsSeeking(false);
            resetControlsTimeout();
        } catch (err) {
            console.error('Seek error:', err);
            setIsSeeking(false);
        }
    };

    const handleBuffer = ({ isBuffering: buffering }) => {
        console.log('Buffering:', buffering);
        setIsBuffering(buffering);
    };

    const handleError = (error) => {
        console.error('Video error:', JSON.stringify(error, null, 2));

        const errorString = error?.error?.errorString || '';
        const errorCode = error?.error?.errorCode || '';

        if (errorString.includes('BAD_HTTP_STATUS') || errorCode === '22004') {
            if (retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                setError('Connection issue. Retrying...');
                setIsPlaying(false);
                setTimeout(() => {
                    setIsPlaying(true);
                    setError(null);
                }, 1000);
            } else {
                setError('Authentication failed');
                Alert.alert(
                    'Authentication Error',
                    'Failed to authenticate with the IPTV service.',
                    [
                        { text: 'Go Back', onPress: () => navigation.goBack() },
                        {
                            text: 'Retry',
                            onPress: () => {
                                setRetryCount(0);
                                setError(null);
                                setIsPlaying(false);
                                setTimeout(() => setIsPlaying(true), 500);
                            }
                        }
                    ]
                );
            }
        } else {
            setError('Playback error');
            Alert.alert(
                'Playback Error',
                'Failed to play this stream.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }
    };

    const handleProgress = (data) => {
        try {
            const { currentTime: ct, seekableDuration } = data;
            if (!isSeeking && ct !== undefined) {
                setCurrentTime(ct);
            }
            if (seekableDuration !== undefined) {
                setDuration(seekableDuration || duration);
            }

            if (error && ct > 0) {
                setError(null);
                setRetryCount(0);
            }
        } catch (err) {
            console.error('Progress error:', err);
        }
    };

    const handleLoad = (data) => {
        try {
            console.log('Video loaded:', data);
            if (data.duration !== undefined) {
                setDuration(data.duration);
            }
            setError(null);
            setRetryCount(0);

            if (data.textTracks && Array.isArray(data.textTracks) && data.textTracks.length > 0) {
                setTextTracks(data.textTracks);
            }
        } catch (err) {
            console.error('Load error:', err);
        }
    };

    const handleSpeedChange = (speed) => {
        console.log('Speed changed to:', speed);
        setPlaybackRate(speed);
        setShowSpeedMenu(false);
        resetControlsTimeout();
    };

    const handleSubtitleChange = (track) => {
        console.log('Subtitle changed:', track);
        setSelectedTextTrack(track);
        setShowSubtitlesMenu(false);
        resetControlsTimeout();
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';

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

            <Video
                ref={videoRef}
                source={{
                    uri: streamUrl,
                    headers: {
                        'User-Agent': 'ExoPlayerLib/2.18.1',
                    }
                }}
                style={styles.video}
                resizeMode="contain"
                paused={!isPlaying}
                rate={playbackRate}
                onBuffer={handleBuffer}
                onError={handleError}
                onProgress={handleProgress}
                onLoad={handleLoad}
                selectedTextTrack={selectedTextTrack}
                bufferConfig={{
                    minBufferMs: 15000,
                    maxBufferMs: 50000,
                    bufferForPlaybackMs: 2500,
                    bufferForPlaybackAfterRebufferMs: 5000,
                }}
                repeat={false}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                progressUpdateInterval={1000}
            />

            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleScreenPress}
            >
                {isBuffering && !error && (
                    <View style={styles.bufferingContainer}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.bufferingText}>Buffering...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        {retryCount > 0 && retryCount < MAX_RETRIES && (
                            <Text style={styles.retryText}>
                                Retry {retryCount}/{MAX_RETRIES}
                            </Text>
                        )}
                    </View>
                )}

                {showControls && !error && (
                    <View style={styles.controlsContainer}>
                        <View style={styles.topBar}>
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Text style={styles.backIcon}>←</Text>
                            </TouchableOpacity>
                            <Text style={styles.title} numberOfLines={1}>
                                {title}
                            </Text>
                            <View style={styles.topRightControls}>
                                {textTracks.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setShowSubtitlesMenu(true)}
                                        style={styles.iconButton}
                                    >
                                        <Text style={styles.iconText}>CC</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowSpeedMenu(true)}
                                    style={styles.iconButton}
                                >
                                    <Text style={styles.iconText}>{playbackRate}x</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.centerControls}>
                            <TouchableOpacity
                                onPress={handleSkipBackward}
                                style={styles.skipButton}
                            >
                                <Text style={styles.skipText}>⏪</Text>
                                <Text style={styles.skipLabel}>10s</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handlePlayPause}
                                style={styles.playPauseButton}
                            >
                                <Text style={styles.playPauseIcon}>
                                    {isPlaying ? '⏸' : '▶'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSkipForward}
                                style={styles.skipButton}
                            >
                                <Text style={styles.skipText}>⏩</Text>
                                <Text style={styles.skipLabel}>10s</Text>
                            </TouchableOpacity>
                        </View>

                        {type !== 'live' && (
                            <View style={styles.bottomBar}>
                                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                                <Slider
                                    style={styles.progressSlider}
                                    minimumValue={0}
                                    maximumValue={duration || 1}
                                    value={currentTime}
                                    onValueChange={handleSeek}
                                    onSlidingComplete={handleSlidingComplete}
                                    minimumTrackTintColor="#2563eb"
                                    maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                    thumbTintColor="#2563eb"
                                />
                                <Text style={styles.timeText}>{formatTime(duration)}</Text>
                            </View>
                        )}

                        {type === 'live' && (
                            <View style={styles.liveIndicatorContainer}>
                                <View style={styles.liveIndicator}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={showSpeedMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSpeedMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSpeedMenu(false)}
                >
                    <View style={styles.menuContainer}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Playback Speed</Text>
                            <TouchableOpacity onPress={() => setShowSpeedMenu(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.menuList}>
                            {playbackSpeeds.map((speed) => (
                                <TouchableOpacity
                                    key={speed}
                                    style={[
                                        styles.menuItem,
                                        playbackRate === speed && styles.menuItemActive
                                    ]}
                                    onPress={() => handleSpeedChange(speed)}
                                >
                                    <Text style={[
                                        styles.menuItemText,
                                        playbackRate === speed && styles.menuItemTextActive
                                    ]}>
                                        {speed}x {speed === 1.0 ? '(Normal)' : ''}
                                    </Text>
                                    {playbackRate === speed && (
                                        <Text style={styles.checkMark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={showSubtitlesMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSubtitlesMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSubtitlesMenu(false)}
                >
                    <View style={styles.menuContainer}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Subtitles</Text>
                            <TouchableOpacity onPress={() => setShowSubtitlesMenu(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.menuList}>
                            <TouchableOpacity
                                style={[
                                    styles.menuItem,
                                    selectedTextTrack === null && styles.menuItemActive
                                ]}
                                onPress={() => handleSubtitleChange(null)}
                            >
                                <Text style={[
                                    styles.menuItemText,
                                    selectedTextTrack === null && styles.menuItemTextActive
                                ]}>
                                    Off
                                </Text>
                                {selectedTextTrack === null && (
                                    <Text style={styles.checkMark}>✓</Text>
                                )}
                            </TouchableOpacity>
                            {textTracks.map((track, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.menuItem,
                                        selectedTextTrack?.type === track.type &&
                                        selectedTextTrack?.value === track.index &&
                                        styles.menuItemActive
                                    ]}
                                    onPress={() => handleSubtitleChange({
                                        type: 'index',
                                        value: track.index
                                    })}
                                >
                                    <Text style={[
                                        styles.menuItemText,
                                        selectedTextTrack?.value === track.index &&
                                        styles.menuItemTextActive
                                    ]}>
                                        {track.title || track.language || `Track ${index + 1}`}
                                    </Text>
                                    {selectedTextTrack?.value === track.index && (
                                        <Text style={styles.checkMark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        transform: [{ translateX: -120 }, { translateY: -60 }],
        alignItems: 'center',
        width: 240,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 20,
        borderRadius: 12,
    },
    errorText: {
        fontSize: 48,
        marginBottom: 12,
    },
    errorMessage: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 8,
    },
    retryText: {
        color: '#71717a',
        fontSize: 12,
        marginTop: 8,
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
    topRightControls: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        minWidth: 45,
        alignItems: 'center',
    },
    iconText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    centerControls: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
    },
    playPauseButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playPauseIcon: {
        color: '#ffffff',
        fontSize: 32,
    },
    skipButton: {
        alignItems: 'center',
    },
    skipText: {
        color: '#ffffff',
        fontSize: 36,
    },
    skipLabel: {
        color: '#ffffff',
        fontSize: 12,
        marginTop: 4,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    timeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
        minWidth: 45,
    },
    progressSlider: {
        flex: 1,
        marginHorizontal: 8,
        height: 40,
    },
    liveIndicatorContainer: {
        padding: 16,
        paddingBottom: 24,
        alignItems: 'flex-end',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272a',
        width: '80%',
        maxWidth: 400,
        maxHeight: '70%',
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    closeButton: {
        fontSize: 24,
        color: '#71717a',
    },
    menuList: {
        maxHeight: 400,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    menuItemActive: {
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    menuItemText: {
        fontSize: 16,
        color: '#a1a1aa',
    },
    menuItemTextActive: {
        color: '#2563eb',
        fontWeight: '600',
    },
    checkMark: {
        fontSize: 18,
        color: '#2563eb',
    },
});

export default PlayerScreen;