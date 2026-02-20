import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/Theme';
import { authService, userService } from '../services/supabase';
import { useAuthStore } from '../store';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { setUser } = useAuthStore();

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { user } = await authService.signUp(email, password);
            if (user) {
                const profile = await userService.getProfile(user.id);
                setUser(profile);
                Alert.alert(
                    'Success!',
                    'Your account has been created. Welcome to CarbTrack!',
                    [{ text: 'Continue', onPress: () => navigation.replace('MainTabs') }]
                );
            }
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'Could not create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[Colors.background.dark, '#1A1C2E', '#0A0B0F']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <View style={styles.logoBadge}>
                                <MaterialCommunityIcons name="account-plus" size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.title}>Create account</Text>
                            <Text style={styles.subtitle}>Join thousands of users managing their health with AI.</Text>
                        </View>

                        <View style={styles.authCard}>
                            <View style={styles.form}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>EMAIL ADDRESS</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="mail-outline" size={20} color={Colors.text.onDark.tertiary} />
                                        <TextInput
                                            style={styles.input}
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="Enter your email"
                                            placeholderTextColor={Colors.text.onDark.tertiary}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>PASSWORD</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={20} color={Colors.text.onDark.tertiary} />
                                        <TextInput
                                            style={styles.input}
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="Create a secure password"
                                            placeholderTextColor={Colors.text.onDark.tertiary}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color={Colors.text.onDark.tertiary}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>CONFIRM PASSWORD</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="shield-checkmark-outline" size={20} color={Colors.text.onDark.tertiary} />
                                        <TextInput
                                            style={styles.input}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder="Re-enter your password"
                                            placeholderTextColor={Colors.text.onDark.tertiary}
                                            secureTextEntry={!showPassword}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.registerButton, loading && styles.disabledButton]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>Create Account</Text>}
                                </TouchableOpacity>

                                <View style={styles.dividerRow}>
                                    <View style={styles.divider} />
                                    <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                                    <View style={styles.divider} />
                                </View>

                                <View style={styles.socialRow}>
                                    <TouchableOpacity
                                        style={styles.socialButton}
                                        onPress={() => Alert.alert('Google Sign-In', 'Official Google login will be available in the native build.')}
                                    >
                                        <Ionicons name="logo-google" size={20} color="#FFF" />
                                        <Text style={styles.socialBtnText}>Google</Text>
                                    </TouchableOpacity>

                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity style={styles.socialButton}>
                                            <Ionicons name="logo-apple" size={20} color="#FFF" />
                                            <Text style={styles.socialBtnText}>Apple</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={styles.termsText}>
                                    By creating an account, you agree to our{' '}
                                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                    <Text style={styles.termsLink}>Privacy Policy</Text>.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.dark,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    header: {
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl * 1.5,
        alignItems: 'center',
    },
    logoBadge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(123, 97, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(123, 97, 255, 0.2)',
    },
    title: {
        fontSize: 32,
        fontWeight: Typography.weights.bold,
        color: '#FFF',
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.sizes.sm,
        color: Colors.text.onDark.secondary,
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
    authCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        ...Shadow.dark,
    },
    form: {
        gap: Spacing.lg,
    },
    inputContainer: {
        gap: Spacing.sm,
    },
    label: {
        fontSize: 10,
        fontWeight: Typography.weights.bold,
        color: Colors.text.onDark.tertiary,
        letterSpacing: 1,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        height: 54,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: Spacing.md,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: Typography.sizes.md,
    },
    registerButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.md,
        ...Shadow.blue,
    },
    registerButtonText: {
        color: '#FFF',
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.bold,
    },
    disabledButton: {
        opacity: 0.7,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginVertical: Spacing.md,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    dividerText: {
        fontSize: 9,
        fontWeight: Typography.weights.bold,
        color: Colors.text.onDark.tertiary,
    },
    socialRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        height: 54,
        borderRadius: BorderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    socialBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: Typography.weights.semibold,
    },
    termsText: {
        fontSize: 11,
        color: Colors.text.onDark.tertiary,
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: Spacing.sm,
        marginTop: Spacing.sm,
    },
    termsLink: {
        color: Colors.text.onDark.secondary,
        fontWeight: Typography.weights.bold,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        paddingVertical: Spacing.lg,
    },
    footerText: {
        color: Colors.text.onDark.secondary,
        fontSize: Typography.sizes.md,
    },
    loginLink: {
        color: Colors.primary,
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.bold,
    },
});
