import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Compass, Plus, User, Award, History, Trophy } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
// BlurView removed for a cleaner solid look


// --- COULEUR PRIMAIRE ---
const ACTIVE_COLOR = '#16a34a'; // Vert primaire
const ICON_SIZE = 24;
// ------------------------

const NavButton = ({
  onPress,
  isActive,
  icon,
  label,
}: {
  onPress: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}) => {
  const { colorScheme } = useColorScheme();
  
  // La couleur est désormais gérée dans MobileBottomNav pour les icônes.
  // Ce composant gère uniquement la couleur du texte.
  const textColor = isActive ? ACTIVE_COLOR : (colorScheme === 'dark' ? '#a1a1aa' : '#71717a');
  
  return (
    <MotiView
      animate={{
        scale: isActive ? 1.05 : 1, // Léger zoom
      }}
      transition={{
        type: 'spring',
        damping: 15,
      }}
      style={styles.buttonWrapper}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        // Hauteur fixe retirée pour éviter le débordement
        style={styles.navButtonContainer} 
      >
        
        <View style={styles.iconLabelContent}>
          {/* L'icône est rendue telle quelle, sa couleur est définie par le parent (MobileBottomNav) */}
          {icon} 
          
          <Text
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: isActive ? '700' : '600',
              color: textColor,
            }}
          >
            {label}
          </Text>
        </View>

        {/* Le point actif (activeDot) a été retiré ici */}

      </TouchableOpacity>
    </MotiView>
  );
};

// Bouton central pour créer une mission
const CreateButton = ({
  onPress,
  isFloating = true,
}: {
  onPress: () => void;
  isFloating?: boolean;
}) => {
  const { colorScheme } = useColorScheme();
  const size = isFloating ? 64 : 52;
  const border = isFloating ? 5 : 0;
  const shadowOffsetY = isFloating ? 8 : 2;
  const elevation = isFloating ? 20 : 3;

  return (
    <MotiView
      from={{ scale: 0, translateY: 20 }}
      animate={{ scale: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: 400, damping: 12 }}
      style={{ alignItems: 'center' }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{ alignItems: 'center' }}
      >
        <LinearGradient
          colors={['#16a34a', '#22c55e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#16a34a',
            shadowOffset: { width: 0, height: shadowOffsetY },
            shadowOpacity: isFloating ? 0.5 : 0.18,
            shadowRadius: isFloating ? 20 : 6,
            elevation,
            borderWidth: border,
            borderColor: isFloating ? (colorScheme === 'dark' ? '#1c1c1e' : '#ffffff') : 'transparent',
          }}
        >
          <Plus color="#fff" size={isFloating ? 32 : 28} strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
};


type TabType = 'home' | 'maquete' | 'createMission' | 'history' | 'profile';

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  
  const useBlur = activeTab === 'home';
  const inactiveColor = colorScheme === 'dark' ? '#a1a1aa' : '#71717a';
  
  // Style "Uber-like" : Pillule flottante solide avec ombres douces
  const containerStyle = {
    borderRadius: useBlur ? 35 : 0,
    // Pas de bordure pour un look plus épuré
    shadowColor: '#000',
    shadowOffset: { width: 0, height: useBlur ? 4 : -2 },
    shadowOpacity: useBlur ? 0.15 : 0.05,
    shadowRadius: useBlur ? 15 : 5,
    elevation: useBlur ? 10 : 5,
    backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
  };

  const navButtons = (
    <View style={styles.navButtonsRow}> 
      
      {/* 1. Missions */}
      <NavButton
        onPress={() => setActiveTab('home')}
        isActive={activeTab === 'home'}
        // Couleur injectée ici
        icon={<Compass color={activeTab === 'home' ? ACTIVE_COLOR : inactiveColor} size={ICON_SIZE} />} 
        label="Missions"
      />

      {/* 2. Classement */}
      <NavButton
        onPress={() => {
          setActiveTab('maquete');
        }}
        isActive={activeTab === 'maquete'}
        // Couleur injectée ici
        icon={<Trophy color={activeTab === 'maquete' ? ACTIVE_COLOR : inactiveColor} size={ICON_SIZE} />}
        label="Trophées"
      />

      {/* Espace pour le bouton central */}
      <View style={{ flex: 1, height: 60 }} /> 

      {/* 3. Historique */}
      <NavButton
        onPress={() => setActiveTab('history')}
        isActive={activeTab === 'history'}
        // Couleur injectée ici
        icon={<History color={activeTab === 'history' ? ACTIVE_COLOR : inactiveColor} size={ICON_SIZE} />}
        label="Historique"
      />
      
      {/* 4. Profil (avec badge) - CORRIGÉ */}
      <NavButton
        onPress={() => setActiveTab('profile')}
        isActive={activeTab === 'profile'}
        icon={
          <View style={{ position: 'relative' }}>
            <User 
              size={ICON_SIZE} 
              // CORRECTION: Couleur correctement injectée sur l'icône User
              color={activeTab === 'profile' ? ACTIVE_COLOR : inactiveColor} 
            />
            <MotiView
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 400 }}
              style={[styles.notificationBadge, { 
                // Assure que la bordure du badge correspond au fond de la barre
                borderColor: colorScheme === 'dark' ? '#18181b' : '#fff', 
              }]}
            >
              <Text style={styles.notificationText}>3</Text>
            </MotiView>
          </View>
        }
        label="Profil"
      />
    </View>
  );
  
  return (
    <MotiView
      from={{ translateY: 100, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      transition={{ type: 'spring', delay: 200 }}
      style={styles.mainContainer}
    >
      <View style={{ 
        position: 'relative', 
        marginHorizontal: useBlur ? 16 : 0,
        marginBottom: useBlur ? 30 : 0, // Marge du bas pour l'effet flottant
      }}>
        {/* Remplacement du BlurView par une View solide pour un style plus "Pro/Uber" */}
        <View style={containerStyle}>
          {navButtons}
        </View>

        <View
          style={{
            position: 'absolute',
            top: useBlur ? -25 : 0, // 0 pour l'état ancré pour rester aligné
            left: '50%',
            marginLeft: useBlur ? -32 : -26,
            zIndex: 100,
          }}
        >
          <CreateButton
            onPress={() => setActiveTab('createMission')}
            isFloating={useBlur}
          />
        </View>
      </View>
    </MotiView>
  );
}

export default MobileBottomNav;


const styles = StyleSheet.create({
  mainContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingBottom: 0,
  },
  buttonWrapper: {
    flex: 1, 
    marginHorizontal: 4
  },
  navButtonsRow: {
    flexDirection: 'row', 
    paddingHorizontal: 8, 
    paddingVertical: 10, 
    alignItems: 'flex-end'
  },
  navButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4, 
    // paddingBottom: 10 est retiré car il n'y a plus de point actif à réserver
  },
  iconLabelContent: {
    alignItems: 'center', 
    zIndex: 1
  },
  
  // NOTE: activeDot a été retiré des styles
  
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    // La couleur de la bordure est gérée dynamiquement dans le composant
  },
  notificationText: { 
    fontSize: 10, 
    color: '#fff', 
    fontWeight: 'bold' 
  },
});