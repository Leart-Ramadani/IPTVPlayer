// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateUser } from '../api/xtreamAPI';

const LoginScreen = ({ navigation }) => {
    const [credentials, setCredentials] = useState({
        playlistName: '',
        serverUrl: '',
        username: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        checkSavedCredentials();
    }, []);

    const checkSavedCredentials = async () => {
        try {
            const savedCreds = await AsyncStorage.getItem('iptv_credentials');
            if (savedCreds) {
                const parsed = JSON.parse(savedCreds);
                setCredentials(parsed);
            }
        } catch (error) {
            console.log('Error loading saved credentials:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setCredentials(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const validateInputs = () => {
        if (!credentials.serverUrl.trim()) {
            Alert.alert('Error', 'Please enter Server URL');
            return false;
        }
        if (!credentials.username.trim()) {
            Alert.alert('Error', 'Please enter Username');
            return false;
        }
        if (!credentials.password.trim()) {
            Alert.alert('Error', 'Please enter Password');
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (!validateInputs()) return;

        setIsLoading(true);

        try {
            // Authenticate with Xtream Codes API
            const response = await authenticateUser(
                credentials.serverUrl,
                credentials.username,
                credentials.password
            );

            if (response.user_info && response.user_info.auth === 1) {
                // Save credentials
                await AsyncStorage.setItem('iptv_credentials', JSON.stringify(credentials));
                await AsyncStorage.setItem('iptv_user_info', JSON.stringify(response.user_info));
                await AsyncStorage.setItem('iptv_server_info', JSON.stringify(response.server_info));

                setIsLoading(false);
                navigation.replace('Home');
            } else {
                setIsLoading(false);
                Alert.alert('Login Failed', 'Invalid credentials or server URL');
            }
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Connection Error', 'Failed to connect to IPTV server. Please check your server URL and try again.');
            console.error('Login error:', error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.iconText}>📺</Text>
                        </View>
                        <Text style={styles.title}>IPTV Player</Text>
                        <Text style={styles.subtitle}>Enter your credentials to continue</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Playlist Name
                                <Text style={styles.optional}> (Optional)</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={credentials.playlistName}
                                onChangeText={(text) => handleInputChange('playlistName', text)}
                                placeholder="My IPTV"
                                placeholderTextColor="#71717a"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Server URL
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={credentials.serverUrl}
                                onChangeText={(text) => handleInputChange('serverUrl', text)}
                                placeholder="http://example.com:8080"
                                placeholderTextColor="#71717a"
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Username
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={credentials.username}
                                onChangeText={(text) => handleInputChange('username', text)}
                                placeholder="Enter username"
                                placeholderTextColor="#71717a"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Password
                                <Text style={styles.required}> *</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={credentials.password}
                                onChangeText={(text) => handleInputChange('password', text)}
                                placeholder="Enter password"
                                placeholderTextColor="#71717a"
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.infoText}>
                            By logging in, you agree to use this service responsibly
                        </Text>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoBoxText}>
                            <Text style={styles.infoBoxBold}>Note:</Text> Your IPTV provider will give you the Server URL, Username, and Password needed to access their content.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        marginBottom: 8,
    },
    iconText: {
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#71717a',
    },
    formContainer: {
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272a',
        padding: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#d4d4d8',
        marginBottom: 8,
    },
    optional: {
        color: '#52525b',
    },
    required: {
        color: '#ef4444',
    },
    input: {
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: '#3f3f46',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#ffffff',
    },
    loginButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    loginButtonDisabled: {
        backgroundColor: '#3f3f46',
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 12,
        color: '#52525b',
        textAlign: 'center',
        marginTop: 16,
    },
    infoBox: {
        backgroundColor: 'rgba(24, 24, 27, 0.5)',
        borderWidth: 1,
        borderColor: '#27272a',
        borderRadius: 8,
        padding: 16,
        marginTop: 24,
    },
    infoBoxText: {
        fontSize: 12,
        color: '#71717a',
        lineHeight: 18,
    },
    infoBoxBold: {
        fontWeight: '600',
        color: '#a1a1aa',
    },
});

export default LoginScreen;