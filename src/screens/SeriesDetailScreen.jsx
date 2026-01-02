// src/screens/SeriesDetailScreen.jsx - Improved with trailers and cast
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
    Dimensions,
} from 'react-native';
import { createAPIInstance } from '../api/xtreamAPI';

const { width } = Dimensions.get('window');

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

    const handlePlayTrailer = (trailerUrl) => {
        navigation.navigate('Player', {
            streamUrl: trailerUrl,
            title: `${seriesName} - Trailer`,
            type: 'vod',
        });
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

    const renderEpisode = (episode, index) => (
        <TouchableOpacity
            key={episode.id || index}
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
                    {episode.info?.plot && (
                        <Text style={styles.episodePlot} numberOfLines={2}>
                            {episode.info.plot}
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
            </View>
        </TouchableOpacity>
    );

    const renderCastMember = (cast) => (
        <View key={cast.name} style={styles.castItem}>
            {cast.image ? (
                <Image
                    source={{ uri: cast.image }}
                    style={styles.castImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.castImage, styles.placeholderCastImage]}>
                    <Text style={styles.castPlaceholder}>👤</Text>
                </View>
            )}
            <Text style={styles.castName} numberOfLines={2}>
                {cast.name}
            </Text>
            {cast.character && (
                <Text style={styles.castCharacter} numberOfLines={1}>
                    {cast.character}
                </Text>
            )}
        </View>
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
    const info = seriesInfo.info;
    const hasTrailer = info?.youtube_trailer || info?.trailer_url;
    const hasCast = info?.cast && typeof info.cast === 'string';
    let castArray = [];

    if (hasCast) {
        try {
            castArray = JSON.parse(info.cast);
        } catch (e) {
            console.error('Error parsing cast:', e);
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header with Backdrop */}
                {info?.backdrop_path && info.backdrop_path.length > 0 && (
                    <View style={styles.backdropContainer}>
                        <Image
                            source={{ uri: info.backdrop_path[0] }}
                            style={styles.backdrop}
                            resizeMode="cover"
                        />
                        <View style={styles.backdropOverlay} />
                    </View>
                )}

                {/* Series Header Info */}
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

                            {info?.genre && (
                                <View style={styles.genreContainer}>
                                    {info.genre.split(',').slice(0, 2).map((genre, index) => (
                                        <View key={index} style={styles.genreChip}>
                                            <Text style={styles.genreText}>{genre.trim()}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={styles.metaRow}>
                                {info?.releaseDate && (
                                    <Text style={styles.metaText}>{info.releaseDate}</Text>
                                )}
                                {info?.rating && (
                                    <>
                                        {info.releaseDate && <Text style={styles.metaDot}>•</Text>}
                                        <Text style={styles.metaText}>⭐ {info.rating}</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Trailer Button */}
                    {hasTrailer && (
                        <TouchableOpacity
                            style={styles.trailerButton}
                            onPress={() => handlePlayTrailer(info.youtube_trailer || info.trailer_url)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.trailerIcon}>🎬</Text>
                            <Text style={styles.trailerButtonText}>Watch Trailer</Text>
                        </TouchableOpacity>
                    )}

                    {/* Synopsis */}
                    {info?.plot && (
                        <View style={styles.plotContainer}>
                            <Text style={styles.plotTitle}>Synopsis</Text>
                            <Text style={styles.plotText}>{info.plot}</Text>
                        </View>
                    )}

                    {/* Director & Actors */}
                    {(info?.director || info?.actors) && (
                        <View style={styles.detailsContainer}>
                            {info.director && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Director:</Text>
                                    <Text style={styles.detailValue}>{info.director}</Text>
                                </View>
                            )}
                            {info.actors && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Actors:</Text>
                                    <Text style={styles.detailValue}>{info.actors}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Cast with Images */}
                {castArray.length > 0 && (
                    <View style={styles.castSection}>
                        <Text style={styles.sectionTitle}>Cast</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.castList}
                        >
                            {castArray.map(renderCastMember)}
                        </ScrollView>
                    </View>
                )}

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
                        Season {selectedSeason} - {episodes.length} Episode{episodes.length !== 1 ? 's' : ''}
                    </Text>
                    {episodes.map((episode, index) => renderEpisode(episode, index))}
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
    backdropContainer: {
        width: width,
        height: 220,
        position: 'relative',
    },
    backdrop: {
        width: '100%',
        height: '100%',
    },
    backdropOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'linear-gradient(to bottom, transparent, #09090b)',
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
    },
    seriesTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    genreContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    genreChip: {
        backgroundColor: '#27272a',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    genreText: {
        fontSize: 12,
        color: '#a1a1aa',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 14,
        color: '#a1a1aa',
    },
    metaDot: {
        fontSize: 14,
        color: '#52525b',
        marginHorizontal: 6,
    },
    trailerButton: {
        backgroundColor: '#27272a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3f3f46',
        gap: 8,
        marginBottom: 16,
    },
    trailerIcon: {
        fontSize: 18,
    },
    trailerButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    plotContainer: {
        marginBottom: 8,
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
    detailsContainer: {
        marginTop: 12,
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
    },
    detailLabel: {
        fontSize: 13,
        color: '#71717a',
        fontWeight: '500',
        minWidth: 70,
    },
    detailValue: {
        flex: 1,
        fontSize: 13,
        color: '#ffffff',
    },
    castSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    castList: {
        paddingRight: 16,
        gap: 12,
    },
    castItem: {
        width: 100,
        alignItems: 'center',
    },
    castImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#27272a',
        marginBottom: 8,
    },
    placeholderCastImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    castPlaceholder: {
        fontSize: 32,
    },
    castName: {
        fontSize: 13,
        fontWeight: '500',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 2,
    },
    castCharacter: {
        fontSize: 11,
        color: '#71717a',
        textAlign: 'center',
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
        alignItems: 'flex-start',
        flex: 1,
    },
    episodeThumbnail: {
        width: 140,
        height: 78,
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
        fontSize: 12,
        color: '#71717a',
        marginBottom: 4,
    },
    episodeRating: {
        fontSize: 12,
        color: '#71717a',
        marginBottom: 4,
    },
    episodePlot: {
        fontSize: 12,
        color: '#a1a1aa',
        lineHeight: 16,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    playIcon: {
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 2,
    },
});

export default SeriesDetailScreen;