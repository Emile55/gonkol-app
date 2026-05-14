import React from 'react';
import { View, KeyboardAvoidingView, Platform, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind'; // Import de nativewind pour le mode sombre

import LoginForm from '../../components/auth/LoginForm';


// Export as a named function so Expo Router reliably detects the default export
export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  // const isDark = colorScheme === 'dark'; // Non utilisé directement, mais les classes dark: le sont

  return (
    // 1. Mise à jour de l'arrière-plan pour le mode sombre
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center p-6" // Retirer items-center pour un meilleur centrage sur les grands écrans
      >
        <ScrollView 
            contentContainerClassName="flex-grow justify-center"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >

            {/* Section d'En-tête */}
            <View className="items-center mb-8 mt-10 md:mt-0"> 
                
                {/* 2. Titre adapté au thème sombre/clair */}
                <Text className="text-4xl font-extrabold text-zinc-900 dark:text-white text-center mb-2">
                    Content de vous revoir !
                </Text>
                
                {/* 3. Sous-titre adapté au thème sombre/clair */}
                <Text className="text-lg text-zinc-500 dark:text-zinc-400 text-center">
                    Connectez-vous pour continuer votre quête.
                </Text>
            </View>

            {/* Conteneur du Formulaire */}
            <View className="w-full">
                {/* Le composant LoginForm doit utiliser les styles verts et dark: que nous avons définis. */}
                <LoginForm />
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}