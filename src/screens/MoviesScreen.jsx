// src/screens/MoviesScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    Alert,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { createAPIInstance } from '../api/xtreamAPI';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 3; // 3 columns with padding

const MoviesScreen = ({ navigation }) => {
    const [movies, setMovies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadMovies();
    }, [selectedCategory]);

    const loadMovies = async () => {
        try {
            setIsLoading(true);
            const api = await createAPIInstance();

            // Load categories if not already loaded
            if (categories.length === 0) {
                const cats = await api.getVODCategories();
                setCategories([{ category_id: null, category_name: 'All Movies' }, ...cats]);
            }

            // Load movies
            const streams = await api.getVODStreams(selectedCategory);
            setMovies(streams);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to load movies. Please try again.');
            console.error('Error loading movies:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadMovies();
        setIsRefreshing(false);
    };

    const handleMoviePress = async (movie) => {
        try {
            const api = await createAPIInstance();
            const streamUrl = api.getVODStreamUrl(movie.stream_id, movie.container_extension || 'mp4');

            navigation.navigate('Player', {
                streamUrl: streamUrl,
                title: movie.name,
                type: 'vod',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to play movie');
            console.error('Error playing movie:', error);
        }
    };

    const renderMovie = ({ item }) => (
        <TouchableOpacity
            style={styles.movieItem}
            onPress={() => handleMoviePress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.posterContainer}>
                {item.stream_icon ? (
                    <Image
                        source={{ uri: item.stream_icon }}
                        style={styles.poster}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.poster, styles.placeholderPoster]}>
                        <Text style={styles.placeholderText}>🎬</Text>
                    </View>
                )}
                <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                        <Text style={styles.playIcon}>▶</Text>
                    </View>
                </View>
            </View>
            <Text style={styles.movieTitle} numberOfLines={2}>
                {item.name}
            </Text>
            {item.rating && (
                <Text style={styles.movieRating}>⭐ {item.rating}</Text>
            )}
        </TouchableOpacity>
    );

    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryChip,
                selectedCategory === item.category_id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.category_id)}
        >
            <Text
                style={[
                    styles.categoryText,
                    selectedCategory === item.category_id && styles.categoryTextActive,
                ]}
            >
                {item.category_name}
            </Text>
        </TouchableOpacity>
    );

    if (isLoading && movies.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading movies...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Categories */}
            {categories.length > 0 && (
                <View style={styles.categoriesContainer}>
                    <FlatList
                        horizontal
                        data={categories}
                        renderItem={renderCategory}
                        keyExtractor={(item) => item.category_id?.toString() || 'all'}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>
            )}

            {/* Movies Grid */}
            <FlatList
                data={movies}
                renderItem={renderMovie}
                keyExtractor={(item) => item.stream_id.toString()}
                numColumns={3}
                contentContainerStyle={styles.moviesList}
                columnWrapperStyle={styles.row}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor="#2563eb"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No movies available</Text>
                    </View>
                }
            />
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
    categoriesContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        backgroundColor: '#09090b',
    },
    categoriesList: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: '#27272a',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    categoryText: {
        color: '#a1a1aa',
        fontSize: 14,
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#ffffff',
    },
    moviesList: {
        padding: 8,
    },
    row: {
        justifyContent: 'space-between',
    },
    movieItem: {
        width: ITEM_WIDTH,
        marginBottom: 16,
        marginHorizontal: 4,
    },
    posterContainer: {
        position: 'relative',
        aspectRatio: 2 / 3,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },
    poster: {
        width: '100%',
        height: '100%',
        backgroundColor: '#27272a',
    },
    placeholderPoster: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 32,
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 2,
    },
    movieTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#ffffff',
        marginBottom: 4,
        lineHeight: 16,
    },
    movieRating: {
        fontSize: 12,
        color: '#71717a',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
        width: '100%',
    },
    emptyText: {
        color: '#71717a',
        fontSize: 16,
    },
});

export default MoviesScreen;