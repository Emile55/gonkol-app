import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import LottieView from 'lottie-react-native';

type OnboardingSlideProps = {
  item: {
    id: string;
    lottie: any;
    title: string;
    description: string;
    bgColor: string;
  };
};

const OnboardingSlide = ({ item }: OnboardingSlideProps) => {
  const { width } = useWindowDimensions();

  return (
    <View
      className="flex-1 justify-center items-center p-4"
      style={{ width, backgroundColor: item.bgColor }}>
      <LottieView
        source={item.lottie}
        autoPlay
        loop
        style={{ width: 256, height: 256, marginBottom: 32 }}
      />
      <View className="flex-[0.3]">
        <Text className="font-extrabold text-3xl mb-2.5 text-white text-center px-4">
          {item.title}
        </Text>
        <Text className="font-light text-gray-200 text-center px-16">
          {item.description}
        </Text>
      </View>
    </View>
  );
};

export default OnboardingSlide;
