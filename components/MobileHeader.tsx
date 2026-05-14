import React from 'react';
import { View, Text, Image } from 'react-native';


const MobileHeader = () => {
  return (
    <View className="absolute top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 pt-4 z-10 flex-row justify-between items-center border-b border-gray-200/70 dark:border-gray-800/70">
    
      <View>
        <Image
          source={require('../assets/images/gk.png')}
          style={{ width: 36, height: 36, borderRadius: 8 }}
          resizeMode="contain"
        />
      </View>
      
    </View>
  );
};

export default MobileHeader;
