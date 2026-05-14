import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { Package, Zap } from 'lucide-react-native';

const Illustration1 = () => {
  return (
    <View className="w-48 h-48 mx-auto mb-8">
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: -10 }}
        transition={{ loop: true, type: 'timing', duration: 2000, delay: 0 }}
        className="absolute top-8 left-12 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl"
      >
        <Package size={40} color="#ef4444" />
      </MotiView>
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: 10 }}
        transition={{ loop: true, type: 'timing', duration: 2000, delay: 500 }}
        className="absolute top-20 right-8 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
      >
        <Zap size={24} color="white" />
      </MotiView>
      <MotiView
        from={{ rotate: '0deg' }}
        animate={{ rotate: '10deg' }}
        transition={{ loop: true, type: 'timing', duration: 3000, delay: 0 }}
        className="absolute bottom-12 left-16 w-20 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg"
      >
        <Text className="text-white font-bold text-sm">Express</Text>
      </MotiView>
    </View>
  );
};

export default Illustration1;
