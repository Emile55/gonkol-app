import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { useColorScheme } from '@/hooks/useColorScheme';
import { auth } from '@/config/firebase';

import '../global.css';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!loaded) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isOnboarding = segments[0] === 'onboarding';
      const inAuthGroup = segments[0] === 'auth';

      if (user) {
        if (isOnboarding || inAuthGroup) {
          router.replace('/(tabs)');
        }
      } else {
        if (!isOnboarding && !inAuthGroup) {
          router.replace('/onboarding');
        }
      }
    });

    return () => unsubscribe();
  }, [loaded, segments, router]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="CreateDeliveryScreen" options={{ headerShown: false }} />
            <Stack.Screen name="MissionDetailsScreen" options={{ headerShown: false }} />
            <Stack.Screen name="mission" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
