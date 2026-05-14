// hooks/useGoogleAuth.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { useRouter } from 'expo-router';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// À placer dans App.tsx ou un fichier d'init global (à ne faire qu'une fois)
GoogleSignin.configure({
  webClientId: '587441880219-e45k5p7fbldf13mclg4uqvhc9rm0k5g6.apps.googleusercontent.com',
  offlineAccess: false,
});

export const useGoogleAuth = () => {
  const router = useRouter();
  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('Pas de idToken Google');
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);
      console.log('[GoogleAuth] ✅ Connexion Firebase réussie');

      // Vérifie si le profil existe dans Firestore
     
      const userId = userCred.user.uid;
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        // Redirige vers la page de config du profil si c'est la première connexion
        router.replace('/profile/config');
      } else {
        router.replace('/');
      }
    } catch (e) {
      console.error('[GoogleAuth] ❌ Erreur Google Sign-In:', e);
      throw e;
    }
  };
  return {
    signInWithGoogle,
  };
};
