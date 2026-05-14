import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_WIDTH = SCREEN_WIDTH - 48; // Assume standard 24px padding on sides
const BUTTON_HEIGHT = 64;
const KNOB_SIZE = 54;
const MAX_TRANSLATE = BUTTON_WIDTH - KNOB_SIZE - 10; // 5px padding on edges

interface SlideToConfirmProps {
    title: string;
    onConfirm: () => void;
    baseColor?: [string, string]; // e.g. ['#16a34a', '#22c55e']
}

export const SlideToConfirm = ({ 
    title, 
    onConfirm, 
    baseColor = ['#16a34a', '#22c55e'] 
}: SlideToConfirmProps) => {
    const [confirmed, setConfirmed] = useState(false);
    const translateX = useSharedValue(0);

    const onGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
        onStart: () => {
            // Optional: light haptic on grab
        },
        onActive: (event) => {
            if (confirmed) return;
            // Clamp horizontal motion between 0 and MAX_TRANSLATE
            let nextTranslate = Math.max(0, Math.min(event.translationX, MAX_TRANSLATE));
            translateX.value = nextTranslate;
        },
        onEnd: () => {
            if (confirmed) return;
            
            if (translateX.value > MAX_TRANSLATE - 20) { // If slid almost to the end
                translateX.value = withSpring(MAX_TRANSLATE, { damping: 20, stiffness: 200 });
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                runOnJS(setConfirmed)(true);
                runOnJS(onConfirm)();
            } else { // Snap back if aborted
                translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    });

    const knobStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }]
        };
    });

    const textStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(confirmed ? 0 : Math.max(0, 1 - (translateX.value / MAX_TRANSLATE) * 2)),
            transform: [{ translateX: translateX.value * 0.2 }] // Slight parallax
        };
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={confirmed ? ['#059669', '#10b981'] : baseColor}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            >
                <Animated.View style={[styles.textContainer, textStyle]}>
                    <Text style={styles.title}>{title}</Text>
                </Animated.View>

                {confirmed && (
                    <Animated.View style={StyleSheet.absoluteFillObject} entering={withTiming(500)}>
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Check color="#fff" size={28} strokeWidth={3} />
                        </View>
                    </Animated.View>
                )}

                <PanGestureHandler onGestureEvent={onGestureEvent}>
                    <Animated.View style={[styles.knob, knobStyle]}>
                        <ChevronRight color="#16a34a" size={28} strokeWidth={3} />
                    </Animated.View>
                </PanGestureHandler>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_HEIGHT / 2,
        overflow: 'hidden',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    backgroundGradient: {
        flex: 1,
        justifyContent: 'center',
        padding: 5,
    },
    knob: {
        width: KNOB_SIZE,
        height: KNOB_SIZE,
        borderRadius: KNOB_SIZE / 2,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    textContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: KNOB_SIZE, // Offset to not be covered by initial knob
    }
});
