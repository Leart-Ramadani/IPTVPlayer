// src/screens/LiveTVScreen.jsx
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
    TextInput,
} from 'react-native';
import { createAPIInstance } from '../api/xtreamAPI';

const LiveTVScreen = ({ navigation }) => {
    const [channels, setChannels] = useState([]);
    const [filteredChannels, setFilteredChannels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadChannels();
    }, [selectedCategory]);

    useEffect(() => {
        filterChannels();
    }, [searchQuery, channels]);

    const filterChannels = () => {
        if (!searchQuery.trim()) {
            setFilteredChannels(channels);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = channels.filter(channel =>
            channel.name.toLowerCase().includes(query) ||
            (channel.category_name && channel.category_name.toLowerCase().includes(query))
        );
        setFilteredChannels(filtered);
    };

    const loadChannels = async () => {
        try {
            setIsLoading(true);
            const api = await createAPIInstance();

            if (categories.length === 0) {
                const cats = await api.getLiveCategories();
                setCategories([{ category_id: null, category_name: 'All Channels' }, ...cats]);
            }

            const streams = await api.getLiveStreams(selectedCategory);
            setChannels(streams);
            setFilteredChannels(streams);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to load channels. Please try again.');
            console.error('Error loading channels:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadChannels();
        setIsRefreshing(false);
    };

    const handleChannelPress = async (channel) => {
        try {
            const api = await createAPIInstance();
            const streamUrl = api.getLiveStreamUrl(channel.stream_id, 'm3u8');

            navigation.navigate('Player', {
                streamUrl: streamUrl,
                title: channel.name,
                type: 'live',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to play channel');
            console.error('Error playing channel:', error);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const renderChannel = ({ item }) => (
        <TouchableOpacity
            style={styles.channelItem}
            onPress={() => handleChannelPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.channelIconContainer}>
                {item.stream_icon ? (
                    <Image
                        source={{ uri: item.stream_icon }}
                        style={styles.channelIcon}
                    />
                ) : (
                    <View style={[styles.channelIcon, styles.placeholderIcon]}>
                        <Text style={styles.placeholderText}>📺</Text>
                    </View>
                )}
            </View>
            <View style={styles.channelInfo}>
                <Text style={styles.channelName} numberOfLines={1}>
                    {item.name}
                </Text>
                {item.category_name && (
                    <Text style={styles.channelCategory} numberOfLines={1}>
                        {item.category_name}
                    </Text>
                )}
            </View>
            <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
            </View>
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

    if (isLoading && channels.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading channels...</Text>
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
                        placeholder="Search channels..."
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
                        {filteredChannels.length} result{filteredChannels.length !== 1 ? 's' : ''}
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

            {/* Channels List */}
            <FlatList
                data={filteredChannels}
                renderItem={renderChannel}
                keyExtractor={(item) => item.stream_id.toString()}
                contentContainerStyle={styles.channelsList}
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
                            {searchQuery ? 'No channels found' : 'No channels available'}
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
    channelsList: {
        padding: 8,
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272a',
        padding: 12,
        marginBottom: 8,
    },
    channelIconContainer: {
        marginRight: 12,
    },
    channelIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    placeholderIcon: {
        backgroundColor: '#27272a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 24,
    },
    channelInfo: {
        flex: 1,
    },
    channelName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    channelCategory: {
        fontSize: 13,
        color: '#71717a',
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#ffffff',
        fontSize: 14,
        marginLeft: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
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

export default LiveTVScreen;