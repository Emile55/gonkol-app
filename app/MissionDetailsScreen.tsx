import MapboxGL from "@rnmapbox/maps";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
    arrayUnion,
    doc,
    getDoc,
    onSnapshot,
    runTransaction,
} from "firebase/firestore";
import {
    ArrowLeft,
    Check,
    Clock,
    FileText,
    MapPin,
    Package,
    PawPrint,
    ShoppingCart,
    User,
    Wrench
} from "lucide-react-native"; // Ajout de AlertTriangle
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "../components/ui/Skeleton";
import { SlideToConfirm } from "../components/ui/SlideToConfirm";
import { db } from "../config/firebase";
import { useColorScheme } from "../hooks/useColorScheme";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// Hauteur de la zone de carte - Généralement 40-50% de l'écran
const MAP_HEIGHT = screenHeight * 0.45;

// Configuration des catégories
const CATEGORY_CONFIG = {
  delivery: {
    label: "Livraison Express",
    icon: <Package color="#fff" size={24} />,
    color: "#16a34a",
  },
  shopping: {
    label: "Course & Achat",
    icon: <ShoppingCart color="#fff" size={24} />,
    color: "#0ea5e9",
  },
  pet_care: {
    label: "Garde Animaux",
    icon: <PawPrint color="#fff" size={24} />,
    color: "#f59e0b",
  },
  services: {
    label: "Main d'œuvre",
    icon: <Wrench color="#fff" size={24} />,
    color: "#9333ea",
  },
};

// Composant réutilisable pour les lignes d'information
const InfoBlock = ({ title, value, icon, iconColor, isDark }) => (
  <View style={styles.infoBlockContainer}>
    <View
      style={[styles.infoIconCircle, { backgroundColor: iconColor + "1A" }]}
    >
      {icon}
    </View>
    <View style={styles.infoTextBlock}>
      <Text
        style={[styles.infoTitle, { color: isDark ? "#a1a1aa" : "#71717a" }]}
      >
        {title}
      </Text>
      <Text style={[styles.infoValue, { color: isDark ? "#fff" : "#18181b" }]}>
        {value}
      </Text>
    </View>
  </View>
);

