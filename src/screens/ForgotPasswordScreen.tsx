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
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/Theme';
import { authService } from '../services/supabase';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword(email);
            setSent(true);
            Alert.alert('Email Sent', 'If an account exists with this email, you will receive a password reset link.');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.logoBadge}>
                            <MaterialCommunityIcons name="lock-reset" size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            {sent
                                ? "Check your inbox for instructions on how to reset your password."
                                : "Enter the email associated with your account and we'll send an OTP to reset your password."}
                        </Text>
                    </View>

                    {!sent && (
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

                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.disabledButton]}
                                onPress={handleReset}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Send Reset Link</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {sent && (
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.loginButtonText}>Back to Sign In</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        marginBottom: Spacing.xl,
    },
    logoBadge: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(10, 133, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: Typography.weights.bold,
        color: '#FFF',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.sizes.sm,
        color: Colors.text.onDark.secondary,
        paddingRight: 60,
        lineHeight: 20,
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
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.darkCard,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        height: 52,
        borderWidth: 1,
        borderColor: Colors.glass.border,
        gap: Spacing.md,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: Typography.sizes.md,
    },
    loginButton: {
        backgroundColor: Colors.primary,
        height: 52,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.sm,
        ...Shadow.blue,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.bold,
    },
    disabledButton: {
        opacity: 0.7,
    },
});
