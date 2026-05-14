import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import MapboxGL from "@rnmapbox/maps";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import LottieView from "lottie-react-native";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Footprints,
    MapPin,
    Navigation,
    Package,
    Phone,
    ShieldCheck,
    Wrench,
} from "lucide-react-native";
import { MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";
import { auth, db } from "../../../config/firebase";

// Configuration des catégories (réutilisée pour la cohérence)
const CATEGORY_CONFIG = {
  delivery: {
    icon: <Package size={20} color="white" />,
    color: "#16a34a",
    label: "Livraison",
  },
  transport: {
    icon: <Navigation size={20} color="white" />,
    color: "#2563eb",
    label: "Transport",
  },
  service: {
    icon: <ShieldCheck size={20} color="white" />,
    color: "#9333ea",
    label: "Service",
  },
  pet_care: {
    icon: <Footprints size={20} color="white" />,
    color: "#f97316",
    label: "Promenade",
  },
};

// Assurez-vous d'avoir une clé d'accès Mapbox valide
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

const COMPLETED_STATUSES = [
  "livrée",
  "livree",
  "terminée",
  "terminee",
  "accomplie",
];

// --- FLOATING PARTICLE COMPONENT ---
const FloatingParticle = ({
  delay,
  startX,
  startY,
  emoji,
  duration = 3000,
}: {
  delay: number;
  startX: number;
  startY: number;
  emoji: string;
  duration?: number;
}) => (
  <MotiView
    from={{ opacity: 0, translateY: 0, translateX: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      translateY: -200 - Math.random() * 150,
      translateX: (Math.random() - 0.5) * 120,
      scale: [0, 1.2, 1, 0.5],
    }}
    transition={{ type: "timing", duration, delay }}
    style={{ position: "absolute", left: startX, top: startY, zIndex: 5 }}
  >
    <Text style={{ fontSize: 22 + Math.random() * 14 }}>{emoji}</Text>
  </MotiView>
);

// --- PULSING GLOW RING ---
const GlowRing = ({
  size,
  delay,
  color,
}: {
  size: number;
  delay: number;
  color: string;
}) => (
  <MotiView
    from={{ opacity: 0.6, scale: 0.8 }}
    animate={{ opacity: 0, scale: 1.8 }}
    transition={{ type: "timing", duration: 2000, delay, loop: true }}
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: color,
      backgroundColor: "transparent",
    }}
  />
);

