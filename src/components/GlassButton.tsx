import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Typography, Spacing, Shadow } from '../constants/Theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface GlassButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'glass';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    icon,
    style,
    textStyle,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { height: 40, paddingHorizontal: Spacing.lg };
            case 'large':
                return { height: 64, paddingHorizontal: Spacing.xxl };
            default:
                return { height: 56, paddingHorizontal: Spacing.xl };
        }
    };

    const renderContent = () => {
        if (loading) return <ActivityIndicator color="#FFF" />;
        return (
            <>
                {icon}
                <Text style={[
                    styles.text,
                    variant === 'outline' ? styles.outlineText : null,
                    variant === 'glass' ? styles.glassText : null,
                    textStyle,
                    icon ? styles.textWithIcon : null
                ]}>
                    {title}
                </Text>
            </>
        );
    };

    if (variant === 'primary') {
        return (
            <AnimatedTouchable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[animatedStyle, style]}
                activeOpacity={1}
            >
                <LinearGradient
                    colors={disabled ? ['#333', '#222'] : [Colors.primary, '#00C2FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, getSizeStyles(), Shadow.blue]}
                >
                    {renderContent()}
                </LinearGradient>
            </AnimatedTouchable>
        );
    }

    const buttonStyles = [
        styles.button,
        getSizeStyles(),
        variant === 'outline' && styles.outlineButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'glass' && styles.glassButton,
        disabled && styles.disabledButton,
        style
    ];

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[animatedStyle, buttonStyles]}
            activeOpacity={0.8}
        >
            {renderContent()}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    secondaryButton: {
        backgroundColor: Colors.secondary,
        ...Shadow.medium,
    },
    outlineButton: {
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: 'transparent',
    },
    glassButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
    },
    text: {
        color: '#FFF',
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.bold,
        letterSpacing: 0.2,
    },
    outlineText: {
        color: Colors.primary,
    },
    glassText: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    textWithIcon: {
        marginLeft: Spacing.sm,
    },
    disabledButton: {
        opacity: 0.5,
    }
});
