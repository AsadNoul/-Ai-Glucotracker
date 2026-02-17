import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/Theme';
import { authService } from '../services/supabase';
import { useAuthStore } from '../store';
import { AppLogo, BrandName } from '../components/BrandComponents';
import { SafeAreaView } from 'react-native-safe-area-context';

export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { setUser, setLoading } = useAuthStore();
    const scale = useSharedValue(0.3);
    const opacity = useSharedValue(0);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12 });
        opacity.value = withDelay(200, withSpring(1));
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            // First check if store already has a state (persisted)
            const { isAuthenticated, user } = useAuthStore.getState();

            if (isAuthenticated && user) {
                setTimeout(() => {
                    navigation.replace('MainTabs');
                    setLoading(false);
                }, 1500);
                return;
            }

            const session = await authService.getSession();
            setTimeout(async () => {
                if (session) {
                    const profile = await authService.getCurrentUser();
                    if (profile) {
                        setUser(profile as any);
                        navigation.replace('MainTabs');
                    } else {
                        navigation.replace('Onboarding');
                    }
                } else {
                    navigation.replace('Onboarding');
                }
                setLoading(false);
            }, 1500);
        } catch (error) {
            navigation.replace('Onboarding');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <AppLogo size={140} style={{ marginBottom: Spacing.xl }} />
                <BrandName fontSize={42} />
                <Text style={styles.tagline}>Intelligent Nutrition Insights</Text>
            </Animated.View>

            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.dark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    iconCard: {
        width: 120,
        height: 120,
        borderRadius: BorderRadius.xxl,
        backgroundColor: Colors.background.darkCard,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.glass.border,
        ...Shadow.dark,
    },
    blueBox: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.blue,
    },
    dropIcon: {
        fontSize: 36,
        color: '#FFF',
    },
    appName: {
        fontSize: Typography.sizes.xxxl,
        fontWeight: Typography.weights.bold,
        color: Colors.text.onDark.primary,
        marginBottom: Spacing.sm,
    },
    tagline: {
        fontSize: Typography.sizes.md,
        color: Colors.text.onDark.secondary,
        fontWeight: Typography.weights.medium,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 80,
    },
});

