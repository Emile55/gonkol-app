import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Trophy, Medal, Crown } from 'lucide-react-native';

const LEADERBOARD_DATA = [
  { id: '1', name: 'AlphaRunner', score: 15420, missions: 142, avatar: 'https://i.pravatar.cc/150?u=b042581f4e29026704d' },
  { id: '2', name: 'ShadowHunter', score: 14500, missions: 124, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', isMe: true },
  { id: '3', name: 'QuickDeliver', score: 13200, missions: 110, avatar: 'https://i.pravatar.cc/150?u=c042581f4e29026704d' },
  { id: '4', name: 'NightRider', score: 11000, missions: 98, avatar: 'https://i.pravatar.cc/150?u=d042581f4e29026704d' },
  { id: '5', name: 'CityFlash', score: 9500, missions: 85, avatar: 'https://i.pravatar.cc/150?u=e042581f4e29026704d' },
  { id: '6', name: 'UrbanLegend', score: 8200, missions: 72, avatar: 'https://i.pravatar.cc/150?u=f042581f4e29026704d' },
  { id: '7', name: 'RoadMaster', score: 7800, missions: 68, avatar: 'https://i.pravatar.cc/150?u=g042581f4e29026704d' },
];

const RankItem = ({ item, index }: { item: any, index: number }) => {
  const isTop3 = index < 3;
  let RankIcon = null;
  let rankColor = '#71717a'; // zinc-500

  if (index === 0) {
    RankIcon = <Crown size={24} color="#fbbf24" fill="#fbbf24" />; // Gold
    rankColor = '#fbbf24';
  } else if (index === 1) {
    RankIcon = <Medal size={24} color="#94a3b8" fill="#94a3b8" />; // Silver
    rankColor = '#94a3b8';
  } else if (index === 2) {
    RankIcon = <Medal size={24} color="#b45309" fill="#b45309" />; // Bronze
    rankColor = '#b45309';
  }

  return (
    <View className={`flex-row items-center p-4 mb-3 rounded-2xl border ${item.isMe ? 'bg-green-500/10 border-green-500/30' : 'bg-[#18181b] border-[#27272a]'}`}>
      <View className="w-8 items-center justify-center mr-3">
        {RankIcon ? RankIcon : <Text className="text-zinc-500 font-bold text-lg">#{index + 1}</Text>}
      </View>
      
      <Image 
        source={{ uri: item.avatar }} 
        className={`w-12 h-12 rounded-full border-2 mr-3`}
        style={{ borderColor: isTop3 ? rankColor : '#3f3f46' }}
      />
      
      <View className="flex-1">
        <Text className={`font-bold text-base ${item.isMe ? 'text-green-400' : 'text-white'}`}>
          {item.name} {item.isMe && '(Moi)'}
        </Text>
        <Text className="text-zinc-500 text-xs">{item.missions} missions</Text>
      </View>
      
      <View className="items-end">
        <Text className="text-white font-black text-lg">{(item.score / 1000).toFixed(1)}k</Text>
        <Text className="text-zinc-500 text-[10px] uppercase font-bold">XP</Text>
      </View>
    </View>
  );
};

export const Ranking = () => {
  return (
    <View className="flex-1 bg-[#09090b] pt-12 px-4">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-white text-2xl font-black uppercase italic tracking-tighter">
            Classement
          </Text>
          <Text className="text-zinc-400 text-sm">Meilleurs Chasseurs de la Ville</Text>
        </View>
        <View className="bg-yellow-500/20 p-3 rounded-full border border-yellow-500/30">
          <Trophy size={24} color="#fbbf24" fill="#fbbf24" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {LEADERBOARD_DATA.map((item, index) => (
          <RankItem key={item.id} item={item} index={index} />
        ))}
      </ScrollView>
    </View>
  );
};

export default Ranking;
