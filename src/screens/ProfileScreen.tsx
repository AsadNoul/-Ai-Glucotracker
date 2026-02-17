import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    StatusBar,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useAuthStore, useSettingsStore } from '../store';
import { authService } from '../services/supabase';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, isGuest, logout } = useAuthStore();
    const {
        notificationsEnabled,
        setNotifications,
        theme,
        setTheme,
        glucoseUnit,
        setGlucoseUnit,
    } = useSettingsStore();

    const t = getThemeColors(theme);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState(false);
    const [modalContent, setModalContent] = useState('');

    const handleLogout = () => {
        Alert.alert(
            isGuest ? 'Reset App Data' : 'Logout',
            isGuest
                ? 'This will clear all your local logs and settings. Are you sure?'
                : 'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isGuest ? 'Reset' : 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        if (!isGuest) await authService.signOut();
                        logout();
                        navigation.replace('Onboarding');
                    }
                }
            ]
        );
    };

    const showModal = (title: any, content: string) => {
        setModalTitle(title);
        setModalContent(content);
        setModalVisible(true);
    };

    const handleSync = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', 'Health data and settings synced with secure cloud.');
        }, 1500);
    };

    const SettingRow = ({ icon, label, value, onPress, isLast, children, color }: any) => (
        <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: t.border }, isLast && { borderBottomWidth: 0 }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: color ? `${color}15` : t.glass }]}>
                    <Ionicons name={icon} size={18} color={color || t.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: t.text }]}>{label}</Text>
            </View>
            <View style={styles.settingRight}>
                {value && <Text style={[styles.settingValue, { color: t.textSecondary }]}>{value}</Text>}
                {children}
                {!children && onPress && <Ionicons name="chevron-forward" size={16} color={t.textTertiary} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: t.glass }]}>
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Settings</Text>
                <TouchableOpacity onPress={handleSync} style={[styles.syncButton, { backgroundColor: t.glass }]}>
                    {loading ? <ActivityIndicator size="small" color={t.primary} /> : <Ionicons name="cloud-upload-outline" size={20} color={t.primary} />}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: t.card, borderColor: t.border }, Shadow.light]}>
                    <View style={styles.avatarLarge}>
                        <View style={styles.avatarInner}>
                            <Text style={styles.avatarEmoji}>🧔🏻‍♂️</Text>
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: t.text }]}>{user?.email?.split('@')[0] || 'User'}</Text>
                        <Text style={[styles.profileEmail, { color: t.textSecondary }]}>{user?.email || 'Guest User'}</Text>
                    </View>
                    {isGuest && (
                        <TouchableOpacity
                            style={styles.signInBadge}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.signInBadgeText}>Join Now</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Account Section */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>EXPERIENCE</Text>
                <View style={[styles.settingsGroup, { backgroundColor: t.card, borderColor: t.border }, Shadow.light]}>
                    <SettingRow icon="moon" label="Dark Mode" color="#7B61FF">
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                            trackColor={{ false: '#767577', true: t.primary }}
                            thumbColor="#f4f3f4"
                        />
                    </SettingRow>
                    <SettingRow icon="notifications" label="Push Notifications" color="#0A85FF" isLast>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotifications}
                            trackColor={{ false: '#767577', true: t.primary }}
                            thumbColor="#f4f3f4"
                        />
                    </SettingRow>
                </View>

                {/* Subscription Section */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>MEMBERSHIP</Text>
                <View style={[styles.settingsGroup, { backgroundColor: t.card, borderColor: t.border }, Shadow.light]}>
                    <SettingRow
                        icon="star"
                        label="Manage Subscription"
                        value="Pro Plan"
                        color="#FFD700"
                        onPress={() => navigation.navigate('CreditsStore')}
                    />
                    <SettingRow
                        icon="refresh-circle"
                        label="Restore Purchases"
                        color="#4CAF50"
                        onPress={() => Alert.alert('Restore', 'Purchases have been successfully restored.')}
                        isLast
                    />
                </View>

                {/* Preferences Section */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>HEALTH PREFERENCES</Text>
                <View style={[styles.settingsGroup, { backgroundColor: t.card, borderColor: t.border }, Shadow.light]}>
                    <SettingRow
                        icon="flask"
                        label="Glucose Unit"
                        value={glucoseUnit}
                        color="#4CAF50"
                        onPress={() => {
                            Alert.alert(
                                'Select Glucose Unit',
                                'Choose your preferred measurement unit:',
                                [
                                    { text: 'mg/dL', onPress: () => setGlucoseUnit('mg/dL') },
                                    { text: 'mmol/L', onPress: () => setGlucoseUnit('mmol/L') },
                                    { text: 'Cancel', style: 'cancel' }
                                ]
                            );
                        }}
                    />
                    <SettingRow
                        icon="analytics"
                        label="Target Range"
                        value="70-180 mg/dL"
                        color="#FF9800"
                        onPress={() => showModal('Target Range', 'Your target glucose range is currently set to 70-180 mg/dL. This is the standard recommended range for most adults. Staying within this range helps reduce the risk of long-term complications.')}
                        isLast
                    />
                </View>

                {/* Support Section */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>RESOURCES</Text>
                <View style={[styles.settingsGroup, { backgroundColor: t.card, borderColor: t.border }, Shadow.light]}>
                    <SettingRow
                        icon="help-circle"
                        label="Help Center"
                        color={t.primary}
                        onPress={() => showModal('Help Center', 'Need assistance? Reach out to us at support@glucotrack.ai or visit our website for comprehensive guides and FAQs about managing your glucose levels with AI.')}
                    />
                    <SettingRow
                        icon="shield-checkmark"
                        label="Privacy Policy"
                        color="#607D8B"
                        onPress={() => showModal('Privacy Policy', 'At GlucoTrack AI, your health data is private and encrypted. We do not sell your personal information. Your data is used exclusively to provide you with insights and logs. We use industry-standard security measures to protect your information.')}
                    />
                    <SettingRow
                        icon="document-text"
                        label="Terms of & Conditions"
                        color="#607D8B"
                        onPress={() => showModal('Terms of Service', 'By using GlucoTrack AI, you agree to our terms. This app is for informational purposes and is not a replacement for professional medical advice. Please consult your healthcare provider before making medical decisions.')}
                        isLast
                    />
                </View>

                {/* Actions */}
                <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: t.error + '10' }]} onPress={handleLogout}>
                    <Ionicons name={isGuest ? "refresh" : "log-out"} size={20} color={t.error} />
                    <Text style={[styles.logoutText, { color: t.error }]}>{isGuest ? 'Reset Local Data' : 'Sign Out'}</Text>
                </TouchableOpacity>

                <View style={styles.legalInfo}>
                    <Text style={[styles.medicalDisclaimer, { color: t.textTertiary }]}>
                        Disclaimer: Not medical advice. Always consult a physician.
                    </Text>
                    <Text style={[styles.versionText, { color: t.textTertiary }]}>Version 1.0.5 • Build 248</Text>
                </View>
            </ScrollView>

            {/* Content Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>{modalTitle}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.modalBodyText, { color: t.textSecondary }]}>{modalContent}</Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.modalCloseBtn, { backgroundColor: t.primary }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalCloseBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: BorderRadius.round,
        justifyContent: 'center',
        alignItems: 'center',
    },
    syncButton: {
        width: 42,
        height: 42,
        borderRadius: BorderRadius.round,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxxl,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.xl,
    },
    avatarLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFE0B2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.lg,
    },
    avatarInner: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarEmoji: {
        fontSize: 26,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
    },
    profileEmail: {
        fontSize: Typography.sizes.sm,
    },
    signInBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.lg,
    },
    signInBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: Typography.weights.bold,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: Typography.weights.bold,
        letterSpacing: 1.2,
        marginBottom: Spacing.sm,
        marginLeft: 4,
    },
    settingsGroup: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.medium,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    settingValue: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.semibold,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        marginTop: Spacing.sm,
    },
    logoutText: {
        fontWeight: Typography.weights.bold,
        fontSize: Typography.sizes.md,
    },
    legalInfo: {
        marginTop: Spacing.xl,
        alignItems: 'center',
        gap: 6,
    },
    medicalDisclaimer: {
        fontSize: 9,
        textAlign: 'center',
        lineHeight: 14,
        paddingHorizontal: Spacing.xl,
    },
    versionText: {
        fontSize: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        width: '100%',
        maxHeight: '70%',
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        borderWidth: 1,
        ...Shadow.large,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
    },
    modalBody: {
        marginBottom: Spacing.xl,
    },
    modalBodyText: {
        fontSize: Typography.sizes.md,
        lineHeight: 22,
    },
    modalCloseBtn: {
        height: 50,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: Typography.sizes.md,
    }
});
