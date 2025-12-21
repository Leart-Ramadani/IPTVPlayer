// src/screens/SeriesDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    Alert,
    FlatList,
} from 'react-native';
import { createAPIInstance } from '../api/xtreamAPI';

const SeriesDetailScreen = ({ route, navigation }) => {
    const { seriesId, seriesName, seriesCover } = route.params;

    const [seriesInfo, setSeriesInfo] = useState(null);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSeriesInfo();
    }, []);

    const loadSeriesInfo = async () => {
        try {
            setIsLoading(true);
            const api = await createAPIInstance();
            const info = await api.getSeriesInfo(seriesId);
            setSeriesInfo(info);

            // Auto-select first season
            const seasons = Object.keys(info.episodes).sort((a, b) => a - b);
            if (seasons.length > 0) {
                setSelectedSeason(seasons[0]);
            }

            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to load series details');
            console.error('Error loading series info:', error);
        }
    };

    const handleEpisodePress = async (episode) => {
        try {
            const api = await createAPIInstance();
            const streamUrl = api.getSeriesStreamUrl(
                episode.id,
                episode.container_extension || 'mp4'
            );

            navigation.navigate('Player', {
                streamUrl: streamUrl,
                title: `${seriesName} - S${selectedSeason}E${episode.episode_num} - ${episode.title || 'Episode ' + episode.episode_num}`,
                type: 'series',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to play episode');
            console.error('Error playing episode:', error);
        }
    };

    const renderSeasonButton = (season) => (
        <TouchableOpacity
            key={season}
            style={[
                styles.seasonButton,
                selectedSeason === season && styles.seasonButtonActive,
            ]}
            onPress={() => setSelectedSeason(season)}
        >
            <Text
                style={[
                    styles.seasonButtonText,
                    selectedSeason === season && styles.seasonButtonTextActive,
                ]}
            >
                Season {season}
            </Text>
        </TouchableOpacity>
    );

    const renderEpisode = ({ item: episode }) => (
        <TouchableOpacity
            style={styles.episodeItem}
            onPress={() => handleEpisodePress(episode)}
            activeOpacity={0.7}
        >
            <View style={styles.episodeLeft}>
                {episode.info?.movie_image ? (
                    <Image
                        source={{ uri: episode.info.movie_image }}
                        style={styles.episodeThumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.episodeThumbnail, styles.placeholderThumbnail]}>
                        <Text style={styles.episodeNumber}>E{episode.episode_num}</Text>
                    </View>
                )}
                <View style={styles.episodeInfo}>
                    <Text style={styles.episodeTitle} numberOfLines={2}>
                        {episode.title || `Episode ${episode.episode_num}`}
                    </Text>
                    <Text style={styles.episodeMeta}>
                        Episode {episode.episode_num}
                        {episode.info?.duration && ` • ${episode.info.duration}`}
                    </Text>
                    {episode.info?.rating && (
                        <Text style={styles.episodeRating}>⭐ {episode.info.rating}</Text>
                    )}
                </View>
            </View>
            <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading series...</Text>
            </View>
        );
    }

    if (!seriesInfo) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load series information</Text>
            </View>
        );
    }

    const seasons = Object.keys(seriesInfo.episodes).sort((a, b) => a - b);
    const episodes = selectedSeason ? seriesInfo.episodes[selectedSeason] : [];

    return (
        <View style={styles.container}>
            {/* Header with Series Info */}
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        {seriesCover ? (
                            <Image
                                source={{ uri: seriesCover }}
                                style={styles.seriesCover}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.seriesCover, styles.placeholderCover]}>
                                <Text style={styles.placeholderIcon}>📺</Text>
                            </View>
                        )}
                        <View style={styles.headerInfo}>
                            <Text style={styles.seriesTitle}>{seriesName}</Text>
                            {seriesInfo.info?.genre && (
                                <Text style={styles.seriesGenre}>{seriesInfo.info.genre}</Text>
                            )}
                            {seriesInfo.info?.rating && (
                                <Text style={styles.seriesRating}>⭐ {seriesInfo.info.rating}</Text>
                            )}
                            {seriesInfo.info?.releaseDate && (
                                <Text style={styles.seriesYear}>{seriesInfo.info.releaseDate}</Text>
                            )}
                        </View>
                    </View>

                    {seriesInfo.info?.plot && (
                        <View style={styles.plotContainer}>
                            <Text style={styles.plotTitle}>Synopsis</Text>
                            <Text style={styles.plotText}>{seriesInfo.info.plot}</Text>
                        </View>
                    )}
                </View>

                {/* Season Selector */}
                <View style={styles.seasonsContainer}>
                    <Text style={styles.sectionTitle}>
                        {seasons.length} Season{seasons.length !== 1 ? 's' : ''}
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.seasonsList}
                    >
                        {seasons.map(renderSeasonButton)}
                    </ScrollView>
                </View>

                {/* Episodes List */}
                <View style={styles.episodesContainer}>
                    <Text style={styles.sectionTitle}>
                        {episodes.length} Episode{episodes.length !== 1 ? 's' : ''}
                    </Text>
                    {episodes.map((episode, index) => (
                        <View key={episode.id || index}>
                            {renderEpisode({ item: episode })}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
    },
    loadingText: {
        color: '#71717a',
        marginTop: 12,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
        padding: 20,
    },
    errorText: {
        color: '#71717a',
        fontSize: 16,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    headerContent: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    seriesCover: {
        width: 120,
        height: 180,
        borderRadius: 8,
        backgroundColor: '#27272a',
    },
    placeholderCover: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 48,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    seriesTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    seriesGenre: {
        fontSize: 14,
        color: '#a1a1aa',
        marginBottom: 4,
    },
    seriesRating: {
        fontSize: 14,
        color: '#71717a',
        marginBottom: 4,
    },
    seriesYear: {
        fontSize: 13,
        color: '#52525b',
    },
    plotContainer: {
        marginTop: 8,
    },
    plotTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    plotText: {
        fontSize: 14,
        color: '#a1a1aa',
        lineHeight: 20,
    },
    seasonsContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 12,
    },
    seasonsList: {
        paddingRight: 16,
    },
    seasonButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: '#27272a',
        marginRight: 8,
    },
    seasonButtonActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    seasonButtonText: {
        color: '#a1a1aa',
        fontSize: 14,
        fontWeight: '500',
    },
    seasonButtonTextActive: {
        color: '#ffffff',
    },
    episodesContainer: {
        padding: 16,
    },
    episodeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272a',
        padding: 12,
        marginBottom: 12,
    },
    episodeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    episodeThumbnail: {
        width: 100,
        height: 56,
        borderRadius: 6,
        backgroundColor: '#27272a',
        marginRight: 12,
    },
    placeholderThumbnail: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    episodeNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#71717a',
    },
    episodeInfo: {
        flex: 1,
    },
    episodeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    episodeMeta: {
        fontSize: 13,
        color: '#71717a',
        marginBottom: 2,
    },
    episodeRating: {
        fontSize: 12,
        color: '#71717a',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 2,
    },
});

export default SeriesDetailScreen;