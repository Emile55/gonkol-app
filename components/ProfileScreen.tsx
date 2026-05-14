
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme, Image } from 'react-native';
import { Settings, History, Bell, LogOut, ChevronRight, Award, Star, TrendingUp, Flame } from 'lucide-react-native';
import { UserProfile } from './UserProfile';
import AnimatedStat from './AnimatedStat';
import { AchievementBadges } from './AchievementBadges';
import { Ranking } from './Ranking';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const ActionButton = ({ label, icon, onPress, isDestructive, isDark }: { label: string, icon: React.ReactNode, onPress: () => void, isDestructive?: boolean, isDark?: boolean }) => (
    <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        style={{
            width: '100%', 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            height: 56, 
            borderRadius: 12, 
            padding: 16,
            marginBottom: 8,
            borderWidth: 2,
            borderBottomWidth: 4,
            borderColor: isDestructive ? '#dc2626' : (isDark ? '#27272a' : '#e5e7eb'),
            backgroundColor: isDestructive
                ? (isDark ? '#18181b' : '#fff')
                : (isDark ? '#18181b' : '#fff'),
        }}
    >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon}
            <Text style={{ 
                marginLeft: 14, 
                fontWeight: '700', 
                fontSize: 15,
                color: isDestructive ? '#dc2626' : (isDark ? '#fff' : '#18181b') 
            }}>
                {label}
            </Text>
        </View>
        <ChevronRight size={20} color={isDestructive ? '#dc2626' : (isDark ? '#71717a' : '#9ca3af')} />
    </TouchableOpacity>
);

const StatCard = ({ value, label, icon, gradient, isDark }: { value: string | number, label: string, icon: React.ReactNode, gradient: string[], isDark: boolean }) => (
    <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 200 }}
        style={{ flex: 1 }}
    >
        <View style={{
            borderRadius: 16,
            borderWidth: 2,
            borderBottomWidth: 4,
            borderColor: isDark ? '#27272a' : '#e5e7eb',
            backgroundColor: isDark ? '#18181b' : '#fff',
            overflow: 'hidden',
        }}>
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    padding: 20,
                    alignItems: 'center',
                }}
            >
                <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    borderWidth: 3,
                    borderColor: 'rgba(255,255,255,0.5)',
                }}>
                    {icon}
                </View>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>
                    {value}
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                </Text>
            </LinearGradient>
        </View>
    </MotiView>
);


export function ProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const handleLogout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            router.replace('/auth/login');
        } catch {
            alert('Erreur lors de la déconnexion');
        }
    };
    // Harmonisation des couleurs dark avec MobileBottomNav
    const mainBg = isDark ? '#18181b' : '#f5f5f5';
    
    return (
        <ScrollView 
            style={{ flex: 1, backgroundColor: mainBg }} 
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 24 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={{ paddingHorizontal: 16 }}>
                {/* Header Profile */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                >
                    <UserProfile />
                </MotiView>

              

                {/* Statistique secondaire */}
               

                {/* Badges et Classement avec bordures Duolingo */}
                

               

                {/* Section Actions - Titre Duolingo style */}
                <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '700', 
                    color: isDark ? '#fff' : '#18181b',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}>
                    Paramètres
                </Text>

                {/* Menu d'actions style Duolingo */}
                <View style={{ marginBottom: 24 }}>
                    <ActionButton 
                        label="Historique des livraisons" 
                        icon={<History size={24} color={isDark ? '#fff' : '#3f3f46'} strokeWidth={2.5} />} 
                        onPress={() => {}} 
                        isDark={isDark} 
                    />
                    <ActionButton 
                        label="Notifications" 
                        icon={<Bell size={24} color={isDark ? '#fff' : '#3f3f46'} strokeWidth={2.5} />} 
                        onPress={() => {}} 
                        isDark={isDark} 
                    />
                  
                </View>

                {/* Déconnexion style Duolingo */}
                <ActionButton 
                    label="Se déconnecter" 
                    icon={<LogOut size={24} color="#dc2626" strokeWidth={2.5} />} 
                    onPress={handleLogout} 
                    isDestructive 
                    isDark={isDark} 
                />
            </View>
        </ScrollView>
    );
}

export default ProfileScreen;
