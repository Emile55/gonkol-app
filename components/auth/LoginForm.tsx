import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, TextInputProps } from 'react-native';
import { MotiView } from 'moti';
import { Mail, Lock } from 'lucide-react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useColorScheme } from 'nativewind'; // Import de nativewind pour le mode sombre

import { Svg, Path } from 'react-native-svg';

// Constante de la couleur verte primaire
const GREEN_PRIMARY = '#16a34a';

const GoogleIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 533.5 544.3">
        <Path d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z" fill="#4285f4"/>
        <Path d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.2l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z" fill="#34a853"/>
        <Path d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z" fill="#fbbc04"/>
        <Path d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z" fill="#ea4335"/>
    </Svg>
);

interface AuthInputProps extends TextInputProps {
  icon: React.ReactNode;
}

const AuthInput: React.FC<AuthInputProps> = ({ icon, ...props }) => {
    const { colorScheme } = useColorScheme();
    const iconColor = colorScheme === 'dark' ? '#a1a1aa' : '#6b7280'; // Gris pour l'icône

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

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { signInWithGoogle } = useGoogleAuth();
    const [googleLoading, setGoogleLoading] = useState(false);
    const { colorScheme } = useColorScheme();

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.replace('/(tabs)');
        } catch (e: any) {
            if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                setError('Email ou mot de passe incorrect.');
            } else {
                setError('Une erreur est survenue. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Fonction pour gérer la connexion Google, mise à jour pour le loading et l'erreur
    const handleGoogleLogin = async () => {
        setError("");
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
        } catch (e) {
            // Afficher l'erreur si la connexion Google échoue
            setError('Erreur lors de la connexion via Google.');
            console.error(e);
        } finally {
            setGoogleLoading(false);
        }
    }


    return (
        <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            className="w-full"
        >
            {error ? <Text className="text-red-500 text-center mb-4 font-medium">{error}</Text> : null}
            
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

            {/* Lien Mot de passe oublié (couleur verte) */}
            <View className="flex-row justify-end items-center mb-4">
                <Link href="/auth/forgot-password" asChild>
                    <TouchableOpacity>
                        <Text className="font-medium" style={{ color: GREEN_PRIMARY }}>
                            Mot de passe oublié ?
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>

            <AuthButton title="Se connecter" onPress={handleLogin} loading={loading} />

            {/* Séparateur OU adapté au Dark Mode */}
            <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-300 dark:bg-zinc-700" />
                <Text className="mx-4 text-gray-500 dark:text-zinc-500" style={{ backgroundColor: colorScheme === 'dark' ? '#262626' : '#f9fafb' }}>
                    OU
                </Text>
                <View className="flex-1 h-px bg-gray-300 dark:bg-zinc-700" />
            </View>

            {/* Bouton Google adapté au Dark Mode */}
            <TouchableOpacity 
                onPress={handleGoogleLogin} 
                disabled={googleLoading || loading}
                // Bordure grise et fond adaptés pour le Dark Mode
                className="h-14 border rounded-xl justify-center items-center flex-row"
                style={{ borderColor: colorScheme === 'dark' ? '#3f3f46' : '#d1d5db', backgroundColor: colorScheme === 'dark' ? '#262626' : '#fff' }}
            >
                {googleLoading 
                    ? <ActivityIndicator color={colorScheme === 'dark' ? '#fff' : '#333'} /> 
                    : <>
                        <GoogleIcon />
                        <Text className="text-lg font-semibold ml-3 text-zinc-900 dark:text-white">
                            Continuer avec Google
                        </Text>
                      </>
                }
            </TouchableOpacity>

            {/* Lien vers S'inscrire (couleur verte) */}
            <View className="flex-row justify-center items-center mt-6">
                <Text className="text-zinc-600 dark:text-zinc-400">Pas encore de compte ?</Text>
                <Link href="/auth/signup" asChild>
                    <TouchableOpacity>
                        <Text className="font-semibold ml-2" style={{ color: GREEN_PRIMARY }}>S&apos;inscrire</Text>
                    </TouchableOpacity>
                </Link>
            </View>

        </MotiView>
    );
};

export default LoginForm;