import React, { useState, useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import { collection,doc, updateDoc, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';
import { ScrollView, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, Pressable, Alert } from 'react-native';
import { MapPin, Package, Clock, DollarSign, ChevronDown, ArrowLeft, Check, X, ShoppingCart, PawPrint, Wrench, Navigation } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location'; // Importation de la librairie de géolocalisation

// --- Type Definitions ---
interface LocationData {
  latitude: number;
  longitude: number;
}

interface FormDataState {
  departure: string;
  destination: string;
  description: string;
  weight: string;
  size: string;
  pickupTime: string;
  deliveryTime?: string; // Ajouté pour la catégorie livraison
  duration?: string; // Ajouté pour la catégorie livraison
  price: string;
  category: string;
  departureLocation: LocationData | null;
  destinationLocation: LocationData | null;
}

interface StepComponentProps {
  data: FormDataState;
  onChange: (name: keyof FormDataState, value: any) => void;
  onGetLocation: (locationType: 'departure' | 'destination') => Promise<void>;
}

interface CreateDeliveryScreenProps {
  onClose?: () => void;
}

// --- Reusable Components ---

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={{
    backgroundColor: 'transparent',
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  }}>{children}</View>
);
const CardContent = ({ children }: { children: React.ReactNode }) => <View style={{ padding: 20, gap: 16 }}>{children}</View>;
const InputLabel = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</Text>
);

const Input = (props: React.ComponentProps<typeof TextInput>) => {
  const { colorScheme } = useColorScheme();
  return (
    <TextInput 
      style={{
        height: 52,
        backgroundColor: colorScheme === 'dark' ? '#27272a' : '#f9fafb',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        color: colorScheme === 'dark' ? '#fff' : '#18181b',
        fontSize: 15,
      }}
      placeholderTextColor={props.placeholderTextColor || '#9ca3af'} 
      {...props} 
    />
  );
};

const Textarea = (props: React.ComponentProps<typeof TextInput>) => {
  const { colorScheme } = useColorScheme();
  return (
    <TextInput 
      style={{
        minHeight: 100,
        backgroundColor: colorScheme === 'dark' ? '#27272a' : '#f9fafb',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        color: colorScheme === 'dark' ? '#fff' : '#18181b',
        fontSize: 15,
      }}
      placeholderTextColor={props.placeholderTextColor || '#9ca3af'} 
      multiline 
      textAlignVertical="top" 
      {...props} 
    />
  );
};

