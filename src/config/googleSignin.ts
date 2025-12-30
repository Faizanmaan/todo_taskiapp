import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // Replace with your actual Web Client ID from Firebase Console -> Authentication -> Sign-in method -> Google
    webClientId: '25460966938-m9v2v9n0b49ftsbmq453uvg65jpb135t.apps.googleusercontent.com', 
    offlineAccess: true,
  });
};
