import { Link } from 'expo-router';
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, TextInputProps, Keyboard } from 'react-native';
import { MotiView } from 'moti';
import { Mail, CheckCircle } from 'lucide-react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';

// Reusable components
interface AuthInputProps extends TextInputProps {
  icon: React.ReactNode;
}

const AuthInput: React.FC<AuthInputProps> = ({ icon, ...props }) => (
  <View className="flex-row items-center bg-white rounded-xl mb-4 border border-gray-200">
    <View className="pl-4">{icon}</View>
    <TextInput
      className="flex-1 h-14 px-4 text-base text-slate-800"
      placeholderTextColor="#9ca3af"
      {...props}
    />
  </View>
);

interface AuthButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ title, onPress, loading, disabled }) => (
  <TouchableOpacity 
    onPress={onPress} 
    className={`h-14 bg-blue-600 rounded-xl justify-center items-center mt-4 ${disabled || loading ? 'opacity-70' : ''}`}
    disabled={disabled || loading}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-semibold">{title}</Text>}
  </TouchableOpacity>
);


const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    setError('');
    Keyboard.dismiss();
    if (!email) {
      setError('Veuillez entrer votre adresse e-mail.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // To avoid user enumeration, we show success even if the user doesn't exist.
        setSubmitted(true);
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
        setLoading(false);
    }
  };

  if (submitted) {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
        className="w-full items-center p-8 bg-white rounded-2xl shadow-lg"
      >
        <CheckCircle size={60} color="#22c55e" />
        <Text className="text-2xl font-bold text-slate-800 mt-6">Vérifiez vos e-mails</Text>
        <Text className="text-base text-slate-600 text-center mt-2">
          Si un compte est associé à <Text className="font-bold">{email}</Text>, nous avons envoyé un lien pour réinitialiser le mot de passe.
        </Text>
        <Link href="/auth/login" asChild>
            <TouchableOpacity className="mt-8 bg-blue-600 py-3 px-6 rounded-lg">
                <Text className="text-white font-semibold">Retour à la connexion</Text>
            </TouchableOpacity>
        </Link>
      </MotiView>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      className="w-full"
    >
      <Text className="text-center text-slate-600 mb-6">
        Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </Text>

      {error ? <Text className="text-red-500 text-center mb-3 font-medium">{error}</Text> : null}
      
      <AuthInput
        icon={<Mail size={20} color="#6b7280" />}
        placeholder="Adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <AuthButton title="Envoyer le lien" onPress={handleResetPassword} loading={loading} />

      <Link href="/auth/login" asChild>
        <TouchableOpacity className="mt-6">
            <Text className="text-center text-slate-600 font-medium">Retour à la connexion</Text>
        </TouchableOpacity>
      </Link>

    </MotiView>
  );
};

export default ForgotPasswordForm;
