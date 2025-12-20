// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const SplashScreen = ({ navigation }) => {
    useEffect(() => {
        // Simulate loading time, then navigate to Login
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>📺</Text>
                <Text style={styles.title}>IPTV Player</Text>
                <Text style={styles.subtitle}>Your Entertainment Hub</Text>
            </View>

            <View style={styles.footer}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#71717a',
    },
    footer: {
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: '#71717a',
        marginTop: 12,
    },
});

export default SplashScreen;