export default function MissionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [route, setRoute] = useState(null);
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Hook pour les safe areas
  const [creatorName, setCreatorName] = useState("Utilisateur anonyme");

  useEffect(() => {
    const fetchCreator = async () => {
      if (mission?.userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", mission.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCreatorName(userData.name || "Utilisateur anonyme");
          }
        } catch (e) {
          console.error("Error fetching creator:", e);
        }
      }
    };
    fetchCreator();
  }, [mission]);

  const fetchRoute = async (start, end) => {
    const profile = "driving";
    const accessToken =
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "";
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${accessToken}`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.routes && json.routes.length > 0) {
        setRoute(json.routes[0].geometry);
      }
    } catch (e) {
      console.error("Failed to fetch route:", e);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    const docRef = doc(db, "missions", String(id));
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const missionData = docSnap.data();
          setMission({ id: docSnap.id, ...missionData });
          setError("");

          if (
            missionData.departureLocation &&
            missionData.destinationLocation
          ) {
            const departureCoords = [
              missionData.departureLocation.longitude,
              missionData.departureLocation.latitude,
            ];
            const destinationCoords = [
              missionData.destinationLocation.longitude,
              missionData.destinationLocation.latitude,
            ];
            fetchRoute(departureCoords, destinationCoords);
          }
        } else {
          setError("Mission introuvable.");
        }
        setLoading(false);
      },
      (err) => {
        setError("Erreur lors du chargement de la mission.");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [id]);

  const handleAcceptMission = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté.");
      return;
    }

    setAccepting(true);
    const missionRef = doc(db, "missions", mission.id);
    const userRef = doc(db, "users", user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const missionDoc = await transaction.get(missionRef);
        const userDoc = await transaction.get(userRef);

        if (!missionDoc.exists() || !userDoc.exists()) {
          throw new Error("Document introuvable.");
        }

        const missionData = missionDoc.data();
        // Vérification insensible à la casse pour éviter le bug "Déjà acceptée"
        if (
          missionData.statut !== "Disponible" &&
          missionData.statut !== "disponible"
        ) {
          throw new Error("Cette mission a déjà été acceptée.");
        }

        transaction.update(missionRef, {
          statut: "acceptée", // On initialise le statut pour le début du flux de suivi
          chasseurId: user.uid,
          acceptedAt: new Date().toISOString(),
        });

        transaction.update(userRef, {
          missionsEnCours: arrayUnion(mission.id),
          missionsAcceptees: (userDoc.data().missionsAcceptees || 0) + 1,
        });
      });

      Alert.alert(
        "Succès",
        "Mission acceptée ! Vous allez être redirigé vers le suivi.",
      );
      router.push({
        pathname: "/mission/track/[id]",
        params: { id: mission.id },
      });
    } catch (e) {
      let errorMessage = "La mission n'a pas pu être acceptée.";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      Alert.alert("Erreur", errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    const isDark = colorScheme === "dark";
    return (
      <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
        {/* Skeleton Carte */}
        <Skeleton
          width="100%"
          height={MAP_HEIGHT}
          borderRadius={0}
          style={{ marginBottom: 20 }}
        />

        {/* Skeletons Détails */}
        <View style={{ paddingHorizontal: 16 }}>
          <Skeleton
            width="60%"
            height={28}
            borderRadius={8}
            style={{ marginBottom: 20 }}
          />
          <Skeleton
            width="100%"
            height={100}
            borderRadius={16}
            style={{ marginBottom: 16 }}
          />
          <Skeleton
            width="100%"
            height={150}
            borderRadius={16}
            style={{ marginBottom: 16 }}
          />
          <Skeleton width="100%" height={100} borderRadius={16} />
        </View>
      </View>
    );
  }

  if (error || !mission) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error || "Mission introuvable."}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.floatingBackButton}
        >
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
      </View>
    );
  }

  const departureCoords = mission?.departureLocation
    ? [mission.departureLocation.longitude, mission.departureLocation.latitude]
    : null;
  const destinationCoords = mission?.destinationLocation
    ? [
        mission.destinationLocation.longitude,
        mission.destinationLocation.latitude,
      ]
    : null;

  let mapCenter = [0, 0];
  let zoomLevel = 12;
  if (departureCoords && destinationCoords) {
    mapCenter = [
      (departureCoords[0] + destinationCoords[0]) / 2,
      (departureCoords[1] + destinationCoords[1]) / 2,
    ];
  } else if (departureCoords) {
    mapCenter = departureCoords;
  } else if (destinationCoords) {
    mapCenter = destinationCoords;
  }

  const isDark = colorScheme === "dark";
  const cat = CATEGORY_CONFIG[mission.category] || CATEGORY_CONFIG.delivery;

  // Valeur corrigée pour l'espace du bas : hauteur du bouton + padding supérieur + safe area du bas
  const fixedButtonHeight = 60 + 16 + insets.bottom;

  // --- Rendu de la Carte Mapbox (En-tête) ---
  const MapHeader = () => {
    if (!departureCoords || !destinationCoords)
      return (
        <View
          style={{
            height: MAP_HEIGHT,
            backgroundColor: isDark ? "#1f2937" : "#e5e7eb",
          }}
        />
      );

    return (
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={
            isDark
              ? "mapbox://styles/mapbox/navigation-night-v1"
              : "mapbox://styles/mapbox/light-v11"
          }
          attributionEnabled={false}
          logoEnabled={false}
        >
          <MapboxGL.Camera
            centerCoordinate={mapCenter}
            zoomLevel={zoomLevel}
            animationMode="flyTo"
            animationDuration={0}
          />

          {/* Trajet */}
          {route && (
            <MapboxGL.ShapeSource
              id="real-route"
              shape={{ type: "Feature", geometry: route, properties: {} }}
            >
              <MapboxGL.LineLayer
                id="real-route-line"
                style={{
                  lineColor: "#22c55e",
                  lineWidth: 6,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </MapboxGL.ShapeSource>
          )}
          {/* Markers */}
          <MapboxGL.PointAnnotation
            id="mini-departure"
            coordinate={departureCoords}
          >
            <View style={styles.markerGreen}>
              <MapPin color="#fff" size={20} />
            </View>
          </MapboxGL.PointAnnotation>
          <MapboxGL.PointAnnotation
            id="mini-destination"
            coordinate={destinationCoords}
          >
            <View style={styles.markerRed}>
              <MapPin color="#fff" size={20} />
            </View>
          </MapboxGL.PointAnnotation>
        </MapboxGL.MapView>

        {/* Overlay pour l'effet de transition au bas de la carte */}
        <LinearGradient
          colors={["transparent", isDark ? "#09090b" : "#f9fafb"]}
          style={styles.mapGradientOverlay}
        />
      </View>
    );
  };

  // --- Rendu des détails (Bottom Sheet) ---
  const DetailsSheet = () => (
    <ScrollView
      style={[styles.sheetScrollView, isDark ? styles.bgDark : styles.bgLight]}
      contentContainerStyle={[
        styles.sheetContentContainer,
        { paddingBottom: fixedButtonHeight + 20 },
      ]} // Correction ici
      showsVerticalScrollIndicator={false}
    >
      <MotiView
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400, delay: 100 }}
      >
        {/* Bloc Principal d'Info/Récompense (similaire à l'en-tête de course Uber) */}
        <View
          style={[
            styles.mainInfoCard,
            isDark ? styles.cardDark : styles.cardLight,
          ]}
        >
          <View style={styles.cardSection}>
            <Text
              style={[styles.sheetTitle, { color: isDark ? "#fff" : "#000" }]}
            >
              Détails de la Mission
            </Text>
          </View>

          <View style={styles.separator} />

          {/* Ligne 1: Catégorie et Prix */}
          <View style={styles.categoryPriceRow}>
            <View style={styles.categoryBadge}>
              <View
                style={[styles.categoryIcon, { backgroundColor: cat.color }]}
              >
                {cat.icon}
              </View>
              <Text style={[styles.categoryText, { color: cat.color }]}>
                {cat.label}
              </Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceValue}>
                {parseInt(mission.price || 0, 10).toLocaleString("fr-FR")} FCFA
              </Text>
            </View>
          </View>
        </View>

        {/* Bloc 2: Adresses et Durée */}
        <View
          style={[
            styles.detailCard,
            isDark ? styles.cardDark : styles.cardLight,
          ]}
        >
          <InfoBlock
            title="Point de départ"
            value={mission.departure || "Non précisé"}
            icon={<MapPin color="#16a34a" size={20} />}
            iconColor="#16a34a"
            isDark={isDark}
          />
          <View style={styles.separator} />
          <InfoBlock
            title="Destination"
            value={mission.destination || "Non précisé"}
            icon={<MapPin color="#16a34a" size={20} />}
            iconColor="#16a34a"
            isDark={isDark}
          />
          <View style={styles.separator} />
          <InfoBlock
            title="Durée estimée"
            value={
              mission.duration ? `${mission.duration} min` : "Non précisée"
            }
            icon={<Clock color="#16a34a" size={20} />}
            iconColor="#16a34a"
            isDark={isDark}
          />
        </View>

        {/* Bloc 3: Description et Créateur */}
        <View
          style={[
            styles.detailCard,
            isDark ? styles.cardDark : styles.cardLight,
          ]}
        >
          <InfoBlock
            title="Description de la Tâche"
            value={mission.description || "Aucune description fournie."}
            icon={<FileText color="#16a34a" size={20} />}
            iconColor="#16a34a"
            isDark={isDark}
          />
          <View style={styles.separator} />
          <InfoBlock
            title="Proposé par"
            value={creatorName}
            icon={<User color="#16a34a" size={20} />}
            iconColor="#16a34a"
            isDark={isDark}
          />
        </View>

        {/* Espace pour le bouton d'action fixe - Retiré ici, géré par paddingBottom dans contentContainerStyle */}
      </MotiView>
    </ScrollView>
  );

  // --- Rendu final ---
  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      {/* 1. Mapbox Header (Pleine Largeur) */}
      <MapHeader />

      {/* 2. Détails (Bottom Sheet) */}
      <DetailsSheet />

      {/* 3. Bouton Retour Flottant sur la carte */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.floatingBackButton}
      >
        <ArrowLeft color="#000" size={24} />
      </TouchableOpacity>

      {/* 4. Bouton d'Action Fixe (en bas) - Conteneur mis à jour */}
      <View
        style={[
          styles.fixedButtonContainer,
          {
            paddingBottom: insets.bottom,
            backgroundColor: isDark ? "#09090b" : "#f9fafb",
          },
        ]}
      >
        {/* Dégradé pour masquer la transition (anti-scroll-through) */}
        <LinearGradient
          colors={[
            isDark ? "rgba(9, 9, 11, 0.0)" : "rgba(249, 250, 251, 0.0)",
            isDark ? "#09090b" : "#f9fafb",
          ]}
          style={styles.fixedButtonOverlay}
        />

        {(mission.statut === "Disponible" ||
          mission.statut === "disponible") && (
          <View style={styles.fullWidthButton}>
            <SlideToConfirm
              title="GLISSER POUR ACCEPTER"
              onConfirm={handleAcceptMission}
            />
          </View>
        )}

        {/* Statut si non disponible - Style modernisé */}
        {mission.statut !== "Disponible" && mission.statut !== "disponible" && (
          <View style={styles.fullWidthButton}>
            <LinearGradient
              colors={
                [
                  "acceptée",
                  "acceptee",
                  "arrived_pickup",
                  "en_cours",
                  "arrived_dropoff",
                  "En_cours",
                ].includes(mission.statut)
                  ? ["#16a34a", "#22c55e"]
                  : ["#71717a", "#52525b"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusButtonGradient}
            >
              {[
                "acceptée",
                "acceptee",
                "arrived_pickup",
                "en_cours",
                "arrived_dropoff",
                "En_cours",
              ].includes(mission.statut) ? (
                <Clock color="#fff" size={22} style={{ marginRight: 8 }} />
              ) : (
                <Check color="#fff" size={22} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.buttonText}>
                {[
                  "acceptée",
                  "acceptee",
                  "arrived_pickup",
                  "en_cours",
                  "arrived_dropoff",
                  "En_cours",
                ].includes(mission.statut)
                  ? "MISSION EN COURS"
                  : "MISSION TERMINÉE"}
              </Text>
            </LinearGradient>
          </View>
        )}
      </View>
    </View>
  );
}

// --- Styles mis à jour ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgDark: {
    backgroundColor: "#09090b", // gray-950
  },
  bgLight: {
    backgroundColor: "#f9fafb", // gray-50
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#09090b",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 18,
    fontWeight: "bold",
  },

  // --- 1. Mapbox Header ---
  mapContainer: {
    width: screenWidth,
    height: MAP_HEIGHT,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  mapGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  markerGreen: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerRed: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  // --- 2. Détails (Bottom Sheet) ---
  sheetScrollView: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetContentContainer: {
    paddingBottom: 130, // Cette valeur est ajustée dynamiquement dans le composant
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },

  // --- Cartes de Contenu ---
  cardSection: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  mainInfoCard: {
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  detailCard: {
    marginHorizontal: 16,
    borderRadius: 15,
    marginTop: 12,
    padding: 0,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  cardLight: {
    backgroundColor: "#fff",
  },
  cardDark: {
    backgroundColor: "#18181b",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(113,113,122,0.1)",
    marginHorizontal: 24,
  },

  // --- Prix et Catégorie (restent inchangés car ils sont bons) ---
  categoryPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  priceTag: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#16a34a1A",
  },
  priceValue: {
    color: "#16a34a",
    fontSize: 18,
    fontWeight: "bold",
  },

  // --- Info Blocks (restent inchangés) ---
  infoBlockContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  infoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },

  // --- Boutons Fixes (Mise à jour pour le problème de superposition) ---
  floatingBackButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 50,
    backgroundColor: "#fff",
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    // paddingBottom géré dynamiquement par `insets.bottom`
    zIndex: 20, // Assurez-vous qu'il est au-dessus du ScrollView
  },
  fixedButtonOverlay: {
    position: "absolute",
    top: -30, // Commence au-dessus
    left: 0,
    right: 0,
    height: 46, // Hauteur du dégradé
    zIndex: 10, // Sous le bouton
  },
  fullWidthButton: {
    width: "100%",
  },
  actionButton: {
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  // --- Statut Box Modernisé ---
  statusButtonGradient: {
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
