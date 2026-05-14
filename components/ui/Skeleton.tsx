import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseColor = isDark ? '#27272a' : '#e5e7eb'; // zinc-800 : gray-200
  const highlightColor = isDark ? '#3f3f46' : '#f3f4f6'; // zinc-700 : gray-100

  return (
    <View style={[{ width, height, borderRadius, backgroundColor: baseColor, overflow: 'hidden' }, style]}>
      <MotiView
        from={{ translateX: -Math.max(Number(width) || 300, 300) }}
        animate={{ translateX: Math.max(Number(width) || 300, 300) }}
        transition={{
          type: 'timing',
          duration: 1200,
          loop: true,
          repeatReverse: false,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <LinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </MotiView>
    </View>
  );
};
