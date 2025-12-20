// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [playlistName, setPlaylistName] = useState('IPTV Player');

    useEffect(() => {
        loadUserInfo();
    }, []);

    const loadUserInfo = async () => {
        try {
            const credentials = await AsyncStorage.getItem('iptv_credentials');
            const user = await AsyncStorage.getItem('iptv_user_info');

            if (credentials) {
                const creds = JSON.parse(credentials);
                setPlaylistName(creds.playlistName || 'IPTV Player');
            }

            if (user) {
                setUserInfo(JSON.parse(user));
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('iptv_credentials');
                        await AsyncStorage.removeItem('iptv_user_info');
                        await AsyncStorage.removeItem('iptv_server_info');
                        navigation.replace('Login');
                    },
                },
            ]
        );
    };

    const menuItems = [
        {
            id: 'live',
            title: 'Live TV',
            icon: '📡',
            description: 'Watch live television channels',
            screen: 'LiveTV',
            color: '#2563eb',
        },
        {
            id: 'movies',
            title: 'Movies',
            icon: '🎬',
            description: 'Browse video on demand',
            screen: 'Movies',
            color: '#dc2626',
        },
        {
            id: 'series',
            title: 'TV Series',
            icon: '📺',
            description: 'Watch TV shows and series',
            screen: 'Series',
            color: '#16a34a',
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{playlistName}</Text>
                    {userInfo && (
                        <Text style={styles.headerSubtitle}>
                            Welcome, {userInfo.username}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Account Info Card */}
                {userInfo && (
                    <View style={styles.accountCard}>
                        <Text style={styles.accountCardTitle}>Account Status</Text>
                        <View style={styles.accountInfo}>
                            <View style={styles.accountInfoItem}>
                                <Text style={styles.accountInfoLabel}>Status</Text>
                                <View style={[styles.statusBadge, styles.statusActive]}>
                                    <Text style={styles.statusText}>Active</Text>
                                </View>
                            </View>
                            <View style={styles.accountInfoItem}>
                                <Text style={styles.accountInfoLabel}>Max Connections</Text>
                                <Text style={styles.accountInfoValue}>
                                    {userInfo.max_connections || 'N/A'}
                                </Text>
                            </View>
                            {userInfo.exp_date && (
                                <View style={styles.accountInfoItem}>
                                    <Text style={styles.accountInfoLabel}>Expires</Text>
                                    <Text style={styles.accountInfoValue}>
                                        {new Date(parseInt(userInfo.exp_date) * 1000).toLocaleDateString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <Text style={styles.sectionTitle}>Browse Content</Text>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                                    <Text style={styles.menuIconText}>{item.icon}</Text>
                                </View>
                                <View style={styles.menuTextContainer}>
                                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                                    <Text style={styles.menuItemDescription}>
                                        {item.description}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>About</Text>
                    <Text style={styles.infoText}>
                        This IPTV player allows you to watch live TV, movies, and series from your IPTV provider.
                        Make sure you have a stable internet connection for the best streaming experience.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#71717a',
        marginTop: 2,
    },
    logoutButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    logoutButtonText: {
        color: '#71717a',
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    accountCard: {
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272a',
        padding: 16,
        marginBottom: 24,
    },
    accountCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    accountInfo: {
        gap: 12,
    },
    accountInfoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accountInfoLabel: {
        fontSize: 14,
        color: '#a1a1aa',
    },
    accountInfoValue: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#22c55e',
    },
    menuContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272a',
        padding: 16,
        marginBottom: 12,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuIconText: {
        fontSize: 24,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    menuItemDescription: {
        fontSize: 14,
        color: '#71717a',
    },
    menuArrow: {
        fontSize: 28,
        color: '#3f3f46',
        fontWeight: '300',
    },
    infoSection: {
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272a',
        padding: 16,
        marginBottom: 24,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#a1a1aa',
        lineHeight: 20,
    },
});

export default HomeScreen;