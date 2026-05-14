import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Modal, Text, Pressable, StyleSheet, useColorScheme, Animated, Platform } from "react-native";
import { useRouter } from 'expo-router';
import { MotiView } from "moti";
import MapboxGL from "@rnmapbox/maps";
import { Bike, Package, MapPin, X, ShoppingCart, PawPrint, Wrench, ChevronRight, Clock, User } from "lucide-react-native";
import * as Location from "expo-location";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// --- HELPERS : Icônes et Couleurs ---

const getCategoryIcon = (category: string, color = '#fff') => {
  switch (category) {
    case "delivery":
      return <Package color={color} size={16} />;
    case "shopping":
      return <ShoppingCart color={color} size={16} />;
    case "pet_care":
      return <PawPrint color={color} size={16} />;
    case "services":
      return <Wrench color={color} size={16} />;
    default:
      return <Package color={color} size={16} />;
  }
};

// Retourne un jeu de couleurs selon la catégorie et l'urgence
const getCategoryColors = (category: string, urgency?: string) => {
  const map: Record<string, { gradient: string[]; halo: string; accent: string; text: string }> = {
    delivery: { gradient: ['#16a34a', '#22c55e'], halo: '#16a34a', accent: '#15803d', text: '#ffffff' }, // Vert
    shopping: { gradient: ['#0ea5e9', '#0284c7'], halo: '#0ea5e9', accent: '#0369a1', text: '#ffffff' }, // Bleu
    pet_care: { gradient: ['#f472b6', '#f97316'], halo: '#f472b6', accent: '#d97706', text: '#ffffff' }, // Rose/Orange
    services: { gradient: ['#8b5cf6', '#6366f1'], halo: '#8b5cf6', accent: '#6d28d9', text: '#ffffff' }, // Violet
    urgent: { gradient: ['#fb923c', '#ef4444'], halo: '#ef4444', accent: '#b91c1c', text: '#ffffff' }, // Rouge/Orange (Haute urgence)
    default: { gradient: ['#16a34a', '#22c55e'], halo: '#16a34a', accent: '#15803d', text: '#ffffff' },
  };

  const base = map[category] || map.default;

  if (urgency === 'high') {
    return map.urgent;
  }

  return base;
};

// Le composant MissionMarker reste inchangé et fonctionne correctement.
const MissionMarker = ({ category, price, urgency }: { category: string; price?: string; urgency?: string }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [scaleAnim, pulseAnim]);

  const hasValidPrice = typeof price === 'string' && price.trim() !== '';
  const colors = getCategoryColors(category || 'default', urgency);

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        flexDirection: 'column',
        transform: [{ scale: scaleAnim }],
      }}
    >
      {/* Bulle de Prix avec dégradé */}
      {hasValidPrice && (
        <Animated.View
          style={{
            marginBottom: 4,
            transform: [{ scale: pulseAnim }],
          }}
        >
          <LinearGradient
            colors={colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              shadowColor: colors.halo, // Ombre dynamique
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text 
              style={{ 
                fontWeight: 'bold', 
                fontSize: 13, 
                color: colors.text,
                letterSpacing: 0.5
              }} 
              numberOfLines={1}
            >
              {parseInt(price, 10).toLocaleString('fr-FR')} FCFA
            </Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Marqueur Principal modernisé */}
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {/* Halo lumineux animé (Anneaux) */}
        <MotiView
          from={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 2.0 }}
          transition={{
            type: 'timing',
            duration: 2000,
            loop: true,
            repeatReverse: false,
          }}
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.halo,
            zIndex: -1,
          }}
        />
        <MotiView
          from={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 2.0 }}
          transition={{
            type: 'timing',
            duration: 2000,
            loop: true,
            repeatReverse: false,
            delay: 1000,
          }}
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.halo,
            zIndex: -1,
          }}
        />
        
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#fff',
            padding: 4,
            borderWidth: 3,
            borderColor: colors.accent, // Bordure dynamique
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={colors.gradient as any} // Fond dynamique
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getCategoryIcon(category, colors.text)}
          </LinearGradient>
        </View>
        
        {/* Pointe moderne */}
        <View
          style={{
            alignSelf: 'center',
            width: 0,
            height: 0,
            borderLeftWidth: 8,
            borderRightWidth: 8,
            borderTopWidth: 12,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: '#fff',
            marginTop: -2,
          }}
        />
        <View
          style={{
            alignSelf: 'center',
            width: 0,
            height: 0,
            borderLeftWidth: 6,
            borderRightWidth: 6,
            borderTopWidth: 9,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: colors.accent, // Pointe dynamique
            marginTop: -11,
          }}
        />
      </View>
    </Animated.View>
  );
};