const Select = ({ label, onPress }: { label: React.ReactNode, onPress: () => void }) => {
  const { colorScheme } = useColorScheme();
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={{
        height: 52,
        backgroundColor: colorScheme === 'dark' ? '#27272a' : '#f9fafb',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {typeof label === 'string' ? (
        <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#18181b' }}>{label}</Text>
      ) : (
        label
      )}
      <ChevronDown size={16} color="#6b7280" />
    </TouchableOpacity>
  );
};

const Button = ({ children, variant, onPress, disabled }: { children: React.ReactNode, variant?: 'outline', onPress: () => void, disabled?: boolean }) => {
  const { colorScheme } = useColorScheme();
  
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={{
          height: 56,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#16a34a',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#16a34a' }}>{children}</Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <LinearGradient
        colors={['#16a34a', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 56,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#16a34a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{children}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const ValidatedInput = ({ value, ...props }: { value: string } & React.ComponentProps<typeof TextInput>) => {
  const isValid = value.trim() !== '';
  return (
    <View style={{ position: 'relative', justifyContent: 'center' }}>
      <Input value={value} {...props} />
      {isValid && (
        <MotiView from={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ position: 'absolute', right: 12 }}>
          <Check size={18} color="#10b981" />
        </MotiView>
      )}
    </View>
  );
};

const ValidatedTextarea = ({ value, ...props }: { value: string } & React.ComponentProps<typeof TextInput>) => {
  const isValid = value.trim() !== '';
  return (
    <View style={{ position: 'relative' }}>
      <Textarea value={value} {...props} />
      {isValid && (
        <MotiView from={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ position: 'absolute', right: 12, top: 12 }}>
          <Check size={18} color="#10b981" />
        </MotiView>
      )}
    </View>
  );
};

// --- Multi-Step Form Components ---
const STEPS = [
    { number: 1, title: 'Object', icon: Package },
    { number: 2, title: 'Adresses', icon: MapPin },
    { number: 3, title: 'Finalisation', icon: Clock },
];

const CATEGORY_CONFIG = [
  { key: 'delivery', label: 'Livraison', icon: Package },
  { key: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { key: 'pet_care', label: 'Animaux', icon: PawPrint },
  { key: 'services', label: 'Services', icon: Wrench },
];

const ProgressBar = ({ currentStep }: { currentStep: number }) => {
  const { colorScheme } = useColorScheme();
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {STEPS.map((step, index) => (
                <React.Fragment key={step.number}>
                    <View style={{ alignItems: 'center' }}>
            <MotiView 
              from={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: currentStep === step.number ? 1.1 : 1, opacity: 1 }} 
              transition={{ type: 'spring', damping: 15 }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: currentStep >= step.number ? 0 : 2,
                borderColor: colorScheme === 'dark' ? '#3f3f46' : '#e5e7eb',
                backgroundColor: currentStep >= step.number ? 'transparent' : (colorScheme === 'dark' ? '#27272a' : '#f3f4f6'),
              }}
            >
              {currentStep >= step.number ? (
                <LinearGradient
                  colors={['#16a34a', '#22c55e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <step.icon size={22} color="white" strokeWidth={2.5} />
                </LinearGradient>
              ) : (
                <step.icon size={22} color="#9ca3af" strokeWidth={2} />
              )}
            </MotiView>
            <Text style={{ 
              marginTop: 8, 
              fontSize: 11, 
              fontWeight: currentStep >= step.number ? '700' : '600',
              color: currentStep >= step.number ? '#16a34a' : '#9ca3af',
            }}>{step.title}</Text>
                    </View>
                    {index < STEPS.length - 1 && (
            <View style={{ flex: 1, height: 3, backgroundColor: colorScheme === 'dark' ? '#3f3f46' : '#e5e7eb', marginHorizontal: 8, marginTop: -20, borderRadius: 2 }}>
              <MotiView 
                from={{ scaleX: 0 }} 
                animate={{ scaleX: currentStep > step.number ? 1 : 0 }} 
                transition={{ type: 'spring', duration: 400 }}
                style={{ height: '100%', borderRadius: 2, transformOrigin: 'left' }}
              >
                <LinearGradient
                  colors={['#16a34a', '#22c55e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1, borderRadius: 2 }}
                />
              </MotiView>
            </View>
                    )}
                </React.Fragment>
            ))}
        </View>
    </View>
  );
};

const Step1_Addresses = ({ data, onChange, onGetLocation }: StepComponentProps) => {
  const { colorScheme } = useColorScheme();
  return (
  <BlurView intensity={20} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
    <View style={{ backgroundColor: colorScheme === 'dark' ? 'rgba(39,39,42,0.8)' : 'rgba(255,255,255,0.8)' }}>
      <CardContent>
        {data.category === 'delivery' && (
          <View>
            <InputLabel>Point de départ</InputLabel>
            <ValidatedInput value={data.departure} onChangeText={text => onChange('departure', text)} placeholder="Adresse de prise en charge" />
            <TouchableOpacity 
              onPress={() => onGetLocation('departure')} 
              style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Navigation size={14} color="#16a34a" />
              <Text style={{ color: '#16a34a', fontSize: 13, fontWeight: '600' }}>Utiliser ma position actuelle</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ marginTop: data.category === 'delivery' ? 16 : 0 }}>
          <InputLabel>Destination</InputLabel>
          <ValidatedInput value={data.destination} onChangeText={text => onChange('destination', text)} placeholder="Adresse de livraison" />
          <TouchableOpacity 
            onPress={() => onGetLocation('destination')} 
            style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Navigation size={14} color="#16a34a" />
            <Text style={{ color: '#16a34a', fontSize: 13, fontWeight: '600' }}>Utiliser ma position actuelle</Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </View>
  </BlurView>
  );
};


const Step2_Package = ({ data, onChange, showCategoryModal }: StepComponentProps & { showCategoryModal: () => void }) => {
  const { colorScheme } = useColorScheme();
  const selectedCat = CATEGORY_CONFIG.find(cat => cat.key === data.category);
  return (
    <BlurView intensity={20} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
      <View style={{ backgroundColor: colorScheme === 'dark' ? 'rgba(39,39,42,0.8)' : 'rgba(255,255,255,0.8)' }}>
        <CardContent>
          <View>
            <InputLabel>Catégorie</InputLabel>
            <Select
              label={
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {selectedCat && <selectedCat.icon size={20} color="#16a34a" style={{ marginRight: 8 }} />}
                  <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#18181b', fontSize: 15 }}>
                    {selectedCat ? selectedCat.label : 'Sélectionner une catégorie'}
                  </Text>
                </View>
              }
              onPress={showCategoryModal}
            />
          </View>
          <View style={{ marginTop: 16 }}><InputLabel>Description</InputLabel><ValidatedTextarea value={data.description} onChangeText={text => onChange('description', text)} placeholder="Décrivez votre colis..." /></View>
          {data.category === 'delivery' && (
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
              <View style={{ flex: 1 }}><InputLabel>Poids (kg)</InputLabel><ValidatedInput value={data.weight} onChangeText={text => onChange('weight', text)} placeholder="2.5" keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><InputLabel>Taille</InputLabel><Select label={data.size} onPress={() => {}} /></View>
            </View>
          )}
        </CardContent>
      </View>
    </BlurView>
  );
};

const Step3_Finalize = ({ data, onChange }: StepComponentProps) => {
  const { colorScheme } = useColorScheme();
  return (
  <BlurView intensity={20} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
    <View style={{ backgroundColor: colorScheme === 'dark' ? 'rgba(39,39,42,0.8)' : 'rgba(255,255,255,0.8)' }}>
      <CardContent>
        <View><InputLabel>Heure de prise en charge</InputLabel><ValidatedInput value={data.pickupTime} onChangeText={text => onChange('pickupTime', text)} placeholder="Maintenant" /></View>
        {/* Si catégorie = livraison, afficher deliveryTime */}
        {data.category === 'delivery' && (
          <View style={{ marginTop: 16 }}>
            <InputLabel>Heure de livraison</InputLabel>
            <ValidatedInput value={data.deliveryTime || ''} onChangeText={text => onChange('deliveryTime', text)} placeholder="Ex: 15:30" />
          </View>
        )}
        <View style={{ marginTop: 16 }}>
          <InputLabel>Prix proposé (FCFA)</InputLabel>
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: 16, zIndex: 10 }}><DollarSign size={18} color="#9ca3af" /></View>
            <ValidatedInput
              value={data.price}
              onChangeText={text => onChange('price', text)}
              placeholder="15000"
              keyboardType="numeric"
              style={{ paddingLeft: 44 }}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>
        {/* Durée estimée TOUJOURS visible */}
        <View style={{ marginTop: 16 }}>
          <InputLabel>Durée estimée (min)</InputLabel>
          <ValidatedInput value={data.duration || ''} onChangeText={text => onChange('duration', text)} placeholder="Ex: 45" keyboardType="numeric" />
        </View>
      </CardContent>
    </View>
  </BlurView>
  );
};

// --- Main Screen Component ---


export function CreateDeliveryScreen({ onClose }: CreateDeliveryScreenProps) {
  const { colorScheme } = useColorScheme();
  const [step, setStep] = useState(1);
  const initialFormData: FormDataState = {
    departure: '', destination: '',
    description: '', weight: '', size: 'Moyen',
    pickupTime: '',
    deliveryTime: '',
    duration: '',
    price: '',
    category: '',
    departureLocation: null,
    destinationLocation: null,
  };
  const [formData, setFormData] = useState<FormDataState>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const handleInputChange = (name: keyof FormDataState, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = async (locationType: 'departure' | 'destination') => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setMessage({ type: 'error', text: 'Permission de géolocalisation refusée.' });
      return;
    }
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      handleInputChange(`${locationType}Location`, { latitude, longitude });

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const address = geocode[0];
        handleInputChange(locationType, `${address.street}, ${address.city}`);
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur lors de la récupération de la position.' });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = useMemo(() => {
    switch (step) {
      case 1:
        if (formData.category === 'delivery') {
          return (
            formData.description.trim() !== '' &&
            formData.weight.trim() !== '' &&
            formData.category.trim() !== ''
          );
        } else {
          return (
            formData.description.trim() !== '' &&
            formData.category.trim() !== ''
          );
        }
      case 2:
        if (formData.category === 'delivery') {
          return formData.departure.trim() !== '' && formData.destination.trim() !== '';
        }
        return formData.destination.trim() !== '';
      case 3:
        if (formData.category === 'delivery') {
          return (
            formData.pickupTime.trim() !== '' &&
            formData.deliveryTime?.trim() !== '' &&
            formData.duration?.trim() !== '' &&
            formData.price.trim() !== ''
          );
        } else {
          // Pour toutes les autres catégories, duration est aussi requis
          return (
            formData.pickupTime.trim() !== '' &&
            formData.price.trim() !== '' &&
            formData.duration?.trim() !== ''
          );
        }
      default:
        return false;
    }
  }, [step, formData]);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleCategorySelect = (cat: string) => {
    handleInputChange('category', cat);
    setCategoryModalVisible(false);
  };

  const handleShowCategoryModal = () => setCategoryModalVisible(true);
  const handleHideCategoryModal = () => setCategoryModalVisible(false);

  const handleClose = () => {
    console.log('handleClose called, onClose exists:', !!onClose);
    const hasData = formData.departure || formData.destination || formData.description || formData.category;
    
    if (hasData) {
      Alert.alert(
        'Quitter la création ?',
        'Vos modifications seront perdues.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Quitter', 
            style: 'destructive', 
            onPress: () => {
              console.log('Quitter pressed');
              setFormData(initialFormData);
              setStep(1);
              if (onClose) {
                console.log('Calling onClose');
                onClose();
              }
            }
          },
        ]
      );
    } else {
      console.log('No data, closing directly');
      if (onClose) {
        console.log('Calling onClose directly');
        onClose();
      } else {
        console.log('onClose is undefined!');
      }
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setMessage({ type: 'error', text: 'Vous devez être connecté pour publier.' });
        setLoading(false);
        return;
      }

      // Géocoder les adresses manuelles si coordonnées absentes
      let departureLocation = formData.departureLocation;
      let destinationLocation = formData.destinationLocation;

      if (!departureLocation && formData.departure.trim() !== '') {
        const geo = await Location.geocodeAsync(formData.departure);
        if (geo && geo.length > 0) {
          departureLocation = { latitude: geo[0].latitude, longitude: geo[0].longitude };
        }
      }
      if (!destinationLocation && formData.destination.trim() !== '') {
        const geo = await Location.geocodeAsync(formData.destination);
        if (geo && geo.length > 0) {
          destinationLocation = { latitude: geo[0].latitude, longitude: geo[0].longitude };
        }
      }

      await addDoc(collection(db, 'missions'), {
        ...formData,
        departureLocation,
        destinationLocation,
        userId: user.uid,
        createdAt: serverTimestamp(),
        statut: 'disponible', // Ajout du statut par défaut
      });

      // Mettre à jour le rôle de l'utilisateur
      await updateDoc(doc(db, 'users', user.uid), {
        roles: arrayUnion('créateur'),
        missionsCreees: serverTimestamp()
      });

      setMessage({ type: 'success', text: 'Mission publiée avec succès !' });
      setFormData(initialFormData);
      setStep(1);
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
        onClose?.();
      }, 2000);
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur lors de la publication.' });
      console.error('Error publishing mission:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const stepProps = { data: formData, onChange: handleInputChange, onGetLocation: handleGetLocation };
    return (
      <MotiView key={step} from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} exit={{ opacity: 0, translateY: -20 }} transition={{ type: 'timing', duration: 250 }}>
        {step === 1 && <Step2_Package {...stepProps} showCategoryModal={handleShowCategoryModal} />}
        {step === 2 && <Step1_Addresses {...stepProps} />}
        {step === 3 && <Step3_Finalize {...stepProps} />}
      </MotiView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#09090b' : '#f9fafb' }}>
      {/* Header Custom Moderne avec Bouton Fermer - Opaque */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: colorScheme === 'dark' ? '#09090b' : '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity 
            onPress={handleClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color={colorScheme === 'dark' ? '#fff' : '#18181b'} strokeWidth={2.5} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: colorScheme === 'dark' ? '#fff' : '#18181b' 
            }}>
              Créer une mission
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: colorScheme === 'dark' ? '#a1a1aa' : '#71717a',
              marginTop: 2,
              fontWeight: '600'
            }}>
              Étape {step}/3
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* --- Modal Catégorie --- */}
        <Modal
          visible={categoryModalVisible}
          animationType="slide"
          transparent
          onRequestClose={handleHideCategoryModal}
        >
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={handleHideCategoryModal} />
          <View style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: colorScheme === 'dark' ? '#18181b' : '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: colorScheme === 'dark' ? '#fff' : '#18181b' }}>
              Choisir une catégorie
            </Text>
            {CATEGORY_CONFIG.map(cat => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => handleCategorySelect(cat.key)}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: formData.category === cat.key 
                    ? (colorScheme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)')
                    : 'transparent',
                }}
              >
                <cat.icon 
                  size={22} 
                  color={formData.category === cat.key ? '#16a34a' : (colorScheme === 'dark' ? '#a3a3a3' : '#6b7280')} 
                  style={{ marginRight: 12 }} 
                />
                <Text style={{ 
                  fontSize: 16, 
                  color: formData.category === cat.key 
                    ? '#16a34a' 
                    : (colorScheme === 'dark' ? '#fff' : '#18181b'),
                  fontWeight: formData.category === cat.key ? '700' : '400',
                }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ marginTop: 8 }}>
              <Button onPress={handleHideCategoryModal} variant="outline">Annuler</Button>
            </View>
          </View>
        </Modal>

        {/* Message d'alerte */}
        {message.text ? (
          <MotiView 
            from={{ translateY: -50, opacity: 0 }} 
            animate={{ translateY: 0, opacity: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: 16,
              zIndex: 200,
              backgroundColor: message.type === 'success' ? '#16a34a' : '#ef4444',
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>{message.text}</Text>
          </MotiView>
        ) : null}

        <ScrollView 
          contentContainerStyle={{ paddingBottom: 140, paddingTop: 120 }} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          scrollEventThrottle={16}
          bounces={false}
        >
          <ProgressBar currentStep={step} />
          
          {/* Boutons navigation */}
          <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {step > 1 && (
              <TouchableOpacity 
                onPress={handlePrev} 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}
              >
                <ArrowLeft size={18} color={colorScheme === 'dark' ? '#d1d5db' : '#4b5563'} />
                <Text style={{ color: colorScheme === 'dark' ? '#d1d5db' : '#4b5563', fontWeight: '600', marginLeft: 8 }}>
                  Précédent
                </Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {step < 3 && (
              <TouchableOpacity 
                onPress={handleNext} 
                disabled={!isStepValid} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 8,
                  opacity: !isStepValid ? 0.5 : 1 
                }}
              >
                <Text style={{ color: colorScheme === 'dark' ? '#d1d5db' : '#4b5563', fontWeight: '600', marginRight: 8 }}>
                  Suivant
                </Text>
                <ArrowLeft size={18} style={{ transform: [{ scaleX: -1 }] }} color={colorScheme === 'dark' ? '#d1d5db' : '#4b5563'} />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ paddingHorizontal: 24 }}>{renderStepContent()}</View>
          {step === 3 && (
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <Button onPress={handlePublish} disabled={!isStepValid || loading}>
                {loading
                  ? 'Publication...'
                  : `Publier${formData.category ? ` (${CATEGORY_CONFIG.find(cat => cat.key === formData.category)?.label || formData.category})` : ''}`}
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default CreateDeliveryScreen;