import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MobileHeader from '@/components/MobileHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileMapSection from '@/components/MobileMapSection';
import { CreateDeliveryScreen } from '../_CreateDeliveryScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import HistoryScreen from '@/components/HistoryScreen';
import { Ranking } from '@/components/Ranking';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'home' | 'maquete' | 'createMission' | 'history' | 'profile'>('home');

  // Mode Focus pour la création de mission (sans bottom nav)
  if (activeTab === 'createMission') {
    return (
      <View style={styles.container}>
        <CreateDeliveryScreen onClose={() => setActiveTab('home')} />
      </View>
    );
  }

  // Mode Normal avec Bottom Nav
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <MobileMapSection />;
      case 'profile':
        return <ProfileScreen />;
      case 'maquete':
        return <Ranking />; 
      case 'history':
        return <HistoryScreen />; // À remplacer par votre composant Historique
      default:
        return <MobileMapSection />;
    }
  };

  return (
    <View style={styles.container}>
   
      <View style={styles.content}>
        {renderContent()}
      </View>
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    flex: 1,
  },
});

