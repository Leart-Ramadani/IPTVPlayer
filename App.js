// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import LiveTVScreen from './src/screens/LiveTVScreen';
import MoviesScreen from './src/screens/MoviesScreen';
import SeriesScreen from './src/screens/SeriesScreen';
import SeriesDetailScreen from './src/screens/SeriesDetailScreen';
import MovieDetailScreen from './src/screens/MovieDetailScreen';
import PlayerScreen from './src/screens/PlayerScreen';

const Stack = createStackNavigator();

export default function App() {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#09090b" />
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Splash"
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: '#09090b',
                            elevation: 0,
                            shadowOpacity: 0,
                            borderBottomWidth: 1,
                            borderBottomColor: '#27272a',
                        },
                        headerTintColor: '#ffffff',
                        headerTitleStyle: {
                            fontWeight: '600',
                            fontSize: 18,
                        },
                        cardStyle: { backgroundColor: '#09090b' },
                    }}
                >
                    <Stack.Screen
                        name="Splash"
                        component={SplashScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="LiveTV"
                        component={LiveTVScreen}
                        options={{ title: 'Live TV' }}
                    />
                    <Stack.Screen
                        name="Movies"
                        component={MoviesScreen}
                        options={{ title: 'Movies' }}
                    />
                    <Stack.Screen
                        name="MovieDetail"
                        component={MovieDetailScreen}
                        options={{ title: 'Movie Details' }}
                    />
                    <Stack.Screen
                        name="Series"
                        component={SeriesScreen}
                        options={{ title: 'TV Series' }}
                    />
                    <Stack.Screen
                        name="SeriesDetail"
                        component={SeriesDetailScreen}
                        options={{ title: 'Series Details' }}
                    />
                    <Stack.Screen
                        name="Player"
                        component={PlayerScreen}
                        options={{ headerShown: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </>
    );
}