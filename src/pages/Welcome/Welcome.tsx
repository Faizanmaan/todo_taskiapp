import React from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../../components/Button/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { globalStyles } from '../../styles/globalStyles';
import type { RootStackParamList } from '../../navigation/types';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Welcome'
>;

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { configureGoogleSignIn } from '../../config/googleSignin';
import { useDispatch } from 'react-redux';
import { setUser, setLoading, setError } from '../../store/authSlice';
import { firebaseAuth, firebaseFirestore } from '../../config/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const Welcome: React.FC = () => {
    const navigation = useNavigation<WelcomeScreenNavigationProp>();
    const dispatch = useDispatch();

    React.useEffect(() => {
        configureGoogleSignIn();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const signInResult = await GoogleSignin.signIn();

            if (signInResult.type === 'success') {
                const { idToken, user } = signInResult.data;
                const googleCredential = GoogleAuthProvider.credential(idToken);

                dispatch(setLoading(true));
                const userCredential = await signInWithCredential(firebaseAuth(), googleCredential);

                // Check if user exists in Firestore, if not create
                const userDocRef = doc(firebaseFirestore(), 'users', userCredential.user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        fullName: user.name,
                        displayName: user.name,
                        email: user.email,
                        photoURL: user.photo,
                        createdAt: Timestamp.fromDate(new Date()),
                    });
                }

                dispatch(setUser(userCredential.user));
            } else {
                // sign in was cancelled by user
                dispatch(setLoading(false));
            }

        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            dispatch(setError(error.message));
            Alert.alert('Error', 'Failed to sign in with Google');
            dispatch(setLoading(false));
        }
    };

    const handleLogin = () => {
        navigation.navigate('Login', { isSignUp: false });
    };

    const handleRegister = () => {
        navigation.navigate('Login', { isSignUp: true });
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

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Button
                        title="Continue with Google"
                        onPress={handleGoogleLogin}
                        variant="outline"
                        style={styles.googleButton}
                        icon={<Image source={require('../../assets/google_icon.png')} style={styles.googleIcon} />}
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.sm,
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.light.border,
    },
    dividerText: {
        marginHorizontal: SPACING.md,
        color: COLORS.light.textSecondary,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    googleButton: {
        width: '100%',
        borderColor: COLORS.light.border,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: SPACING.sm,
    },
});

export default Welcome;
