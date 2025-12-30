import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon,
}) => {
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.buttonSecondary;
            case 'outline':
                return styles.buttonOutline;
            default:
                return styles.buttonPrimary;
        }
    };

    const getTextStyle = () => {
        if (variant === 'outline') {
            return styles.buttonTextOutline;
        }
        return styles.buttonText;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                disabled && styles.buttonDisabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}>
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? COLORS.light.primary : COLORS.light.background}
                />
            ) : (
                <View style={styles.contentContainer}>
                    {icon}
                    <Text style={[getTextStyle(), textStyle]}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPrimary: {
        backgroundColor: COLORS.light.primary,
    },
    buttonSecondary: {
        backgroundColor: COLORS.light.secondary,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.light.primary,
    },
    buttonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.light.background,
    },
    buttonTextOutline: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.light.primary,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default Button;
