import React from 'react';
import { View, Text } from 'react-native';
import { Star, Zap, Shield } from 'lucide-react-native';

export const AchievementBadges = () => (
  <View className="mb-6">
    <Text className="font-semibold text-white mb-3 text-center">Badges</Text>
    <View className="flex-row justify-center space-x-4">
      <View className="items-center">
        <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center">
          <Star color="#f59e0b" />
        </View>
        <Text className="text-xs mt-1 text-white">Fiable</Text>
      </View>
      <View className="items-center">
        <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center">
          <Zap color="#8b5cf6" />
        </View>
        <Text className="text-xs mt-1 text-white">Rapide</Text>
      </View>
      <View className="items-center">
        <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
          <Shield color="#10b981" />
        </View>
        <Text className="text-xs mt-1 text-white">Pro</Text>
      </View>
    </View>
  </View>
);

export default AchievementBadges;
