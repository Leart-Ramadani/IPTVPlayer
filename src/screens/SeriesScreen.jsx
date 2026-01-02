// src/screens/SeriesScreen.jsx - Updated to use detail screen
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
    TextInput,
} from 'react-native';
import { createAPIInstance } from '../api/xtreamAPI';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 3;

const SeriesScreen = ({ navigation }) => {
    const [series, setSeries] = useState([]);
    const [filteredSeries, setFilteredSeries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSeries();
    }, [selectedCategory]);

    useEffect(() => {
        filterSeries();
    }, [searchQuery, series]);

    const filterSeries = () => {
        if (!searchQuery.trim()) {
            setFilteredSeries(series);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = series.filter(seriesItem =>
            seriesItem.name.toLowerCase().includes(query) ||
            (seriesItem.category_name && seriesItem.category_name.toLowerCase().includes(query)) ||
            (seriesItem.rating && seriesItem.rating.toString().includes(query))
        );
        setFilteredSeries(filtered);
    };

    const loadSeries = async () => {
        try {
            setIsLoading(true);
            const api = await createAPIInstance();

            if (categories.length === 0) {
                const cats = await api.getSeriesCategories();
                setCategories([{ category_id: null, category_name: 'All Series' }, ...cats]);
            }

            const seriesData = await api.getSeries(selectedCategory);
            setSeries(seriesData);
            setFilteredSeries(seriesData);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to load series. Please try again.');
            console.error('Error loading series:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadSeries();
        setIsRefreshing(false);
    };

    const handleSeriesPress = (seriesItem) => {
        // Navigate to series detail screen
        navigation.navigate('SeriesDetail', {
            seriesId: seriesItem.series_id,
            seriesName: seriesItem.name,
            seriesCover: seriesItem.cover,
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const renderSeries = ({ item }) => (
        <TouchableOpacity
            style={styles.seriesItem}
            onPress={() => handleSeriesPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.posterContainer}>
                {item.cover ? (
                    <Image
                        source={{ uri: item.cover }}
                        style={styles.poster}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.poster, styles.placeholderPoster]}>
                        <Text style={styles.placeholderText}>📺</Text>
                    </View>
                )}
                <View style={styles.infoOverlay}>
                    <View style={styles.playIcon}>
                        <Text style={styles.playIconText}>▶</Text>
                    </View>
                </View>
            </View>
            <Text style={styles.seriesTitle} numberOfLines={2}>
                {item.name}
            </Text>
            {item.rating && (
                <Text style={styles.seriesRating}>⭐ {Math.round(item.rating * 100) / 100}</Text>
            )}
            {item.last_modified && (
                <Text style={styles.seriesYear}>
                    {new Date(parseInt(item.last_modified) * 1000).getFullYear()}
                </Text>
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

    if (isLoading && series.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading series...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search series..."
                        placeholderTextColor="#71717a"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {searchQuery.length > 0 && (
                    <Text style={styles.resultCount}>
                        {filteredSeries.length} result{filteredSeries.length !== 1 ? 's' : ''}
                    </Text>
                )}
            </View>

            {/* Categories */}
            {categories.length > 0 && !searchQuery && (
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

            {/* Series Grid */}
            <FlatList
                data={filteredSeries}
                renderItem={renderSeries}
                keyExtractor={(item) => item.series_id.toString()}
                numColumns={3}
                contentContainerStyle={styles.seriesList}
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
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No series found' : 'No series available'}
                        </Text>
                        {searchQuery && (
                            <Text style={styles.emptySubtext}>
                                Try a different search term
                            </Text>
                        )}
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
    searchContainer: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        backgroundColor: '#09090b',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181b',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#27272a',
        paddingHorizontal: 12,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 15,
        paddingVertical: 12,
    },
    clearButton: {
        padding: 4,
    },
    clearIcon: {
        color: '#71717a',
        fontSize: 18,
    },
    resultCount: {
        color: '#71717a',
        fontSize: 12,
        marginTop: 8,
        marginLeft: 4,
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
    seriesList: {
        padding: 8,
    },
    row: {
        justifyContent: 'space-between',
    },
    seriesItem: {
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
    infoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    playIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(37, 99, 235, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconText: {
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 2,
    },
    seriesTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#ffffff',
        marginBottom: 4,
        lineHeight: 16,
    },
    seriesRating: {
        fontSize: 12,
        color: '#71717a',
        marginBottom: 2,
    },
    seriesYear: {
        fontSize: 11,
        color: '#52525b',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
        width: '100%',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        color: '#71717a',
        fontSize: 16,
        marginBottom: 4,
    },
    emptySubtext: {
        color: '#52525b',
        fontSize: 14,
    },
});

export default SeriesScreen;