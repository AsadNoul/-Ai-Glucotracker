import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/Theme';
import { AppLogo, BrandName } from '../components/BrandComponents';

import { useAuthStore } from '../store';

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { setGuest } = useAuthStore();

    const handleGuestMode = () => {
        setGuest(true);
        navigation.replace('MainTabs');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <TouchableOpacity style={styles.skipButton} onPress={handleGuestMode}>
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <View style={styles.content}>
                <AppLogo size={140} style={{ marginBottom: Spacing.xl }} />

                <View style={styles.textContainer}>
                    <Text style={styles.welcomeText}>Welcome to</Text>
                    <BrandName fontSize={42} />

                    <Text style={styles.description}>
                        Accurate carb & glucose insights for your local food choices.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.getStartedButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.getStartedText}>Get started  →</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.guestButton}
                        onPress={handleGuestMode}
                    >
                        <Text style={styles.guestButtonText}>Continue as Guest</Text>
                    </TouchableOpacity>

                    <View style={styles.signInContainer}>
                        <Text style={styles.alreadyText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.signInText}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.dark,
    },
    skipButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        padding: Spacing.md,
    },
    skipText: {
        color: Colors.text.onDark.tertiary,
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.semibold,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: 40,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    welcomeText: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.semibold,
        color: Colors.text.onDark.primary,
        marginBottom: Spacing.xs,
    },
    description: {
        fontSize: Typography.sizes.md,
        color: Colors.text.onDark.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.md,
    },
    footer: {
        width: '100%',
        marginTop: Spacing.xl,
        gap: Spacing.md,
    },
    getStartedButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md + 4,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        ...Shadow.blue,
    },
    getStartedText: {
        color: '#FFF',
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
    },
    guestButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: Spacing.md + 4,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.glass.border,
    },
    guestButtonText: {
        color: Colors.text.onDark.secondary,
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.semibold,
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.md,
    },
    alreadyText: {
        color: Colors.text.onDark.secondary,
        fontSize: Typography.sizes.sm,
    },
    signInText: {
        color: Colors.text.onDark.primary,
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.bold,
    },
});

