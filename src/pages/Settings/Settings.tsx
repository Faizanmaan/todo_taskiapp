import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { firebaseAuth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { clearUser } from '../../store/authSlice';
import { COLORS, SPACING } from '../../constants/theme';
import { globalStyles } from '../../styles/globalStyles';
import type { RootState } from '../../store';

const Settings: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = async () => {
        try {
            console.log('Logging out...');
            dispatch(clearUser());
            await signOut(firebaseAuth());
        } catch (error: unknown) {
            console.error('Logout error:', error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            Alert.alert('Error', message);
        }
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };

    const isGoogleUser = user?.providerData.some(provider => provider.providerId === 'google.com');

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#B7B7B7" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileContainer}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user?.photoURL || 'https://i.pravatar.cc/150?img=12' }}
                            style={styles.avatar}
                        />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.displayName || 'Zak Brawn'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'zakbrawn10@email.com'}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Feather name="edit" size={20} color="#B7B7B7" />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>About</Text>
                </View>
                <View style={styles.menuContainer}>
                    {!isGoogleUser && (
                        <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
                            <Text style={styles.menuItemText}>Change Password</Text>
                            <Ionicons name="chevron-forward" size={20} color="#B7B7B7" />
                        </TouchableOpacity>
                    )}

                    {!isGoogleUser && <View style={styles.divider} />}

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Todo App</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.light.text,
    },
    content: {
        padding: SPACING.md,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        marginRight: SPACING.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.light.surface,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.light.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.light.textSecondary,
    },
    editButton: {
        padding: 8,
    },
    sectionHeader: {
        backgroundColor: '#F5F5F5',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        marginHorizontal: -SPACING.lg,
        marginBottom: SPACING.md,
        alignItems: 'center',
    },
    sectionHeaderText: {
        fontSize: 14,
        color: COLORS.light.textSecondary,
        textAlign: 'center',
    },
    menuContainer: {
        marginBottom: SPACING.xl,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    menuItemText: {
        fontSize: 16,
        color: COLORS.light.textSecondary,
    },
    signOutText: {
        color: '#BA1735',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.light.border,
        marginVertical: 4,
    },
    footer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.lg,
    },
    footerText: {
        fontSize: 14,
        color: '#afafb5ff',
    },
});

export default Settings;
