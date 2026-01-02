// src/screens/MovieDetailScreen.jsx - Fixed Version
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { createAPIInstance } from '../api/xtreamAPI';

const { width } = Dimensions.get('window');

const MovieDetailScreen = ({ route, navigation }) => {
    const { movieId, movieName, movieCover } = route.params;

    const [movieInfo, setMovieInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMovieInfo();
    }, []);

    const loadMovieInfo = async () => {
        try {
            setIsLoading(true);
            const api = await createAPIInstance();
            const info = await api.getVODInfo(movieId);
            console.log('Movie Info:', info);
            setMovieInfo(info);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to load movie details');
            console.error('Error loading movie info:', error);
        }
    };

    const handlePlayMovie = async () => {
        try {
            const api = await createAPIInstance();
            const streamUrl = api.getVODStreamUrl(
                movieId,
                movieInfo?.movie_data?.container_extension || 'mp4'
            );

            navigation.navigate('Player', {
                streamUrl: streamUrl,
                title: movieInfo?.movie_data?.name || movieName,
                type: 'vod',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to play movie');
            console.error('Error playing movie:', error);
        }
    };

    const handlePlayTrailer = (trailerUrl) => {
        if (trailerUrl) {
            navigation.navigate('Player', {
                streamUrl: trailerUrl,
                title: `${movieInfo?.movie_data?.name || movieName} - Trailer`,
                type: 'vod',
            });
        }
    };

    const renderCastMember = (cast, index) => {
        if (!cast || !cast.name) return null;

        return (
            <View key={`${cast.name}-${index}`} style={styles.castItem}>
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
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading movie details...</Text>
            </View>
        );
    }

    if (!movieInfo) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load movie information</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadMovieInfo}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Safely access nested properties
    const info = movieInfo.info || {};
    const movieData = movieInfo.movie_data || {};
    const hasTrailer = info.youtube_trailer || info.trailer_url;
    const hasCast = info.cast && typeof info.cast === 'string';
    let castArray = [];

    if (hasCast) {
        try {
            const parsed = JSON.parse(info.cast);
            if (Array.isArray(parsed)) {
                castArray = parsed;
            }
        } catch (e) {
            console.error('Error parsing cast:', e);
        }
    }

    // Safely get backdrop path
    const backdropPath = info.backdrop_path && Array.isArray(info.backdrop_path) && info.backdrop_path.length > 0
        ? info.backdrop_path[0]
        : null;

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header with Backdrop */}
                {backdropPath && (
                    <View style={styles.backdropContainer}>
                        <Image
                            source={{ uri: backdropPath }}
                            style={styles.backdrop}
                            resizeMode="cover"
                        />
                        <View style={styles.backdropOverlay} />
                    </View>
                )}

                {/* Movie Info */}
                <View style={styles.headerContent}>
                    <View style={styles.posterRow}>
                        {movieCover ? (
                            <Image
                                source={{ uri: movieCover }}
                                style={styles.poster}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.poster, styles.placeholderPoster]}>
                                <Text style={styles.placeholderIcon}>🎬</Text>
                            </View>
                        )}
                        <View style={styles.titleInfo}>
                            <Text style={styles.movieTitle}>
                                {info.name || movieData.name || movieName}
                            </Text>

                            <View style={styles.metaRow}>
                                {info.releasedate && (
                                    <Text style={styles.metaText}>{info.releasedate}</Text>
                                )}
                                {info.duration && (
                                    <>
                                        {info.releasedate && <Text style={styles.metaDot}>•</Text>}
                                        <Text style={styles.metaText}>{info.duration}</Text>
                                    </>
                                )}
                            </View>

                            {info.rating && (
                                <View style={styles.ratingContainer}>
                                    <Text style={styles.ratingText}>⭐ {info.rating}</Text>
                                    {info.rating_5based && (
                                        <Text style={styles.ratingSecondary}>({info.rating_5based}/5)</Text>
                                    )}
                                </View>
                            )}

                            {info.genre && (
                                <View style={styles.genreContainer}>
                                    {info.genre.split(',').slice(0, 3).map((genre, index) => (
                                        <View key={index} style={styles.genreChip}>
                                            <Text style={styles.genreText}>{genre.trim()}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.playButton}
                            onPress={handlePlayMovie}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.playIcon}>▶</Text>
                            <Text style={styles.playButtonText}>Play Movie</Text>
                        </TouchableOpacity>

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
                    </View>
                </View>

                {/* Plot/Description */}
                {info.plot && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Synopsis</Text>
                        <Text style={styles.plotText}>{info.plot}</Text>
                    </View>
                )}

                {/* Director & Actors */}
                {(info.director || info.actors) && (
                    <View style={styles.section}>
                        {info.director && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Director:</Text>
                                <Text style={styles.infoValue}>{info.director}</Text>
                            </View>
                        )}
                        {info.actors && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Actors:</Text>
                                <Text style={styles.infoValue}>{info.actors}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Cast with Images */}
                {castArray.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cast</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.castList}
                        >
                            {castArray.map((cast, index) => renderCastMember(cast, index))}
                        </ScrollView>
                    </View>
                )}

                {/* Additional Info */}
                {(info.country || info.age || info.mpaa_rating) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Information</Text>
                        {info.country && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Country:</Text>
                                <Text style={styles.infoValue}>{info.country}</Text>
                            </View>
                        )}
                        {info.age && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Age Rating:</Text>
                                <Text style={styles.infoValue}>{info.age}</Text>
                            </View>
                        )}
                        {info.mpaa_rating && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>MPAA Rating:</Text>
                                <Text style={styles.infoValue}>{info.mpaa_rating}</Text>
                            </View>
                        )}
                    </View>
                )}
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
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
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
        backgroundColor: 'rgba(9, 9, 11, 0.8)',
    },
    headerContent: {
        padding: 16,
    },
    posterRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    poster: {
        width: 120,
        height: 180,
        borderRadius: 8,
        backgroundColor: '#27272a',
    },
    placeholderPoster: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 48,
    },
    titleInfo: {
        flex: 1,
        marginLeft: 16,
    },
    movieTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
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
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 15,
        color: '#fbbf24',
        fontWeight: '600',
    },
    ratingSecondary: {
        fontSize: 13,
        color: '#71717a',
        marginLeft: 6,
    },
    genreContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
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
    actionButtons: {
        gap: 12,
    },
    playButton: {
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    playIcon: {
        color: '#ffffff',
        fontSize: 18,
    },
    playButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    trailerButton: {
        backgroundColor: '#27272a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3f3f46',
        gap: 8,
    },
    trailerIcon: {
        fontSize: 18,
    },
    trailerButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#27272a',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 12,
    },
    plotText: {
        fontSize: 15,
        color: '#a1a1aa',
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#71717a',
        fontWeight: '500',
        minWidth: 80,
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        color: '#ffffff',
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
});

export default MovieDetailScreen;