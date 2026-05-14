import React from 'react';
import { View, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';


const ForgotPasswordScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center p-6"
      >
        
        <Text className="text-3xl font-bold text-slate-800 text-center mb-2">Potion de mémoire ?</Text>
        <View className="w-full">
          <ForgotPasswordForm />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
