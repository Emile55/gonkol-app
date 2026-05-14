import { Link, useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, TextInputProps, DimensionValue } from 'react-native';
import { MotiView, MotiTransitionProp } from 'moti';
import { Mail, Lock, User } from 'lucide-react-native';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { auth, db } from '@/config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useColorScheme } from 'nativewind'; // Import de nativewind

// Constante de la couleur verte primaire
const GREEN_PRIMARY = '#16a34a';

interface AuthInputProps extends TextInputProps {
  icon: React.ReactNode;
}

const AuthInput: React.FC<AuthInputProps> = ({ icon, ...props }) => {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#a1a1aa' : '#6b7280'; // Gris pour l'icône (zinc-400 / gray-600)

  return (
    <View 
      // Arrière-plan adapté au mode sombre (zinc-800 ou blanc) et bordures bien définies
      className="flex-row items-center rounded-xl mb-4 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
    >
      <View className="pl-4">
        {/* Assurer que la couleur de l'icône est dynamique */}
        {React.cloneElement(icon as React.ReactElement, { color: iconColor })}
      </View>
      <TextInput
        // Texte d'entrée visible : blanc en mode sombre, sombre en mode clair
        className="flex-1 h-14 px-4 text-base text-zinc-900 dark:text-white"
        placeholderTextColor={colorScheme === 'dark' ? '#71717a' : '#9ca3af'}
        {...props}
      />
    </View>
  );
};

interface AuthButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ title, onPress, loading, disabled }) => (
  <TouchableOpacity 
    onPress={onPress} 
    className={`h-14 rounded-xl justify-center items-center mt-4 ${disabled || loading ? 'opacity-70' : ''}`}
    style={{ backgroundColor: GREEN_PRIMARY }} // Utilisation du Vert Primaire
    disabled={disabled || loading}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-semibold">{title}</Text>}
  </TouchableOpacity>
);


const PasswordStrengthIndicator = ({ strength }: { strength: number }) => {
  const strengthLevels = [
    { width: '25%', color: 'bg-red-500' },
    { width: '50%', color: 'bg-orange-500' },
    { width: '75%', color: 'bg-lime-500' },
    { width: '100%', color: 'bg-green-500' },
  ];

  const level = strengthLevels[strength] || { width: '0%', color: 'bg-gray-200 dark:bg-zinc-700' };
  const transition: MotiTransitionProp = { type: 'timing', duration: 300 };

  return (
    <View className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full w-full mb-4">
      <MotiView
        from={{ width: '0%' }}
        animate={{ width: level.width as DimensionValue }}
        transition={transition}
        className={`h-full rounded-full ${level.color}`}
      />
    </View>
  );
};

const SignupForm = () => {
  const router = useRouter();
  const { promptAsync: promptGoogle, loading: googleLoading } = useGoogleAuth();
  const { colorScheme } = useColorScheme();
    
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = useMemo(() => {
    let strength = -1;
    if (password.length > 5) strength++;
    if (password.length > 7) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 3);
  }, [password]);

  // Logique d'inscription
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!name || !email || !password) {
        setError("Veuillez remplir tous les champs.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: serverTimestamp(),
        photoURL: user.photoURL || null,
      });
      
      // La navigation est souvent gérée par un listener d'état d'authentification dans _layout.tsx
      // Mais on peut rediriger explicitement si nécessaire
      // router.replace('/(tabs)'); 

    } catch (err: any) {
      let errorMessage = "Une erreur est survenue lors de l'inscription.";
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "Cette adresse e-mail est déjà utilisée.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Adresse e-mail invalide.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Le mot de passe est trop faible.";
      }
      setError(errorMessage);
      console.error("Signup Error: ", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      className="w-full"
    >
      {error ? <Text className="text-red-500 text-center mb-4 font-medium">{error}</Text> : null}
      
      {/* Champs de saisie */}
      <AuthInput
        icon={<User size={20} />}
        placeholder="Nom complet"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <AuthInput
        icon={<Mail size={20} />}
        placeholder="Adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthInput
        icon={<Lock size={20} />}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <PasswordStrengthIndicator strength={passwordStrength} />

      <AuthInput
        icon={<Lock size={20} />}
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <AuthButton 
        title="S'inscrire" 
        onPress={handleSignup} 
        loading={loading}
        disabled={passwordStrength < 2} 
      />

      {/* Séparateur OU */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-300 dark:bg-zinc-700" />
        <Text className="mx-4 text-gray-500 dark:text-zinc-500">OU</Text>
        <View className="flex-1 h-px bg-gray-300 dark:bg-zinc-700" />
      </View>

      {/* Bouton Google */}
      <TouchableOpacity
        onPress={() => promptGoogle()}
        className="h-14 border rounded-xl justify-center items-center flex-row"
        // Bordure grise et fond adaptés pour le Dark Mode
        style={{ borderColor: colorScheme === 'dark' ? '#3f3f46' : '#d1d5db', backgroundColor: colorScheme === 'dark' ? '#262626' : '#fff' }}
        disabled={googleLoading}
      >
        <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
          Continuer avec Google
        </Text>
      </TouchableOpacity>

      {/* Lien de connexion */}
      <View className="flex-row justify-center items-center mt-6">
        <Text className="text-zinc-600 dark:text-zinc-400">Déjà un compte ?</Text>
        <Link href="/auth/login" asChild>
            <TouchableOpacity>
                <Text className="font-semibold ml-2" style={{ color: GREEN_PRIMARY }}>Se connecter</Text>
            </TouchableOpacity>
        </Link>
      </View>
    </MotiView>
  );
};

export default SignupForm;