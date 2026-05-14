import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, useColorScheme, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function EditNameScreen() {
  const [name, setName] = useState("");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const fetchName = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError('Utilisateur non authentifié');
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setName(userDoc.data().name || '');
        }
      } catch {
        setError('Erreur lors du chargement du nom.');
      } finally {
        setLoading(false);
      }
    };
    fetchName();
  }, [auth]);

  const handleSave = async () => {
    setError('');
    
    if (!name.trim()) {
      setError('Le nom ne peut pas être vide');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { name });
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch {
      setError('Impossible de mettre à jour le nom.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
      {/* Header avec bouton retour */}
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${
        isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'
      }`}>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={isDark ? '#fff' : '#18181b'} strokeWidth={2.5} />
          <Text className={`ml-2 font-bold text-base ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Retour
          </Text>
        </TouchableOpacity>
        <Text className={`font-extrabold text-base uppercase tracking-wide ${
          isDark ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          Modifier le nom
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        className={`${isDark ? 'bg-zinc-900' : 'bg-white'}`}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-4 py-6 justify-center">
          {/* Titre */}
          <Text className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Quel est votre nom ?
          </Text>
          <Text className={`text-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Mettez à jour votre profil avec votre vrai nom
          </Text>

          {/* Input */}
          <View className={`rounded-lg border-2 border-b-4 p-4 mb-4 ${
            error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
            (isDark ? 'border-zinc-700 bg-zinc-800' : 'border-gray-300 bg-gray-50')
          }`}>
            <TextInput
              className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              placeholder="Entrez votre nom"
              placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
              editable={!loading && !saving}
              maxLength={50}
            />
          </View>

          {/* Erreur */}
          {error && (
            <MotiView
              from={{ translateY: -10, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              className="mb-4"
            >
              <View className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                <Text className="text-red-700 dark:text-red-400 text-sm font-semibold">
                  {error}
                </Text>
              </View>
            </MotiView>
          )}

          {/* Success */}
          {success && (
            <MotiView
              from={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4"
            >
              <View className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-3 flex-row items-center">
                <CheckCircle2 size={20} color="#10b981" strokeWidth={2.5} />
                <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold ml-2">
                  Nom mis à jour avec succès !
                </Text>
              </View>
            </MotiView>
          )}

          {/* Compteur de caractères */}
          <View className="mb-6">
            <Text className={`text-xs font-medium text-right ${
              isDark ? 'text-zinc-500' : 'text-zinc-500'
            }`}>
              {name.length} / 50 caractères
            </Text>
          </View>

          {/* Bouton Enregistrer */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            className={`rounded-lg py-4 px-6 items-center justify-center flex-row gap-2 border-2 border-b-4 ${
              saving || loading || success || !name.trim()
                ? 'bg-green-400 border-green-500 opacity-70' 
                : 'bg-green-500 border-green-600 active:border-b-2'
            }`}
            disabled={loading || saving || success || !name.trim()}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : success ? (
              <>
                <CheckCircle2 size={20} color="#fff" strokeWidth={2.5} />
                <Text className="text-white font-extrabold text-base">Enregistré !</Text>
              </>
            ) : (
              <Text className="text-white font-extrabold text-base">
                {loading ? 'Chargement...' : 'Enregistrer'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
            <Text className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              💡 Conseil : Utilisez votre vrai nom pour que les clients vous reconnaissent facilement.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}



