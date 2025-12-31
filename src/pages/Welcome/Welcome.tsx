import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import Button from '../../components/Button/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { globalStyles } from '../../styles/globalStyles';
import type { RootStackParamList } from '../../navigation/types';
import { firebaseAuth } from '../../config/firebase';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Welcome'
>;

const WEB_CLIENT_ID = '25460966938-m9v2v9n0b49ftsbmq453uvg65jpb135t.apps.googleusercontent.com'; // Replace with actual Web Client ID from Firebase Console

const Welcome: React.FC = () => {
    const navigation = useNavigation<WelcomeScreenNavigationProp>();
    const auth = firebaseAuth();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID,
            offlineAccess: false,
        });
    }, []);

    const handleLogin = () => {
        navigation.navigate('Login', { isSignUp: false });
    };

    const handleRegister = () => {
        navigation.navigate('Login', { isSignUp: true });
    };

    const signInWithGoogle = async () => {
        try {
            if (Platform.OS === 'android') {
                await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            }

            const response = await GoogleSignin.signIn();

            if (response.type !== 'success') {
                throw new Error('Google Sign-In was cancelled or failed');
            }

            const { idToken } = response.data;

            if (!idToken) {
                throw new Error('No ID token found');
            }

            // Build a Firebase credential with the Google ID token
            const googleCredential = GoogleAuthProvider.credential(idToken);

            // Sign in the user with the credential in Firebase
            await signInWithCredential(auth, googleCredential);
            console.log('Signed in with Google successfully!');

        } catch (error: any) {
            console.error('Google Sign-In Error:', error.message);
            Alert.alert('Sign-In Error', error.message);
        }
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.illustrationContainer}>
                    <Image
                        source={require('../../assets/welcome_illustration.png')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Start with taski</Text>
                    <Text style={styles.subtitle}>
                        Join us now and get your daily things right
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Login"
                        onPress={handleLogin}
                        style={styles.loginButton}
                    />
                    <Button
                        title="Register"
                        onPress={handleRegister}
                        variant="outline"
                        style={styles.registerButton}
                    />
                    <Button
                        title="Sign in with Google"
                        onPress={signInWithGoogle}
                        variant="outline"
                        style={styles.googleButton}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: SPACING.lg,
        justifyContent: 'space-between',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    logo: {
        width: 120,
        height: 40,
    },
    illustrationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: SPACING.xl,
    },
    illustration: {
        width: 285,
        height: 211,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.light.text,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.light.textSecondary,
        textAlign: 'center',
    },
    buttonContainer: {
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    loginButton: {
        width: '100%',
    },
    registerButton: {
        width: '100%',
    },
    googleButton: {
        width: '100%',
    },
});

export default Welcome;
