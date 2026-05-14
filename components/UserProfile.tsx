import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, useColorScheme, Alert, ActivityIndicator, ScrollView, Modal, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
// Ajout des nouvelles icônes nécessaires (Award, Crown, Lock, Star)
import { Edit2, Zap, Shield, Wallet, Settings, Bike, FileText, HelpCircle, LogOut, ChevronRight, History, UserCheck, PlusCircle, Award, Crown, Lock, Star } from 'lucide-react-native';

// --- Données Simples pour la Démonstration du Switch ---
interface Account {
    uid: string;
    name: string;
    current: boolean;
    avatarUri: string;
}

const MOCK_ACCOUNTS: Account[] = [
    { uid: 'current_user_id', name: 'ShadowHunter', current: true, avatarUri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    { uid: 'secondary_user_id', name: 'AlphaRunner', current: false, avatarUri: 'https://i.pravatar.cc/150?u=b042581f4e29026704d' },
    { uid: 'tertiary_user_id', name: 'QuickDeliver', current: false, avatarUri: 'https://i.pravatar.cc/150?u=c042581f4e29026704d' },
];

// --- CONFIGURATION DES BADGES ---
const BADGES_CONFIG = [
    {
        id: 'first_blood',
        name: 'Premiers Pas',
        description: '1ère mission terminée',
        icon: Star,
        color: '#fbbf24', // Amber
        condition: (stats: any) => stats.count >= 1
    },
    {
        id: 'veteran',
        name: 'Vétéran',
        description: '10 missions terminées',
        icon: Shield,
        color: '#38bdf8', // Sky Blue
        condition: (stats: any) => stats.count >= 10
    },
    {
        id: 'legend',
        name: 'Légende',
        description: '50 missions terminées',
        icon: Crown,
        color: '#a855f7', // Purple
        condition: (stats: any) => stats.count >= 50
    },
    {
        id: 'rich',
        name: 'Business Man',
        description: '100k FCFA cumulés',
        icon: Wallet,
        color: '#22c55e', // Green
        condition: (stats: any) => stats.earnings >= 100000
    }
];
// ----------------------------------------------------


export const UserProfile = () => {
    // const xpPercentage = 75; // Removed static value
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState<number>(0);
    const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
    const [completedMissions, setCompletedMissions] = useState<any[]>([]);
    const [missionCount, setMissionCount] = useState(0);

    // --- NOUVEAUX ÉTATS POUR LA GAMIFICATION ---
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [xpToNextLevel, setXpToNextLevel] = useState(1000);
    const [progress, setProgress] = useState(0);
    
    // État pour les badges
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
    
    // État pour la modale de switch de compte
    const [isAccountSwitchModalVisible, setAccountSwitchModalVisible] = useState(false);
    const [currentAccount, setCurrentAccount] = useState<Account>(MOCK_ACCOUNTS[0]);


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (user) {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setName(data.name || currentAccount.name); 
                        // Le solde est calculé dynamiquement via les missions
                    } else {
                         setName(currentAccount.name);
                    }
                } else {
                    setName(currentAccount.name);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [currentAccount.uid]);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) return;

        const q = query(
            collection(db, 'missions'),
            where('chasseurId', '==', user.uid),
            orderBy('acceptedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const missions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            const activeStatuses = ['acceptée', 'acceptee', 'en_cours', 'arrived_pickup', 'arrived_dropoff', 'En_cours'];
            const past = missions.filter((m: any) => !activeStatuses.includes(m.statut));
            
            setCompletedMissions(past);
            setMissionCount(past.length);

            // --- CALCUL DE LA GAMIFICATION ---
            let totalXp = 0;
            let totalEarnings = 0; // Pour le badge "Business Man"
            
            // 1. Calculer l'XP total basé sur les missions passées
            past.forEach((m: any) => {
                // Base XP par mission terminée
                totalXp += 150; 
                
                // Bonus XP basé sur le prix (1 XP tous les 100 FCFA)
                if (m.price) {
                    const priceVal = typeof m.price === 'number' ? m.price : parseInt(m.price.toString().replace(/\s/g, ''), 10) || 0;
                    totalXp += Math.floor(priceVal / 100);
                    totalEarnings += priceVal; // Cumul des gains
                }
            });

            // 2. Déterminer le niveau (Système de paliers progressifs)
            // Niveau 1: 0-1000, Niveau 2: 1000-2500, Niveau 3: 2500-4750... (Facteur 1.5)
            let currentLevel = 1;
            let levelCap = 1000;
            let previousCap = 0;

            while (totalXp >= levelCap) {
                currentLevel++;
                previousCap = levelCap;
                levelCap = Math.floor(levelCap * 1.5); // Chaque niveau est 50% plus dur à atteindre
            }

            // 3. Calculer le pourcentage de la barre
            const xpInCurrentLevel = totalXp - previousCap;
            const xpNeededForCurrentLevel = levelCap - previousCap;
            let progressPercent = (xpInCurrentLevel / xpNeededForCurrentLevel) * 100;
            
            // S'assurer que la barre n'est jamais vide (min 5% pour l'esthétique) ou > 100%
            progressPercent = Math.min(Math.max(progressPercent, 5), 100);

            // --- CALCUL DES BADGES ---
            const stats = { count: past.length, earnings: totalEarnings };
            const newUnlocked = BADGES_CONFIG
                .filter(badge => badge.condition(stats))
                .map(b => b.id);
            
            setUnlockedBadges(newUnlocked);

            setXp(totalXp);
            setLevel(currentLevel);
            setXpToNextLevel(levelCap);
            setProgress(progressPercent);
            setBalance(totalEarnings);

        }, (error) => {
            console.log("Error fetching missions:", error);
        });

        return () => unsubscribe();
    }, []);

    const handleWithdraw = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        
        setWithdrawLoading(true);
        setTimeout(() => {
            setWithdrawLoading(false);
            Alert.alert("Succès", "Demande envoyée. (Simulation)");
        }, 1500);
    };

    const handleSignOut = async () => {
        try {
            const auth = getAuth();
            await auth.signOut();
            router.replace('/auth/login');
        } catch (error) {
            Alert.alert('Erreur', "Impossible de se déconnecter");
        }
    };
    
    // Logique de Switch de Compte (inchangée)
    const handleAccountSwitch = (account: Account) => {
        if (!account.current) {
            setCurrentAccount(account);
            setAccountSwitchModalVisible(false);
            setLoading(true); 
            Alert.alert("Changement de Compte", `Connexion à ${account.name} réussie! (Simulation)`);
        }
    };
    
    // --- Composant de la Modale de Switch (inchangé) ---
    const AccountSwitchModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isAccountSwitchModalVisible}
            onRequestClose={() => setAccountSwitchModalVisible(false)}
        >
            <View className="flex-1 justify-end bg-black/70">
                <View className="bg-zinc-900 p-6 rounded-t-3xl max-h-[80%] border-t border-zinc-800">
                    <Text className="text-white text-xl font-bold mb-4">Changer de Compte</Text>
                    
                    <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }}>
                        {MOCK_ACCOUNTS.map((account) => (
                            <TouchableOpacity
                                key={account.uid}
                                className={`flex-row items-center p-3 mb-2 rounded-xl border ${
                                    account.current ? 'border-green-500 bg-green-500/10' : 'border-zinc-700 bg-zinc-800'
                                }`}
                                onPress={() => handleAccountSwitch(account)}
                                disabled={account.current}
                            >
                                <Image
                                    source={{ uri: account.avatarUri }}
                                    className="w-10 h-10 rounded-full mr-3"
                                />
                                <View className="flex-1">
                                    <Text className="text-white font-bold">{account.name}</Text>
                                    <Text className="text-zinc-400 text-xs">ID: {account.uid.substring(0, 8)}...</Text>
                                </View>
                                {account.current && <UserCheck size={20} color="#22c55e" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Option d'ajouter un nouveau compte */}
                    <TouchableOpacity
                        className="flex-row items-center p-3 mt-4 rounded-xl border border-zinc-700 bg-zinc-800"
                        onPress={() => {
                            setAccountSwitchModalVisible(false);
                            router.push('/auth/login?mode=addAccount'); 
                        }}
                    >
                        <PlusCircle size={20} color="#a1a1aa" />
                        <Text className="text-white font-bold ml-3">Ajouter un autre compte</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        className="mt-4 p-3 rounded-xl bg-zinc-700 items-center"
                        onPress={() => setAccountSwitchModalVisible(false)}
                    >
                        <Text className="text-white font-semibold">Fermer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
    // ---------------------------------------------


    return (
        <ScrollView className="flex-1 bg-[#09090b]" contentContainerStyle={{ padding: 16, paddingTop: 40, paddingBottom: 40 }}>
            
            <AccountSwitchModal />
            
            {/* HEADER DU PROFIL (Rétabli) */}
            <View className="flex-row justify-between items-start mb-6">
                
                {/* 1. Bouton "Modifier" à gauche pour l'alignement */}
                <TouchableOpacity 
                    onPress={() => router.push('/profile/EditNameScreen')}
                    className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800"
                    // Rétablit l'option d'édition du nom, visuellement à gauche
                >
                    <Edit2 size={18} color="#a1a1aa" />
                </TouchableOpacity> 
                
                <View className="items-center">
                    <MotiView
                        from={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring' }}
                        className="relative"
                    >
                        <View className="absolute -inset-1 rounded-full bg-cyan-500 opacity-20 blur-lg" />
                        <View className="w-28 h-28 rounded-full border-2 border-cyan-400 p-1">
                            <Image
                                source={{ uri: currentAccount.avatarUri }} 
                                className="w-full h-full rounded-full"
                            />
                            <View className="absolute bottom-0 right-0 bg-[#09090b] rounded-full p-1 border border-cyan-500">
                                <Shield size={16} color="#22d3ee" fill="#22d3ee" />
                            </View>
                        </View>
                    </MotiView>

                    {/* Zone du nom, rendue cliquable pour le SWITCH (Centrée) */}
                    <TouchableOpacity 
                        onPress={() => setAccountSwitchModalVisible(true)} // Ouvre la modale
                        className="flex-row items-center mt-4"
                    >
                        <Text className="text-white text-2xl font-bold mr-1 tracking-wider">
                            {loading ? 'Chargement...' : name || 'ShadowHunter'}
                        </Text>
                        {/* Indicateur de clic pour le switch de compte */}
                        <ChevronRight size={20} color="#a1a1aa" /> 
                    </TouchableOpacity>
                    
                    <Text className="text-zinc-500 text-sm font-medium tracking-widest uppercase mt-1">
                        Livreur Élite • Niv. {level}
                    </Text>
                </View>

                {/* 2. Bouton Paramètres (Reste à droite) */}
                <TouchableOpacity 
                    onPress={() => router.push('/settings')}
                    className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800"
                >
                    <Settings size={20} color="#a1a1aa" />
                </TouchableOpacity>
            </View>
            
            {/* Reste du contenu (inchangé) */}
            
            {/* DASHBOARD GRID - STATS */}
            <View className="flex-row gap-3 mb-6">
                <View className="flex-1 bg-[#18181b] rounded-2xl p-4 border border-[#27272a]">
                    <Text className="text-zinc-400 text-xs font-bold uppercase mb-1">Missions</Text>
                    <Text className="text-white text-3xl font-black">{missionCount}</Text>
                </View>

                <View className="flex-1 bg-[#18181b] rounded-2xl p-4 border border-[#27272a]">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-zinc-400 text-xs font-bold uppercase">XP: {(xp / 1000).toFixed(1)}k</Text>
                        <Text className="text-zinc-600 text-xs">/ {(xpToNextLevel / 1000).toFixed(1)}k</Text>
                    </View>
                    <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <MotiView 
                            from={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'timing', duration: 1000 }}
                            className="h-full bg-green-500 rounded-full" 
                        />
                    </View>
                </View>
            </View>

            {/* SECTION GAINS & RETRAIT */}
            <View className="bg-[#18181b] rounded-3xl p-1 border border-[#27272a] mb-6">
                <LinearGradient
                    colors={['rgba(34, 197, 94, 0.1)', 'transparent']}
                    className="p-5 rounded-[20px]"
                >
                    <View className="flex-row justify-between items-start">
                        <View>
                            <Text className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">
                                Solde Disponible
                            </Text>
                            <Text className="text-4xl font-black text-white">
                                {balance.toLocaleString()} <Text className="text-lg text-zinc-500 font-medium">FCFA</Text>
                            </Text>
                        </View>
                        <View className="bg-green-500/10 p-3 rounded-full">
                            <Wallet size={24} color="#4ade80" />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleWithdraw}
                        disabled={withdrawLoading || balance <= 0}
                        className="mt-6 w-full group"
                    >
                        <LinearGradient
                            colors={['#22c55e', '#16a34a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="py-4 rounded-xl flex-row justify-center items-center shadow-lg shadow-green-900/50"
                        >
                            {withdrawLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-base uppercase tracking-wider mr-2">
                                        Retirer mes gains
                                    </Text>
                                    <Zap size={18} color="white" fill="white" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </View>

            {/* --- NOUVELLE SECTION : SALLE DES TROPHÉES (BADGES) --- */}
            <View className="mb-6">
                <View className="flex-row justify-between items-center mb-3 ml-1">
                    <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        Salle des Trophées
                    </Text>
                    <Text className="text-zinc-600 text-xs">
                        {unlockedBadges.length} / {BADGES_CONFIG.length}
                    </Text>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1">
                    {BADGES_CONFIG.map((badge) => {
                        const isUnlocked = unlockedBadges.includes(badge.id);
                        const IconComponent = badge.icon;

                        return (
                            <View key={badge.id} className={`mr-4 items-center w-24 ${isUnlocked ? 'opacity-100' : 'opacity-40'}`}>
                                <View className={`w-16 h-16 rounded-full items-center justify-center mb-2 border-2 ${
                                    isUnlocked ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900 border-zinc-800'
                                }`}>
                                    {isUnlocked ? (
                                        <IconComponent size={28} color={badge.color} fill={badge.color + '20'} />
                                    ) : (
                                        <Lock size={24} color="#52525b" />
                                    )}
                                </View>
                                <Text className="text-white text-xs font-bold text-center mb-0.5" numberOfLines={1}>
                                    {badge.name}
                                </Text>
                                <Text className="text-zinc-500 text-[10px] text-center leading-3" numberOfLines={2}>
                                    {badge.description}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* CENTRE DE COMMANDEMENT (Grille d'outils) */}
            <View className="mb-6">
                <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3 ml-1">
                    Centre de Commandement
                </Text>
                <View className="flex-row flex-wrap gap-3">
                    {/* Monture */}
                    <TouchableOpacity className="w-[48%] bg-[#18181b] p-4 rounded-xl border border-[#27272a] flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Bike size={20} color="#38bdf8" />
                            <Text className="text-white font-bold ml-3">Monture</Text>
                        </View>
                        <ChevronRight size={16} color="#52525b" />
                    </TouchableOpacity>

                    {/* Papiers */}
                    <TouchableOpacity className="w-[48%] bg-[#18181b] p-4 rounded-xl border border-[#27272a] flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <FileText size={20} color="#a78bfa" />
                            <Text className="text-white font-bold ml-3">Papiers</Text>
                        </View>
                        <ChevronRight size={16} color="#52525b" />
                    </TouchableOpacity>

                    {/* Aide */}
                    <TouchableOpacity className="w-[48%] bg-[#18181b] p-4 rounded-xl border border-[#27272a] flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <HelpCircle size={20} color="#fbbf24" />
                            <Text className="text-white font-bold ml-3">Aide</Text>
                        </View>
                        <ChevronRight size={16} color="#52525b" />
                    </TouchableOpacity>

                    {/* Déconnexion */}
                    <TouchableOpacity className="w-[48%] bg-red-500/10 p-4 rounded-xl border border-red-500/20 flex-row items-center justify-between"
                        onPress={handleSignOut}>

                        <View className="flex-row items-center">
                            <LogOut size={20} color="#f87171" />
                            <Text className="text-red-400 font-bold ml-3">Sortir</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* LISTE MISSIONS */}
            <View className="mb-8">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white text-lg font-bold">Dernières Missions</Text>
                    <TouchableOpacity><Text className="text-green-500 font-bold text-xs">TOUT VOIR</Text></TouchableOpacity>
                </View>
                
                {completedMissions.length === 0 ? (
                    <Text className="text-zinc-500 text-center py-4">Aucune mission terminée.</Text>
                ) : (
                    completedMissions.slice(0, 3).map((mission) => (
                        <View key={mission.id} className="bg-[#18181b] rounded-xl p-4 border border-[#27272a] flex-row items-center mb-3">
                            <View className="w-10 h-10 bg-zinc-800 rounded-lg justify-center items-center mr-3">
                                <History size={20} color="#71717a" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-bold">{mission.category || 'Livraison'}</Text>
                                <Text className="text-zinc-500 text-xs">
                                    {mission.acceptedAt?.toDate ? mission.acceptedAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date inconnue'}
                                </Text>
                            </View>
                            <View className="bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                <Text className="text-green-500 text-xs font-bold">+ {mission.price?.toLocaleString() || 0} F</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

        </ScrollView>
    );
};

export default UserProfile;