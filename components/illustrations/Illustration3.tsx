import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { Users, Star, Shield } from 'lucide-react-native';
import { Easing } from 'react-native-reanimated';

const Illustration3 = () => {
  return (
    <View className="w-48 h-48 mx-auto mb-8">
      <MotiView
        from={{ rotate: '0deg' }}
        animate={{ rotate: '360deg' }}
        transition={{ loop: true, type: 'timing', duration: 8000, easing: Easing.linear }}
        className="absolute inset-8 border-4 border-purple-200 rounded-full"
      />

      <View className="absolute top-12 left-1/2 -translate-x-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
        <Users size={24} color="#a855f7" />
      </View>

      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: -5 }}
        transition={{ loop: true, type: 'timing', duration: 2000 }}
        className="absolute top-20 left-16 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md"
      >
        <Star size={16} color="white" />
      </MotiView>

      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: 5 }}
        transition={{ loop: true, type: 'timing', duration: 2000, delay: 500 }}
        className="absolute top-20 right-16 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shadow-md"
      >
        <Shield size={16} color="white" />
      </MotiView>

      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: 1.1 }}
        transition={{ loop: true, type: 'timing', duration: 2000, delay: 1000 }}
        className="absolute bottom-16 left-1/2 -translate-x-5 w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center shadow-md"
      >
        <Text className="text-white font-bold text-xs">#1</Text>
      </MotiView>
    </View>
  );
};

export default Illustration3;
