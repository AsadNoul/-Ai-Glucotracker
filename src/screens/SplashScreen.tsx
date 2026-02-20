import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar, ImageBackground } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/Theme';
import { authService } from '../services/supabase';
import { useAuthStore } from '../store';
import { AppLogo, BrandName } from '../components/BrandComponents';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { setUser, setLoading } = useAuthStore();
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    useEffect(() => {
        // Logo sequence
        scale.value = withSequence(
            withSpring(1.05, { damping: 10 }),
            withSpring(1, { damping: 12 })
        );
        opacity.value = withTiming(1, { duration: 800 });

        // Text sequence
        textOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
        translateY.value = withDelay(500, withSpring(0));

        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const { isAuthenticated, user } = useAuthStore.getState();

            if (isAuthenticated && user) {
                setTimeout(() => {
                    navigation.replace('MainTabs');
                    setLoading(false);
                }, 2200); // Slightly longer for "premium" feel
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
            }, 2200);
        } catch (error) {
            navigation.replace('Onboarding');
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#05060B', '#0F111A', '#05060B']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.centerContent}>
                <Animated.View style={[styles.logoWrapper, logoStyle]}>
                    <AppLogo size={160} />
                </Animated.View>

                <Animated.View style={[styles.textWrapper, contentStyle]}>
                    <BrandName fontSize={48} />
                    <View style={styles.taglineRow}>
                        <View style={styles.line} />
                        <Text style={styles.tagline}>INTELLIGENT HEALTH</Text>
                        <View style={styles.line} />
                    </View>
                </Animated.View>
            </View>

            <View style={styles.footer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.versionText}>POWERED BY NAULX AI</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05060B',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoWrapper: {
        marginBottom: Spacing.xxl,
        ...Shadow.blue,
    },
    textWrapper: {
        alignItems: 'center',
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        gap: 12,
    },
    line: {
        width: 20,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    tagline: {
        fontSize: 10,
        color: Colors.text.onDark.tertiary,
        fontWeight: '800',
        letterSpacing: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    versionText: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.2)',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

