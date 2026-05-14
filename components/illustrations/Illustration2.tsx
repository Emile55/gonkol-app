import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

const Illustration2 = () => {
  return (
    <View className="w-48 h-48 mx-auto mb-8 bg-green-100 rounded-3xl overflow-hidden">
      <View className="absolute inset-4 bg-white rounded-2xl">
        <View className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
        <View className="absolute top-8 left-4 right-4 h-0.5 bg-gray-200" />
        <View className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-200" />
        <View className="absolute left-12 top-2 bottom-2 w-0.5 bg-gray-200" />

        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: 1.2 }}
          transition={{ loop: true, type: 'timing', duration: 2000, delay: 0 }}
          className="absolute top-6 left-8 w-3 h-3 bg-green-500 rounded-full"
        />
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: 1.2 }}
          transition={{ loop: true, type: 'timing', duration: 2000, delay: 500 }}
          className="absolute top-12 right-8 w-3 h-3 bg-blue-500 rounded-full"
        />
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: 1.2 }}
          transition={{ loop: true, type: 'timing', duration: 2000, delay: 1000 }}
          className="absolute bottom-8 left-12 w-3 h-3 bg-orange-500 rounded-full"
        />
      </View>
    </View>
  );
};

export default Illustration2;
