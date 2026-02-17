import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadow } from '../constants/Theme';

interface AppLogoProps {
    size?: number;
    style?: ViewStyle;
    iconSize?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({
    size = 120,
    style,
    iconSize
}) => {
    const borderRadius = size * 0.25; // Proportional border radius (e.g., 30 for 120)

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius }, style, Shadow.dark]}>
            <LinearGradient
                colors={['#1E202F', '#0F1019']}
                style={[styles.background, { borderRadius }]}
            >
                <LinearGradient
                    colors={[Colors.primary, '#00C2FF']}
                    style={[styles.iconBox, { width: size * 0.65, height: size * 0.65, borderRadius: borderRadius * 0.8 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <MaterialCommunityIcons
                        name="water"
                        size={iconSize || size * 0.35}
                        color="#FFF"
                    />
                </LinearGradient>
            </LinearGradient>
            {/* Gloss Highlight */}
            <View style={[styles.highlight, { borderRadius }]} />
        </View>
    );
};

interface BrandNameProps {
    style?: TextStyle;
    color?: string;
    fontSize?: number;
}

export const BrandName: React.FC<BrandNameProps> = ({ style, color = '#FFF', fontSize = 32 }) => {
    return (
        <View style={styles.brandRow}>
            <Text style={[styles.brandText, { color, fontSize }, style]}>
                Carb<Text style={{ color: Colors.primary }}>Track</Text>
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.background.darkCard,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    background: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBox: {
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.blue,
    },
    highlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandText: {
        fontWeight: '900',
        letterSpacing: -1,
    },
});
