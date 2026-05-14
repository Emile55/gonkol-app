import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Package, ChevronRight, CheckCircle, MapPin, AlertCircle, Search } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import LottieView from 'lottie-react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export default function HistoryScreen() {
    const [activeMissions, setActiveMissions] = useState<any[]>([]);
    const [pastMissions, setPastMissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const auth = getAuth();
    const user = auth.currentUser;
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Récupérer toutes les missions où je suis le chasseur
        const q = query(
            collection(db, 'missions'),
            where('chasseurId', '==', user.uid),
            orderBy('acceptedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allMissions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Séparation des missions actives et terminées
            const active: any[] = [];
            const past: any[] = [];

            // Liste des statuts considérés comme "En cours"
            const activeStatuses = ['acceptée', 'acceptee', 'en_cours', 'arrived_pickup', 'arrived_dropoff', 'En_cours'];

            allMissions.forEach((mission: any) => {
                if (activeStatuses.includes(mission.statut)) {
                    active.push(mission);
                } else {
                    past.push(mission);
                }
            });

            setActiveMissions(active);
            setPastMissions(past);
            setLoading(false);
        }, (error) => {
            console.error("Erreur lors de la récupération des missions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // --- Rendu d'une carte "En cours" (Plus grosse, bouton d'action) ---
    const renderActiveItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.activeCard, isDark ? styles.cardDark : styles.cardLight]} 
            onPress={() => router.push({ pathname: '/mission/track/[id]', params: { id: item.id } })}
            activeOpacity={0.9}
        >
            <View style={styles.activeHeader}>
                <View style={styles.liveBadge}>
                    <View style={styles.pulsingDot} />
                    <Text style={styles.liveText}>EN COURS</Text>
                </View>
                <Text style={[styles.priceText, { color: isDark ? '#fff' : '#000' }]}>
                    {item.price} FCFA
                </Text>
            </View>

            <View style={styles.row}>
                <Package color="#16a34a" size={20} />
                <Text style={[styles.missionTitle, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                    {item.category || 'Livraison'}
                </Text>
            </View>

            <View style={styles.locationRow}>
                <MapPin size={16} color="#9ca3af" />
                <Text numberOfLines={1} style={styles.locationText}>
                    {item.destination || 'Destination inconnue'}
                </Text>
            </View>

            <View style={styles.trackButton}>
                <Text style={styles.trackButtonText}>Reprendre le suivi</Text>
                <ChevronRight color="#fff" size={16} />
            </View>
        </TouchableOpacity>
    );

    // --- Rendu d'une carte "Historique" (Plus simple) ---
    const renderHistoryItem = ({ item }: { item: any }) => {
        const isCancelled = item.statut === 'annulée' || item.statut === 'annulee';
        // Texte adapté selon la catégorie
        let statusLabel = 'Terminée';
        if (isCancelled) {
            statusLabel = 'Annulée';
        } else if (item.category === 'service') {
            statusLabel = 'Intervention terminée';
        } else {
            statusLabel = 'Livrée';
        }

        return (
            <View style={[styles.historyCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={styles.historyIcon}>
                    {isCancelled ? (
                        <AlertCircle color="#ef4444" size={24} />
                    ) : (
                        <CheckCircle color="#9ca3af" size={24} />
                    )}
                </View>
                <View style={styles.historyContent}>
                    <Text style={[styles.historyTitle, { color: isDark ? '#fff' : '#000' }]}>
                        {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Mission'}
                    </Text>
                    <Text style={styles.historyDate}>
                        {statusLabel} • {item.price} FCFA
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Mon Activité</Text>
                </View>
                <View style={styles.listContent}>
                    <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
                    <Skeleton width="100%" height={150} borderRadius={16} style={{ marginBottom: 20 }} />
                    
                    <Skeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 12, marginTop: 10 }} />
                    <Skeleton width="100%" height={72} borderRadius={12} style={{ marginBottom: 10 }} />
                    <Skeleton width="100%" height={72} borderRadius={12} style={{ marginBottom: 10 }} />
                    <Skeleton width="100%" height={72} borderRadius={12} style={{ marginBottom: 10 }} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Mon Activité</Text>
            </View>

            <FlatList
                data={pastMissions}
                keyExtractor={item => item.id}
                renderItem={renderHistoryItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={() => (
                    <>
                        {/* Section Missions En Cours */}
                        {activeMissions.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>EN COURS ({activeMissions.length})</Text>
                                {activeMissions.map(mission => (
                                    <View key={mission.id} style={{ marginBottom: 12 }}>
                                        {renderActiveItem({ item: mission })}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Titre Historique */}
                        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>HISTORIQUE</Text>
                        {pastMissions.length === 0 && activeMissions.length === 0 && (
                            <View style={styles.emptyState}>
                                <LottieView
                                    autoPlay
                                    loop
                                    source={require('@/assets/lotie5.json')} // Ou lotie3.json qui est déjà dans le dossier assets
                                    style={{ width: 200, height: 200, alignSelf: 'center' }}
                                />
                                <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#1f2937' }]}>Pas encore de quêtes</Text>
                                <Text style={styles.emptyText}>Votre historique est vide. C'est le moment de plonger dans l'action et de chasser votre première mission !</Text>
                                <TouchableOpacity 
                                    style={styles.exploreButton}
                                    onPress={() => router.push('/(tabs)')}
                                >
                                    <Search color="#fff" size={18} style={{ marginRight: 8 }} />
                                    <Text style={styles.exploreButtonText}>Chercher des missions</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgDark: { backgroundColor: '#09090b' },
    bgLight: { backgroundColor: '#f9fafb' },
    center: { justifyContent: 'center', alignItems: 'center' },
    
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6b7280',
        marginBottom: 12,
        letterSpacing: 1,
    },

    // Styles Carte Active
    activeCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#16a34a', // Bordure verte
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardLight: { backgroundColor: '#fff' },
    cardDark: { backgroundColor: '#18181b' },
    
    activeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    liveBadge: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', 
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 
    },
    pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a', marginRight: 6 },
    liveText: { color: '#16a34a', fontSize: 10, fontWeight: 'bold' },
    priceText: { fontSize: 16, fontWeight: 'bold' },
    
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    missionTitle: { fontSize: 16, fontWeight: '600' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    locationText: { color: '#6b7280', fontSize: 14, flex: 1 },

    trackButton: {
        backgroundColor: '#16a34a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 4
    },
    trackButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    // Styles Carte Historique
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    historyIcon: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6',
        alignItems: 'center', justifyContent: 'center', marginRight: 12
    },
    historyContent: { flex: 1 },
    historyTitle: { fontSize: 16, fontWeight: '500' },
    historyDate: { fontSize: 13, color: '#6b7280', marginTop: 2 },

    emptyState: { 
        padding: 40, 
        alignItems: 'center',
        marginTop: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: { 
        color: '#9ca3af',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    exploreButton: {
        backgroundColor: '#16a34a',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    exploreButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    }
});
