import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Reanimated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { MotiView } from 'moti';

// Allow animating the 'text' prop on TextInput
Reanimated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Reanimated.createAnimatedComponent(TextInput);

interface AnimatedStatProps {
  value: number;
  label: string;
  colorClass: string;
  delay?: number;
}

export const AnimatedStat = ({ value, label, colorClass, delay = 0 }: AnimatedStatProps) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 1200, // Slower animation for better effect
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const hasDecimal = value % 1 !== 0;
    const textValue = hasDecimal 
      ? animatedValue.value.toFixed(1) 
      : Math.floor(animatedValue.value).toString();
    return {
      text: textValue,
    } as any;
  });

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay }}
      className="flex-1 bg-white/60 rounded-2xl p-4 items-center border border-gray-200/50 shadow-sm"
    >
      <AnimatedTextInput
        underlineColorAndroid="transparent"
        editable={false}
        style={[styles.number, { color: colorClass }]}
        animatedProps={animatedProps}
      />
      <Text className="text-xs text-gray-600 mt-1 font-medium">{label}</Text>
    </MotiView>
  );
};

// Using StyleSheet for the font style to avoid className issues with animated components
const styles = StyleSheet.create({
    number: {
        fontSize: 28,
        fontWeight: 'bold',
    }
})

export default AnimatedStat;