// --- REWARD LINE ITEM (staggered) ---
const RewardLine = ({
  label,
  value,
  icon,
  delay,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  delay: number;
  color: string;
}) => (
  <MotiView
    from={{ opacity: 0, translateX: -30 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={{ type: "spring", damping: 18, delay }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={{ color: "#9ca3af", fontWeight: "600", fontSize: 13 }}>
          {label}
        </Text>
      </View>
      <Text style={{ color, fontWeight: "800", fontSize: 15 }}>{value}</Text>
    </View>
  </MotiView>
);

// --- ORBITING GLOW BORDER BUTTON ---
const ShimmerButton = ({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) => {
  const rotation = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    // Primary beam — orbits in ~2.8s
    rotation.value = withRepeat(
      withTiming(360, { duration: 2800, easing: Easing.linear }),
      -1,
      false,
    );
    // Secondary beam — slower, opposite feel
    rotation2.value = withRepeat(
      withTiming(-360, { duration: 4200, easing: Easing.linear }),
      -1,
      false,
    );
    // Subtle border glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  // Primary rotating beam style
  const beamStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Secondary rotating beam style
  const beam2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation2.value}deg` }],
  }));

  // Pulsing outer glow
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + glowPulse.value * 0.25,
  }));

  const BORDER_WIDTH = 2.5;
  const OUTER_RADIUS = 22;
  const INNER_RADIUS = OUTER_RADIUS - BORDER_WIDTH;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: "100%" }}
    >
      {/* Outer glow shadow */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: OUTER_RADIUS + 4,
            borderWidth: 1,
            borderColor: "#4ade80",
            shadowColor: "#4ade80",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 20,
            elevation: 8,
          },
          pulseStyle,
        ]}
      />

      {/* Border container — the magic happens here */}
      <View
        style={{
          borderRadius: OUTER_RADIUS,
          padding: BORDER_WIDTH,
          overflow: "hidden",
          position: "relative",
          backgroundColor: "rgba(74, 222, 128, 0.06)",
        }}
      >
        {/* === PRIMARY ORBITING BEAM === */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: "300%",
              height: "300%",
              top: "-100%",
              left: "-100%",
            },
            beamStyle,
          ]}
        >
          {/* Main bright particle */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: "49%",
              width: "2%",
              height: "50%",
              backgroundColor: "#4ade80",
              shadowColor: "#4ade80",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 10,
            }}
          />
          {/* Glow trail behind particle */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: "46%",
              width: "8%",
              height: "50%",
              backgroundColor: "rgba(74, 222, 128, 0.25)",
            }}
          />
          {/* Wider soft trail */}
          <View
            style={{
              position: "absolute",
              top: "5%",
              left: "43%",
              width: "14%",
              height: "45%",
              backgroundColor: "rgba(74, 222, 128, 0.08)",
            }}
          />
        </Animated.View>

        {/* === SECONDARY ORBITING BEAM (subtle, different speed) === */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: "300%",
              height: "300%",
              top: "-100%",
              left: "-100%",
            },
            beam2Style,
          ]}
        >
          {/* Subtle secondary particle */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: "49.5%",
              width: "1%",
              height: "50%",
              backgroundColor: "rgba(250, 204, 21, 0.7)",
              shadowColor: "#facc15",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
              elevation: 6,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: "47%",
              width: "6%",
              height: "50%",
              backgroundColor: "rgba(250, 204, 21, 0.1)",
            }}
          />
        </Animated.View>

        {/* === INNER BUTTON CONTENT === */}
        <View
          style={{
            backgroundColor: "#0a0a0a",
            borderRadius: INNER_RADIUS,
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Inner shimmer sweep for extra premium feel */}
          <MotiView
            from={{ translateX: -250 }}
            animate={{ translateX: 450 }}
            transition={{
              type: "timing",
              duration: 2500,
              loop: true,
              delay: 800,
            }}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 80,
              backgroundColor: "rgba(74, 222, 128, 0.06)",
              transform: [{ skewX: "-20deg" }],
            }}
          />
          <Text
            style={{
              color: "#4ade80",
              fontWeight: "900",
              fontSize: 17,
              letterSpacing: 0.5,
              textShadowColor: "rgba(74, 222, 128, 0.5)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
            }}
          >
            {label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MissionSuccessModal = ({
  visible,
  onClose,
  amount = 12.5,
  xpGained = 150,
}: {
  visible: boolean;
  onClose: () => void;
  amount?: number | string;
  xpGained?: number;
}) => {
  const [displayAmount, setDisplayAmount] = useState<number>(0);
  const [phase, setPhase] = useState(0); // 0=hidden, 1=backdrop, 2=trophy, 3=counter, 4=breakdown, 5=cta
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    if (visible) {
      // Reset all states
      setDisplayAmount(0);
      setDisplayXP(0);
      setPhase(0);
      setShowLevelUp(false);

      // Phase 1 → Backdrop fade-in
      const t0 = setTimeout(() => {
        setPhase(1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 100);

      // Phase 2 → Trophy + title slam in
      const t1 = setTimeout(() => {
        setPhase(2);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 500);

      // Phase 3 → Money counter starts
      const t2 = setTimeout(() => {
        setPhase(3);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1200);

      // Phase 4 → Breakdown + XP
      const t3 = setTimeout(() => {
        setPhase(4);
      }, 2800);

      // Phase 5 → CTA button
      const t4 = setTimeout(() => {
        setPhase(5);
        setShowLevelUp(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 3800);

      // Animate Money Counter with easing
      const target =
        typeof amount === "string" ? parseFloat(amount) : amount || 0;
      let startTime: number | null = null;
      const counterDuration = 1400; // ms
      let animFrame: any;

      const animateMoney = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / counterDuration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = eased * target;
        setDisplayAmount(value);

        // Haptic ticks
        if (Math.floor(value) % Math.max(1, Math.floor(target / 8)) === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        if (progress < 1) {
          animFrame = requestAnimationFrame(animateMoney);
        } else {
          setDisplayAmount(target);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      };

      const t5 = setTimeout(() => {
        animFrame = requestAnimationFrame(animateMoney);
      }, 1300);

      // Animate XP counter
      const xpTarget = xpGained || 150;
      const t6 = setTimeout(() => {
        let xpCurrent = 0;
        const xpSteps = 15;
        const xpInc = xpTarget / xpSteps;
        const xpInterval = setInterval(() => {
          xpCurrent += xpInc;
          if (xpCurrent >= xpTarget) {
            xpCurrent = xpTarget;
            clearInterval(xpInterval);
          }
          setDisplayXP(Math.round(xpCurrent));
        }, 60);
      }, 3000);

      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
        clearTimeout(t6);
        if (animFrame) cancelAnimationFrame(animFrame);
      };
    } else {
      setPhase(0);
    }
  }, [visible, amount, xpGained]);

  if (!visible) return null;

  const targetAmount =
    typeof amount === "string" ? parseFloat(amount) : amount || 0;
  const basePay = Math.round(targetAmount * 0.75);
  const bonus = Math.round(targetAmount * 0.25);

  // Generate particles
  const particles = [
    { emoji: "💰", x: 60, y: 300, delay: 600 },
    { emoji: "⭐", x: 150, y: 350, delay: 800 },
    { emoji: "🪙", x: 250, y: 280, delay: 700 },
    { emoji: "✨", x: 100, y: 400, delay: 900 },
    { emoji: "💰", x: 300, y: 320, delay: 1000 },
    { emoji: "🎉", x: 50, y: 250, delay: 500 },
    { emoji: "⭐", x: 320, y: 380, delay: 1100 },
    { emoji: "🪙", x: 180, y: 420, delay: 650 },
    { emoji: "✨", x: 280, y: 240, delay: 750 },
    { emoji: "💰", x: 30, y: 380, delay: 850 },
    { emoji: "🏆", x: 200, y: 260, delay: 550 },
    { emoji: "💎", x: 120, y: 320, delay: 950 },
  ];

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        elevation: 100,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Animated backdrop */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ type: "timing", duration: 400 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.88)",
        }}
      />

      {/* Confetti Lottie */}
      {phase >= 2 && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
          }}
          pointerEvents="none"
        >
          <LottieView
            source={require("../../../assets/lotie1.json")}
            autoPlay
            loop={false}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Floating Particles */}
      {phase >= 2 &&
        particles.map((p, i) => (
          <FloatingParticle
            key={i}
            delay={p.delay}
            startX={p.x}
            startY={p.y}
            emoji={p.emoji}
          />
        ))}

      {/* Main Card */}
      <MotiView
        from={{ scale: 0.3, opacity: 0, translateY: 80 }}
        animate={{
          scale: phase >= 2 ? 1 : 0.3,
          opacity: phase >= 2 ? 1 : 0,
          translateY: phase >= 2 ? 0 : 80,
        }}
        transition={{ type: "spring", damping: 14, stiffness: 120, mass: 0.8 }}
        style={{
          width: "88%",
          borderRadius: 28,
          overflow: "hidden",
          zIndex: 10,
          shadowColor: "#facc15",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 30,
          elevation: 20,
        }}
      >
        {/* Gradient-like top section */}
        <View
          style={{
            backgroundColor: "#0f0f0f",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 32,
            paddingBottom: 24,
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(250,204,21,0.15)",
          }}
        >
          {/* Glow rings behind trophy */}
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <GlowRing size={100} delay={0} color="rgba(250,204,21,0.3)" />
            <GlowRing size={80} delay={400} color="rgba(250,204,21,0.4)" />
            <GlowRing size={60} delay={800} color="rgba(250,204,21,0.5)" />

            {/* Trophy icon */}
            <MotiView
              from={{ scale: 0, rotate: "0deg" }}
              animate={{
                scale: phase >= 2 ? 1 : 0,
                rotate: phase >= 2 ? "0deg" : "180deg",
              }}
              transition={{
                type: "spring",
                damping: 10,
                stiffness: 200,
                delay: 200,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "rgba(250,204,21,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "rgba(250,204,21,0.5)",
                }}
              >
                <Text style={{ fontSize: 36 }}>🏆</Text>
              </View>
            </MotiView>
          </View>

          {/* Title slam-in */}
          <MotiView
            from={{ scale: 2, opacity: 0 }}
            animate={{ scale: phase >= 2 ? 1 : 2, opacity: phase >= 2 ? 1 : 0 }}
            transition={{ type: "spring", damping: 12, delay: 300 }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: "#facc15",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Mission Accomplie !
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{
              opacity: phase >= 2 ? 0.6 : 0,
              translateY: phase >= 2 ? 0 : 10,
            }}
            transition={{ type: "timing", duration: 400, delay: 600 }}
          >
            <Text
              style={{
                color: "#a3a3a3",
                fontSize: 12,
                marginTop: 4,
                fontWeight: "500",
              }}
            >
              Excellent travail, Chasseur ! 🔥
            </Text>
          </MotiView>
        </View>

        {/* Bottom section: earnings */}
        <View
          style={{
            backgroundColor: "#141414",
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 28,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          {/* Big money counter */}
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: phase >= 3 ? 1 : 0,
              scale: phase >= 3 ? 1 : 0.5,
            }}
            transition={{ type: "spring", damping: 14, delay: 0 }}
            style={{ alignItems: "center", marginBottom: 20 }}
          >
            <Text
              style={{
                color: "#6b7280",
                fontWeight: "700",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Gain Total
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "900",
                  color: "#ffffff",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {Math.round(displayAmount).toLocaleString("fr-FR")}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#6b7280",
                  marginLeft: 6,
                }}
              >
                Fcfa
              </Text>
            </View>
          </MotiView>

          {/* Reward breakdown */}
          {phase >= 4 && (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <RewardLine
                label="Course de base"
                value={`${basePay.toLocaleString("fr-FR")} Fcfa`}
                icon="🚗"
                delay={0}
                color="#22c55e"
              />
              <RewardLine
                label="Bonus distance"
                value={`+${bonus.toLocaleString("fr-FR")} Fcfa`}
                icon="📍"
                delay={200}
                color="#facc15"
              />
              <RewardLine
                label="Expérience"
                value={`+${displayXP} XP`}
                icon="⚡"
                delay={400}
                color="#818cf8"
              />
            </View>
          )}

          {/* XP Progress Bar */}
          {phase >= 4 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 18, delay: 600 }}
              style={{ marginBottom: 20 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    color: "#6b7280",
                    fontWeight: "700",
                    fontSize: 10,
                    letterSpacing: 1,
                  }}
                >
                  NIVEAU 7
                </Text>
                <Text
                  style={{ color: "#22c55e", fontWeight: "700", fontSize: 10 }}
                >
                  2,340 / 3,000 XP
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <MotiView
                  from={{ width: "60%" }}
                  animate={{ width: "78%" }}
                  transition={{ type: "timing", duration: 1200, delay: 800 }}
                  style={{
                    height: "100%",
                    borderRadius: 10,
                    backgroundColor: "#22c55e",
                  }}
                />
              </View>
            </MotiView>
          )}

          {/* CTA Button */}
          {phase >= 5 && (
            <MotiView
              from={{ opacity: 0, translateY: 20, scale: 0.9 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 100 }}
            >
              <ShimmerButton
                onPress={onClose}
                label="💰  Récupérer ma récompense"
              />
            </MotiView>
          )}
        </View>

        {/* Level Up Badge */}
        {showLevelUp && (
          <MotiView
            from={{ scale: 0, rotate: "-25deg" }}
            animate={{ scale: 1, rotate: "-6deg" }}
            transition={{ type: "spring", damping: 8, stiffness: 200 }}
            style={{
              position: "absolute",
              top: -14,
              right: -8,
              backgroundColor: "#facc15",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 14,
              shadowColor: "#facc15",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 12,
              elevation: 15,
              borderWidth: 2,
              borderColor: "#fff",
              zIndex: 20,
            }}
          >
            <Text
              style={{
                color: "#1a1a1a",
                fontWeight: "900",
                fontSize: 14,
                letterSpacing: 1,
              }}
            >
              ⬆️ LEVEL UP!
            </Text>
          </MotiView>
        )}
      </MotiView>
    </View>
  );
};

export default function MissionTrackerScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chasseurLocation, setChasseurLocation] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{
    duration: number;
    distance: number;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helpers pour l'affichage
  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}min`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Fonction pour récupérer l'itinéraire réel via Mapbox Directions API
  const fetchRoute = async (
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number },
  ) => {
    try {
      const accessToken =
        process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "";
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&overview=full&access_token=${accessToken}`;

      const response = await fetch(url);
      const json = await response.json();

      if (json.routes && json.routes.length > 0) {
        const route = json.routes[0];
        setRouteCoordinates({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: route.geometry,
            },
          ],
        });
        // Stocker la durée et la distance
        setRouteInfo({
          duration: route.duration, // en secondes
          distance: route.distance, // en mètres
        });
      }
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire:", error);
    }
  };

  useEffect(() => {
    if (!id) return;

    const missionRef = doc(db, "missions", id as string);
    const unsubscribe = onSnapshot(missionRef, async (docSnap) => {
      if (docSnap.exists()) {
        const missionData = docSnap.data();
        setMission({ id: docSnap.id, ...missionData });

        // Récupérer les infos du créateur si pas encore fait
        if (!creator && missionData.userId) {
          const userDoc = await getDoc(doc(db, "users", missionData.userId));
          if (userDoc.exists()) {
            setCreator(userDoc.data());
          }
        }

        // Calculer l'itinéraire une fois la mission chargée
        if (missionData.departureLocation && missionData.destinationLocation) {
          fetchRoute(
            missionData.departureLocation,
            missionData.destinationLocation,
          );
        }
      } else {
        Alert.alert("Erreur", "Mission introuvable");
        router.back();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Écouter la position du chasseur (simulation ou réelle)
  useEffect(() => {
    if (!mission?.chasseurId) return;

    const userRef = doc(db, "users", mission.chasseurId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.location) {
          setChasseurLocation(userData.location);
        }
      }
    });

    return () => unsubscribe();
  }, [mission?.chasseurId]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, "missions", id as string), {
        statut: newStatus,
        updatedAt: new Date(),
      });

      if (COMPLETED_STATUSES.includes(newStatus)) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut :", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    }
  };

  const openNavigation = (lat: number, lng: number) => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${lat},${lng}`;
    const label = "Destination";
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const callUser = () => {
    if (creator?.phoneNumber) {
      Linking.openURL(`tel:${creator.phoneNumber}`);
    } else {
      Alert.alert("Info", "Numéro de téléphone non disponible");
    }
  };

  if (loading || !mission) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const categoryConfig =
    CATEGORY_CONFIG[mission.category as keyof typeof CATEGORY_CONFIG] ||
    CATEGORY_CONFIG.delivery;
  const isHunter = auth.currentUser?.uid === mission.chasseurId;

  // Déterminer l'étape actuelle pour l'UI
  const getStepInfo = () => {
    const isService = mission.category === "service";
    const isPetCare = mission.category === "pet_care";
    const isTransport = mission.category === "transport";

    // --- LOGIQUE SPECIFIQUE POUR PET CARE (Promenade chien) ---
    if (isPetCare) {
      switch (mission.statut) {
        case "acceptée":
        case "acceptee":
          return {
            title: "En route vers le point de rencontre",
            subtitle: "Rendez-vous pour la promenade",
            action: "Je suis arrivé sur place",
            nextStatus: "arrived_pickup",
            icon: <Navigation size={24} color="#f97316" />,
            targetLocation: mission.departureLocation,
          };
        case "arrived_pickup":
          return {
            title: "Au point de rencontre",
            subtitle: "Prêt pour la promenade ?",
            action: "Commencer la promenade",
            nextStatus: "en_cours",
            icon: <Footprints size={24} color="#f97316" />,
            targetLocation: mission.departureLocation,
          };
        case "en_cours":
          return {
            title: "Promenade en cours",
            subtitle: "Profitez de la balade",
            action: "Terminer la promenade",
            nextStatus: "terminée",
            icon: <Clock size={24} color="#f97316" />,
            targetLocation: mission.destinationLocation,
          };
        case "livrée":
        case "livree":
        case "terminée":
        case "terminee":
          return {
            title: "Promenade terminée",
            subtitle: "Mission accomplie !",
            action: null,
            nextStatus: null,
            icon: <CheckCircle size={24} color="#f97316" />,
            targetLocation: mission.destinationLocation,
          };
        default:
          return {
            title: "Statut inconnu",
            subtitle: "En attente",
            action: null,
            nextStatus: null,
            icon: <Clock size={24} color="#9ca3af" />,
            targetLocation: mission.departureLocation,
          };
      }
    }

    // --- LOGIQUE SPECIFIQUE POUR LES SERVICES (Plomberie, Ménage, etc.) ---
    if (isService) {
      switch (mission.statut) {
        case "acceptée":
        case "acceptee":
          return {
            title: "En route vers le lieu d'intervention",
            subtitle: "Rendez-vous chez le client",
            action: "Je suis arrivé sur place",
            nextStatus: "arrived_pickup", // On utilise ce statut technique pour dire "Sur place"
            icon: <Navigation size={24} color="#9333ea" />, // Violet pour service
            targetLocation: mission.destinationLocation, // Pour un service, on va direct à la destination
          };
        case "arrived_pickup":
          return {
            title: "Sur les lieux",
            subtitle: "Préparez-vous à intervenir",
            action: "Commencer l'intervention",
            nextStatus: "en_cours",
            icon: <Wrench size={24} color="#9333ea" />,
            targetLocation: mission.destinationLocation,
          };
        case "en_cours":
          return {
            title: "Intervention en cours",
            subtitle: "Le chronomètre tourne...",
            action: "Terminer l'intervention",
            nextStatus: "terminée", // Pour un service, on passe direct à la fin (pas de dropoff)
            icon: <Clock size={24} color="#9333ea" />,
            targetLocation: mission.destinationLocation,
          };
        case "livrée":
        case "livree":
        case "terminée":
        case "terminee":
          return {
            title: "Intervention terminée",
            subtitle: "Bravo ! Service accompli.",
            action: null,
            nextStatus: null,
            icon: <CheckCircle size={24} color="#9333ea" />,
            targetLocation: mission.destinationLocation,
          };
        default:
          return {
            title: "Statut inconnu",
            subtitle: "En attente",
            action: null,
            nextStatus: null,
            icon: <Clock size={24} color="#9ca3af" />,
            targetLocation: mission.destinationLocation,
          };
      }
    }

    // --- LOGIQUE STANDARD (LIVRAISON & TRANSPORT) ---
    switch (mission.statut) {
      case "acceptée":
      case "acceptee":
        return {
          title: "En route vers le point de retrait",
          subtitle: "Rendez-vous au point de départ",
          action: "Je suis arrivé au retrait",
          nextStatus: "arrived_pickup",
          icon: <MapPin size={24} color="#16a34a" />,
          targetLocation: mission.departureLocation,
        };
      case "arrived_pickup":
        return {
          title: "Au point de retrait",
          subtitle: "Récupérez le colis/client",
          action: "Confirmer la prise en charge",
          nextStatus: "en_cours",
          icon: <Package size={24} color="#16a34a" />,
          targetLocation: mission.departureLocation,
        };
      case "en_cours":
        return {
          title: "En route vers la destination",
          subtitle: "Course en cours",
          action: "Je suis arrivé à destination",
          nextStatus: "arrived_dropoff",
          icon: <Navigation size={24} color="#16a34a" />,
          targetLocation: mission.destinationLocation,
        };
      case "arrived_dropoff":
        return {
          title: "Au point de livraison",
          subtitle: "Finalisez la mission",
          action: isTransport ? "Terminer la course" : "Confirmer la livraison",
          nextStatus: isTransport ? "terminée" : "livrée",
          icon: <CheckCircle size={24} color="#16a34a" />,
          targetLocation: mission.destinationLocation,
        };
      case "livrée":
      case "livree":
      case "terminée":
      case "terminee":
        return {
          title: "Mission terminée",
          subtitle: "Bravo ! Mission accomplie.",
          action: null,
          nextStatus: null,
          icon: <CheckCircle size={24} color="#16a34a" />,
          targetLocation: mission.destinationLocation,
        };
      default:
        return {
          title: "Statut inconnu",
          subtitle: "En attente",
          action: null,
          nextStatus: null,
          icon: <Clock size={24} color="#9ca3af" />,
          targetLocation: mission.departureLocation,
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Flottant */}
      <View className="absolute top-12 left-4 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md"
        >
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Pillule ETA (Style Uber) */}
      {routeInfo && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="absolute top-12 self-center z-10 bg-black px-4 py-2 rounded-full shadow-lg flex-row items-center"
        >
          <Text className="text-white font-bold text-sm mr-2">
            {formatDuration(routeInfo.duration)}
          </Text>
          <Text className="text-gray-400 text-xs font-medium">
            ({formatDistance(routeInfo.distance)})
          </Text>
        </MotiView>
      )}

      {/* Carte */}
      <MapboxGL.MapView
        style={{ flex: 1 }}
        styleURL="mapbox://styles/mapbox/navigation-night-v1"
      >
        <MapboxGL.Camera
          zoomLevel={13}
          animationMode="flyTo"
          animationDuration={2000}
          // Si on a une route, on cadre tout le trajet (bounds)
          // Sinon on centre juste sur le départ
          bounds={
            routeCoordinates
              ? {
                  ne: [
                    Math.max(
                      mission.departureLocation.longitude,
                      mission.destinationLocation.longitude,
                    ),
                    Math.max(
                      mission.departureLocation.latitude,
                      mission.destinationLocation.latitude,
                    ),
                  ],
                  sw: [
                    Math.min(
                      mission.departureLocation.longitude,
                      mission.destinationLocation.longitude,
                    ),
                    Math.min(
                      mission.departureLocation.latitude,
                      mission.destinationLocation.latitude,
                    ),
                  ],
                  paddingBottom: 150, // Réduits pour éviter le dézoom excessif (était 300)
                  paddingTop: 80, // Réduit (était 100)
                  paddingLeft: 30, // Réduit (était 50)
                  paddingRight: 30,
                }
              : undefined
          }
          centerCoordinate={
            !routeCoordinates
              ? [
                  mission.departureLocation.longitude,
                  mission.departureLocation.latitude,
                ]
              : undefined
          }
        />

        {/* Affichage de l'itinéraire (Ligne style Uber) */}
        {routeCoordinates && (
          <MapboxGL.ShapeSource id="routeSource" shape={routeCoordinates}>
            <MapboxGL.LineLayer
              id="routeFill"
              style={{
                lineColor: "#16a34a", // Vert Gonkol
                lineWidth: 5,
                lineCap: "round",
                lineJoin: "round",
                lineOpacity: 0.8,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Point de départ */}
        <MapboxGL.PointAnnotation
          id="departure-marker"
          coordinate={[
            mission.departureLocation.longitude,
            mission.departureLocation.latitude,
          ]}
        >
          <View className="items-center justify-center">
            <View className="w-8 h-8 rounded-full bg-green-600 items-center justify-center border-2 border-white shadow-sm">
              <Text className="text-white font-bold text-xs">A</Text>
            </View>
            <View className="bg-white px-2 py-1 rounded-md shadow-sm mt-1">
              <Text className="text-xs font-bold text-gray-800">Départ</Text>
            </View>
          </View>
        </MapboxGL.PointAnnotation>

        {/* Point d'arrivée */}
        <MapboxGL.PointAnnotation
          id="destination-marker"
          coordinate={[
            mission.destinationLocation.longitude,
            mission.destinationLocation.latitude,
          ]}
        >
          <View className="items-center justify-center">
            <View className="w-8 h-8 rounded-full bg-red-600 items-center justify-center border-2 border-white shadow-sm">
              <Text className="text-white font-bold text-xs">B</Text>
            </View>
            <View className="bg-white px-2 py-1 rounded-md shadow-sm mt-1">
              <Text className="text-xs font-bold text-gray-800">Arrivée</Text>
            </View>
          </View>
        </MapboxGL.PointAnnotation>

        {/* Position du chasseur */}
        {chasseurLocation && (
          <MapboxGL.PointAnnotation
            id="chasseur-marker"
            coordinate={[chasseurLocation.longitude, chasseurLocation.latitude]}
          >
            <View>
              <MotiView
                from={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{
                  type: "timing",
                  duration: 2000,
                  loop: true,
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(14, 165, 233, 0.3)",
                  position: "absolute",
                }}
              />
              <View className="w-8 h-8 rounded-full bg-sky-500 items-center justify-center border-2 border-white shadow-sm">
                <Navigation size={16} color="white" />
              </View>
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* Panneau de contrôle inférieur */}
      <View className="bg-white dark:bg-zinc-900 rounded-t-3xl shadow-xl pb-8 border-t border-gray-100 dark:border-zinc-800">
        {/* Barre de progression visuelle (simple) */}
        <View className="flex-row justify-center mt-3 mb-2">
          <View className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
        </View>

        <View className="px-6 pt-2">
          {/* En-tête du statut */}
          <View className="flex-row items-center mb-6">
            <View className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mr-4">
              {stepInfo.icon}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {stepInfo.title}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400">
                {stepInfo.subtitle}
              </Text>
            </View>
          </View>

          {/* Infos Client / Contact */}
          <View className="flex-row items-center justify-between bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-zinc-700">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-600 items-center justify-center mr-3">
                <Text className="text-lg font-bold text-gray-600 dark:text-gray-300">
                  {creator?.displayName
                    ? creator.displayName.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>
              <View>
                <Text className="font-bold text-gray-800 dark:text-gray-100">
                  {creator?.displayName || "Utilisateur"}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Client
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={callUser}
              className="w-10 h-10 bg-green-500 rounded-full items-center justify-center shadow-sm active:bg-green-600"
            >
              <Phone size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Actions Principales (Visible seulement pour le chasseur) */}
          {isHunter && stepInfo.action && (
            <View className="gap-3">
              <SlideToConfirm
                title={stepInfo.action}
                onConfirm={() => handleUpdateStatus(stepInfo.nextStatus!)}
              />

              <TouchableOpacity
                onPress={() =>
                  openNavigation(
                    stepInfo.targetLocation.latitude,
                    stepInfo.targetLocation.longitude,
                  )
                }
                className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 py-4 rounded-2xl items-center flex-row justify-center gap-2 active:bg-gray-50 dark:active:bg-zinc-700"
              >
                <Navigation size={20} color={isDark ? "#e4e4e7" : "#4b5563"} />
                <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                  Ouvrir GPS
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Message de fin */}
          {!stepInfo.action && (
            <View className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl items-center border border-green-100 dark:border-green-900/50">
              <Text className="text-green-800 dark:text-green-400 font-bold text-center">
                Cette mission est terminée.
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="mt-3 px-6 py-2 bg-green-600 rounded-full"
              >
                <Text className="text-white font-semibold">Retour</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Success Modal */}
      <MissionSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        amount={mission?.price || 15.0}
      />
    </View>
  );
}
