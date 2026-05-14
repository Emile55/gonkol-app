

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db} from '../../config/firebase';
import { useRouter } from 'expo-router';



export default function ProfileConfigScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Firebase instances
 

  // Récupère l'utilisateur authentifié
  const user = auth.currentUser;
  const userId = user?.uid;

  const pickImage = async () => {
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (e) {
      setError('Erreur lors de la sélection de la photo.');
    }
  };

  const handleSave = async () => {
    if (!userId) {
      setError("Utilisateur non authentifié");
      return;
    }
    setUploading(true);
    setError('');
    try {
      // Enregistre les infos dans Firestore (collection 'users', doc = userId)
      await setDoc(doc(db, 'users', userId), {
        name,
        photo,
        niveau: 1, // Niveau initial
        xp: 0, // XP initial
        roles: ['chasseur'], // Rôle par défaut
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      // Redirige vers la page d'accueil après la mise à jour
      router.replace('/');
    } catch (e) {
      setError('Erreur lors de la sauvegarde dans Firestore.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-2xl font-bold text-slate-800 mb-6 text-center">
        Configuration du profil
      </Text>
      <TouchableOpacity onPress={pickImage} className="self-center mb-6">
        {photo ? (
          <Image source={{ uri: photo }} className="w-24 h-24 rounded-full border-2 border-blue-600" />
        ) : (
          <View className="w-24 h-24 rounded-full bg-gray-200 justify-center items-center border-2 border-gray-300">
            <Text className="text-slate-400 text-4xl">+</Text>
          </View>
        )}
        <Text className="text-blue-600 mt-2 text-center">Choisir une photo</Text>
      </TouchableOpacity>
      <TextInput
        placeholder="Nom complet"
        value={name}
        onChangeText={setName}
        className="border border-gray-300 rounded-xl p-4 text-base mb-6 text-slate-800 bg-slate-50"
        placeholderTextColor="#94a3b8"
      />
      {error ? <Text className="text-red-500 mb-3 text-center">{error}</Text> : null}
      <TouchableOpacity
        onPress={handleSave}
        disabled={uploading || !name}
        className={`rounded-xl p-4 items-center ${uploading || !name ? 'bg-blue-300' : 'bg-blue-700'}`}
      >
        {uploading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Enregistrer</Text>}
      </TouchableOpacity>
    </View>
  );
}
