import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingSlide from '@/components/OnboardingSlide';

const slides = [
  {
    id: '1',
    lottie: require('../assets/lotie2.json'),
    title: 'Devenez un Chasseur de Missions',
    description: 'Explorez une variété de quêtes et gagnez des récompenses pour chaque mission accomplie.',
    bgColor: '#007AFF', // Bleu
  },
  {
    id: '2',
    lottie: require('../assets/lotie5.json'),
    title: 'Des quêtes pour tous',
    description: 'Livraisons, services à la personne, missions communautaires... Il y en a pour tous les goûts !',
    bgColor: '#34C759', // Vert
  },
  {
    id: '3',
    lottie: require('../assets/lotie3.json'),
    title: 'Rejoindre l\'aventure !',
    description: 'Gagnez de l\'XP, débloquez des badges et devenez une légende de la communauté Gonkol.',
    bgColor: '#AF52DE', // Violet
  },
];

const Paginator = ({ data, scrollX }: { data: any[], scrollX: Animated.Value }) => {
    const { width } = useWindowDimensions();
    return (
        <View style={{ flexDirection: 'row', height: 64 }}>
            {data.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 20, 10],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                })

                return <Animated.View style={[styles.dot, { width: dotWidth, opacity }]} key={i.toString()} />
            })}
        </View>
    )
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <View style={{ flex: 3 }}>
        <FlatList
            data={slides}
            renderItem={({ item }) => <OnboardingSlide item={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            bounces={false}
            keyExtractor={(item) => item.id}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: false,
            })}
            scrollEventThrottle={32}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={viewConfig}
            ref={slidesRef}
        />
      </View>

      <Paginator data={slides} scrollX={scrollX} />

      {currentIndex === slides.length - 1 && (
        <View className="absolute bottom-20 w-4/5">
            <TouchableOpacity
            className="bg-[#493d8a] p-4 rounded-full items-center"
            onPress={() => router.replace('/auth/login')}>
            <Text className="text-white text-lg font-bold">Commencer</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = {
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#493d8a',
        marginHorizontal: 8,
    }
}
