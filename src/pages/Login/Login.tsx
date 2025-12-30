import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { firebaseAuth, firebaseFirestore } from '../../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { setUser, setLoading, setError, setIsRegistering } from '../../store/authSlice';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { globalStyles } from '../../styles/globalStyles';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { configureGoogleSignIn } from '../../config/googleSignin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import type { RootStackParamList } from '../../navigation/types';

type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

const Login: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<LoginScreenRouteProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSignUp, setIsSignUp] = useState(route.params?.isSignUp ?? false);
    const [loading, setLoadingState] = useState(false);
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);

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

                setLoadingState(true);
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
                setLoadingState(false);
            }

        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            dispatch(setError(error.message));
            Alert.alert('Error', 'Failed to sign in with Google');
            setLoadingState(false);
        }
    };

    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        if (isSignUp && (!fullName || !phoneNumber)) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (isSignUp && !isTermsAccepted) {
            Alert.alert('Error', 'Please agree to the Terms & Conditions to register.');
            return;
        }

        // Validate password length BEFORE calling Firebase
        if (isSignUp && password.length < 6) {
            Alert.alert('Error', 'Password should be at least 6 characters.');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address.');
            return;
        }

        setLoadingState(true);

        try {
            let userCredential;
            if (isSignUp) {
                dispatch(setIsRegistering(true)); // Prevent auto-navigation to Home
                userCredential = await createUserWithEmailAndPassword(
                    firebaseAuth(),
                    email,
                    password,
                );

                // Save user data to Firestore
                try {
                    console.log('Saving user data to Firestore...', userCredential.user.uid);
                    await setDoc(doc(firebaseFirestore(), 'users', userCredential.user.uid), {
                        fullName,
                        displayName: fullName,
                        phoneNumber,
                        email,
                        createdAt: Timestamp.fromDate(new Date()),
                    });
                    console.log('User data saved successfully!');

                    // Verify data was saved
                    console.log('Verifying data save...');
                    const docSnap = await getDoc(doc(firebaseFirestore(), 'users', userCredential.user.uid));
                    if (docSnap.exists()) {
                        console.log('Verification successful: Document found', docSnap.data());
                    } else {
                        console.error('Verification failed: Document not found!');
                        throw new Error('Data verification failed: Document not found after save.');
                    }
                } catch (firestoreError: unknown) {
                    console.error('Error saving user data to Firestore:', firestoreError);
                    const message = firestoreError instanceof FirebaseError ? firestoreError.message : (firestoreError as Error).message;
                    Alert.alert('Warning', 'Account created but profile data could not be saved: ' + message);
                }

                // Sign out immediately to prevent auto-login
                await signOut(firebaseAuth());
                dispatch(setIsRegistering(false));

                Alert.alert(
                    'Success',
                    'Account created successfully! Please login with your credentials.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setIsSignUp(false);
                                setPassword('');
                            },
                        },
                    ],
                );
                return;
            } else {
                userCredential = await signInWithEmailAndPassword(
                    firebaseAuth(),
                    email,
                    password,
                );
            }
            dispatch(setUser(userCredential.user));
        } catch (error: unknown) {
            dispatch(setIsRegistering(false));
            let errorMessage = 'An error occurred. Please try again.';

            if (error instanceof FirebaseError) {
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'This email is already registered. Please login instead.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Please enter a valid email address.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password should be at least 6 characters.';
                } else if (error.code === 'auth/user-not-found') {
                    errorMessage = 'No account found with this email.';
                } else if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Incorrect password. Please try again.';
                } else if (error.code === 'auth/invalid-credential') {
                    errorMessage = 'Invalid email or password.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many failed attempts. Please try again later.';
                }
            }

            dispatch(setError(errorMessage));
            Alert.alert('Error', errorMessage);
            return;
        } finally {
            setLoadingState(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">

                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#B7B7B7" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{isSignUp ? 'Register' : 'Login'}</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <View style={styles.content}>
                        <View>
                            <Text style={styles.title}>
                                {isSignUp ? 'Join us today.' : 'Welcome Back.'}
                            </Text>
                            <Text style={styles.subtitle}>
                                {isSignUp
                                    ? 'It’s Nice too see you, let’s start'
                                    : 'It’s Nice too see you again, let’s get going'}
                            </Text>

                            <View style={styles.form}>
                                {isSignUp && (
                                    <Input
                                        label="Full Name"
                                        placeholder="Enter your full name"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        autoCapitalize="words"
                                        autoComplete="name"
                                    />
                                )}

                                <Input
                                    label="Email Address"
                                    placeholder="yourname@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />

                                {isSignUp && (
                                    <Input
                                        label="Phone Number"
                                        placeholder="Enter your phone number"
                                        value={phoneNumber}
                                        onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9+]/g, ''))}
                                        keyboardType="phone-pad"
                                        autoComplete="tel"
                                    />
                                )}

                                <Input
                                    label="Password"
                                    placeholder="Input password here..."
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                />

                                {isSignUp && (
                                    <TouchableOpacity
                                        style={styles.termsContainer}
                                        onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            isTermsAccepted && styles.checkboxChecked
                                        ]}>
                                            {isTermsAccepted && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </View>
                                        <Text style={styles.termsText}>
                                            I Agree with <Text style={styles.termsHighlight}>Term & Conditions</Text>
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.bottomSection, { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg }]}>
                <Button
                    title={isSignUp ? 'Register' : 'Login'}
                    onPress={handleEmailAuth}
                    loading={loading}
                    style={styles.authButton}
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

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {isSignUp ? 'Already have Account? ' : 'Don’t have an account? '}
                    </Text>
                    <TouchableOpacity onPress={toggleMode}>
                        <Text style={styles.footerLink}>
                            {isSignUp ? 'Login' : 'Register'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    backButton: {
        padding: SPACING.sm,
    },
    backButtonText: {
        fontSize: 24,
        color: COLORS.light.text,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.light.text,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
        paddingTop: SPACING.sm,
        justifyContent: 'space-between',
    },
    bottomSection: {
        marginTop: SPACING.xl,
    },
    title: {
        fontSize: 26,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.light.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.light.textSecondary,
        marginBottom: SPACING.lg,
        lineHeight: 24,
    },
    form: {
        marginTop: SPACING.md,
    },
    authButton: {
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.light.primary,
        borderRadius: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.light.textSecondary,
    },
    footerLink: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.light.primary,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: COLORS.light.primary,
        borderRadius: 4,
        marginRight: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.light.primary,
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    termsText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.light.textSecondary,
    },
    termsHighlight: {
        color: COLORS.light.primary,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
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
        marginBottom: SPACING.lg,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: SPACING.sm,
    },
});

export default Login;
