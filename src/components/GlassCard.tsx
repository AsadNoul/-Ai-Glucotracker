import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, BorderRadius, Spacing, Shadow } from '../constants/Theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    blurIntensity?: number;
    glowColor?: string;
    noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    blurIntensity = 25,
    glowColor,
    noPadding = false,
}) => {
    return (
        <View style={[styles.container, style]}>
            {/* Glow effect */}
            {glowColor && (
                <View style={[styles.glow, { backgroundColor: glowColor, shadowColor: glowColor }]} />
            )}

            {/* Glass background with blur */}
            <BlurView intensity={blurIntensity} tint="dark" style={styles.blur}>
                <LinearGradient
                    colors={[
                        'rgba(255, 255, 255, 0.08)',
                        'rgba(255, 255, 255, 0.02)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={[styles.content, noPadding && styles.noPadding]}>
                        {children}
                    </View>
                </LinearGradient>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: Colors.glass.border,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        ...Shadow.medium,
    },
    glow: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        opacity: 0.1,
        borderRadius: BorderRadius.xxl,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 5,
    },
    blur: {
        borderRadius: BorderRadius.xxl,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
    },
    noPadding: {
        padding: 0,
    }
});
