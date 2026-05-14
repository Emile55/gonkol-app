import React, { useRef } from 'react';
import { View, Text, FlatList, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

import LoginForm from '../../components/auth/LoginForm';
import SignupForm from '../../components/auth/SignupForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

type ScrollToFunc = (index: number) => void;

const slides = [
  {
    id: '1',
    key: 'signup',
    lottie: require('../../assets/lotie3.json'),
    title: 'Prêt à rejoindre la Guilde ?',
    description: 'Créez votre compte pour commencer votre aventure.',
    form: (scrollTo: ScrollToFunc) => <SignupForm scrollTo={scrollTo} />,
    bgColor: '#AF52DE',
  },
  {
    id: '2',
    key: 'login',
    lottie: require('../../assets/lotie2.json'),
    title: 'Content de vous revoir !',
    description: 'Connectez-vous pour continuer vos quêtes.',
    form: (scrollTo: ScrollToFunc) => <LoginForm scrollTo={scrollTo} />,
    bgColor: '#007AFF',
  },
  {
    id: '3',
    key: 'forgot',
    lottie: require('../../assets/lotie5.json'),
    title: 'Besoin d\'une potion de mémoire ?',
    description: 'Récupérez votre mot de passe en un instant.',
    form: (scrollTo: ScrollToFunc) => <ForgotPasswordForm scrollTo={scrollTo} />,
    bgColor: '#34C759',
  },
];

const Paginator = ({ data, scrollX }: { data: any[], scrollX: Animated.Value }) => {
    const { width } = useWindowDimensions();
    return (
        <View className="flex-row h-16 justify-center items-center">
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
                });
                return <Animated.View className="h-2.5 rounded-full bg-blue-600 mx-2" style={[{ width: dotWidth, opacity }]} key={i.toString()} />
            })}
        </View>
    )
}

const AuthSlide = ({ item, scrollTo }: { item: typeof slides[0], scrollTo: ScrollToFunc }) => {
    const { width } = useWindowDimensions();
    return (
        <View style={{ width }} className="flex-1 items-center justify-center p-6 bg-gray-50">
            <LottieView
                source={item.lottie}
                autoPlay
                loop
                style={{ width: width * 0.7, height: width * 0.7 }}
            />
            <Text className="text-3xl font-bold text-slate-800 text-center mb-2">{item.title}</Text>
            <Text className="text-lg text-slate-600 text-center mb-8">{item.description}</Text>
            {item.form(scrollTo)}
        </View>
    );
}

export default function AuthScreen() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();

  const scrollTo = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const getItemLayout = (data: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
        <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={({ item }) => <AuthSlide item={item} scrollTo={scrollTo} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            bounces={false}
            keyExtractor={(item) => item.id}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: false,
            })}
            scrollEventThrottle={32}
            initialScrollIndex={1} // Start on the login screen
            getItemLayout={getItemLayout}
        />
        <Paginator data={slides} scrollX={scrollX} />
    </SafeAreaView>
  );
}
