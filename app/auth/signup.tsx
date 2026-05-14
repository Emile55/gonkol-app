import React from 'react';
import { View, KeyboardAvoidingView, Platform, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
// Assurez-vous que ce chemin est correct
import SignupForm from '../../components/auth/SignupForm'; 


const SignupScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    // 1. Mise à jour de l'arrière-plan pour le mode sombre
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerClassName="flex-grow justify-center p-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section d'En-tête */}
          <View className="items-center mb-8 mt-10 md:mt-0"> 
            
            {/* 2. Titre adapté au thème sombre/clair */}
            <Text className="text-4xl font-extrabold text-zinc-900 dark:text-white text-center mb-2">
              Rejoindre la Guilde
            </Text>
            
            {/* 3. Sous-titre adapté au thème sombre/clair */}
            <Text className="text-lg text-zinc-500 dark:text-zinc-400 text-center">
              Créez votre compte pour commencer votre quête.
            </Text>
          </View>

          {/* Conteneur du Formulaire */}
          <View className="w-full">
            {/* NOTE: Le composant SignupForm doit maintenant utiliser des champs de formulaire
              et des boutons cohérents avec le thème vert (#16a34a) et le support du mode sombre.
            */}
            <SignupForm />
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;