// --- COMPOSANT PRINCIPAL : MobileMapSection ---

export function MobileMapSection() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<any | null>(null);

  // Couleurs pour le modal selon la mission sélectionnée
  const selectedColors = selectedMission 
    ? getCategoryColors(selectedMission.category, selectedMission.urgency) 
    : getCategoryColors('default');

  const handleMarkerSelection = (mission: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Feedback Haptique
    setSelectedMission(mission);
  };

  // Logique de récupération de position et de missions (inchangée)
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        async (location: Location.LocationObject) => {
          setUserPosition({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            try {
              await updateDoc(doc(db, "users", user.uid), {
                location: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  timestamp: location.timestamp,
                },
              });
            } catch (error) {
              console.error("Erreur lors de la mise à jour de la position:", error);
            }
          }
        }
      );
    })();
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // On écoute toutes les missions, mais on pourrait filtrer par statut 'disponible' si souhaité
    // Pour l'instant on filtre côté client pour plus de souplesse si le champ statut est manquant sur les vieilles données
    const unsub = onSnapshot(collection(db, "missions"), (snapshot) => {
      const missionsWithPos = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((m: any) => {
            // Filtre 1: Doit avoir une localisation de départ valide
            const hasLocation = m.departureLocation && m.departureLocation.latitude && m.departureLocation.longitude;
            // Filtre 2: Si le statut existe, il doit être 'disponible'. S'il n'existe pas (vieilles données), on affiche quand même.
            const isAvailable = !m.statut || m.statut === 'disponible';
            // Filtre 3: Ne pas afficher ses propres missions (Empêcher l'auto-acceptation)
            const isNotMyMission = currentUser ? m.userId !== currentUser.uid : true;
            
            return hasLocation && isAvailable && isNotMyMission;
        })
        .map((m: any) => ({
          id: m.id,
          latitude: m.departureLocation.latitude,
          longitude: m.departureLocation.longitude,
          category: m.category || "delivery",
          urgency: m.urgency || 'normal',
          price: m.price || '',
          departure: m.departure || 'Lieu de départ non spécifié',
          destination: m.destination || 'Destination non spécifiée',
          duration: m.duration || 'N/A',
          creator: m.userId || 'Anonyme',
          statut: m.statut // On garde le statut pour info
        }));
      setMissions(missionsWithPos);
    });
    return () => unsub();
  }, []);

  MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView 
        style={{ flex: 1 }} 
        styleURL={"mapbox://styles/mapbox/navigation-night-v1"}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        pitchEnabled={true}
        rotateEnabled={true}
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera
          zoomLevel={15}
          pitch={45}
          centerCoordinate={
            userPosition
              ? [userPosition.longitude, userPosition.latitude]
              : [15.242, -4.263]
          }
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* Marker utilisateur modernisé (inchangé) */}
        {userPosition && (
          <MapboxGL.PointAnnotation
            id="user-position"
            coordinate={[userPosition.longitude, userPosition.latitude]}
            onSelected={() => {}}
          >
            <View style={{ position: 'relative' }}>
              <MotiView
                from={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'timing', duration: 2000, loop: true }}
                style={{
                  position: 'absolute',
                  width: 60, height: 60, borderRadius: 30, backgroundColor: '#16a34a',
                  top: -6, left: -6,
                }}
              />
              <LinearGradient
                colors={['#16a34a', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 4, borderColor: '#fff', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
                }}
              >
                <Bike color="#fff" size={24} />
              </LinearGradient>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Markers missions (inchangés) */}
        {missions.map((mission) => (
          <MapboxGL.PointAnnotation
            key={mission.id}
            id={mission.id}
            coordinate={[mission.longitude, mission.latitude]}
            anchor={{ x: 0.5, y: 1.0 }}
            onSelected={() => handleMarkerSelection(mission)}
          >
            <MissionMarker 
              category={mission.category} 
              price={mission.price} 
              urgency={mission.urgency} 
            />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
      

      {/* Overlay Barre de Recherche et Profil (inchangé) */}
      <MotiView
        from={{ opacity: 0, translateY: -50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: 300 }}
        style={styles.overlayContainer}
      >
        <View style={styles.searchBar}>
          <MapPin color="#a1a1aa" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.searchText}>Rechercher une zone ou un type de mission...</Text>
        </View>

        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <User color="#22c55e" size={24} />
        </TouchableOpacity>
      </MotiView>


      {/* POPUP APERÇU MISSION AMÉLIORÉ */}
      <Modal
        visible={!!selectedMission}
        transparent
        animationType="none"
        onRequestClose={() => setSelectedMission(null)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} 
          onPress={() => setSelectedMission(null)} 
        />
        
        {selectedMission && (
          <MotiView
            from={{ translateY: 400, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{ position: 'absolute', left: 16, right: 16, bottom: 30 }}
          >
            <View style={{ 
                backgroundColor: '#18181b', 
                borderRadius: 24, 
                padding: 4, 
                borderWidth: 1, 
                borderColor: '#27272a',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 20,
            }}>
                <LinearGradient
                    colors={[selectedColors.halo + '26', 'transparent']} // 26 is ~15% opacity
                    style={{ padding: 20, borderRadius: 20 }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={{ color: selectedColors.accent, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                                Mission {selectedMission.category}
                            </Text>
                            <Text style={{ fontSize: 32, fontWeight: '900', color: 'white' }}>
                                {selectedMission.price ? parseInt(selectedMission.price, 10).toLocaleString('fr-FR') : 'N/A'} <Text style={{ fontSize: 16, color: '#71717a', fontWeight: '500' }}>FCFA</Text>
                            </Text>
                        </View>
                        <View style={{ backgroundColor: selectedColors.halo + '26', padding: 12, borderRadius: 9999 }}>
                            {getCategoryIcon(selectedMission.category, selectedColors.accent)}
                        </View>
                    </View>

                    {/* Détails simplifiés */}
                    <View style={{ marginTop: 20, gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MapPin color="#71717a" size={16} />
                            <Text style={{ color: '#a1a1aa', marginLeft: 8, flex: 1, fontSize: 14 }} numberOfLines={1}>
                                De: <Text style={{ color: '#e4e4e7' }}>{selectedMission.departure}</Text>
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ChevronRight color="#71717a" size={16} />
                            <Text style={{ color: '#a1a1aa', marginLeft: 8, flex: 1, fontSize: 14 }} numberOfLines={1}>
                                Vers: <Text style={{ color: '#fff', fontWeight: '600' }}>{selectedMission.destination}</Text>
                            </Text>
                        </View>
                         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Clock color="#71717a" size={16} />
                            <Text style={{ color: '#a1a1aa', marginLeft: 8, flex: 1, fontSize: 14 }}>
                                Durée: <Text style={{ color: '#e4e4e7' }}>{selectedMission.duration} min</Text>
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            if (selectedMission?.id) {
                                router.push({ pathname: '/MissionDetailsScreen', params: { id: selectedMission.id } });
                            }
                            setSelectedMission(null);
                        }}
                        style={{ marginTop: 24, width: '100%' }}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={selectedColors.gradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                paddingVertical: 16,
                                borderRadius: 12,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: selectedColors.halo,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.5,
                                shadowRadius: 8,
                                elevation: 8
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>
                                Voir les détails
                            </Text>
                            <ChevronRight size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
          </MotiView>
        )}
      </Modal>
    </View>
  );
}

// --- STYLES (Mise à jour pour un meilleur UX/UI) ---

const styles = StyleSheet.create({
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Gestion de la zone de sécurité iOS
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(212, 212, 216, 0.8)', 
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalContent: {
    padding: 24,
    // Plus de border radius ici, car il est géré par le BlurView parent
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24, // Augmenter l'espacement
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, 
  },
  modalTitle: {
    fontSize: 22, 
    fontWeight: '900', // Plus percutant
    textTransform: 'uppercase',
    letterSpacing: 1, 
  },
  priceCard: {
    padding: 24, // Plus grand
    borderRadius: 16,
    marginBottom: 28,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  priceLabel: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 34, // Plus grand
    fontWeight: '900',
    letterSpacing: 1,
  },
  detailsContainer: {
    gap: 20, 
    marginBottom: 30, 
    paddingHorizontal: 8, // Petit padding pour aérer
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700', // Renforcé
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  actionButtonText: {
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Les styles d'overlay restent inchangés car ils sont déjà optimaux
  overlayContainer: {
    position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 100,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(24, 24, 27, 0.8)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(63, 63, 70, 0.8)', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  searchText: {
    color: '#a1a1aa', fontSize: 14, fontWeight: '500',
  },
  profileButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#18181b', borderWidth: 2, borderColor: '#22c55e', alignItems: 'center', justifyContent: 'center', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6, elevation: 6,
  },
});

export default MobileMapSection;