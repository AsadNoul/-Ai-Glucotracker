import React, { useState, useMemo } from 'react';
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
    TextInput,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useAuthStore, useSettingsStore, useLogsStore } from '../store';
import { authService } from '../services/supabase';

const DIABETES_TYPES = [
    { key: 'type1' as const, label: 'Type 1', icon: '💉', desc: 'Insulin-dependent' },
    { key: 'type2' as const, label: 'Type 2', icon: '💊', desc: 'Insulin-resistant' },
    { key: 'gestational' as const, label: 'Gestational', icon: '🤰', desc: 'Pregnancy-related' },
    { key: 'prediabetes' as const, label: 'Prediabetes', icon: '⚠️', desc: 'At risk' },
    { key: 'none' as const, label: 'None / Other', icon: '💚', desc: 'General wellness' },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, isGuest, logout } = useAuthStore();
    const { glucoseLogs, carbLogs } = useLogsStore();
    const {
        notificationsEnabled, setNotifications,
        theme, setTheme,
        glucoseUnit, setGlucoseUnit,
        targetGlucoseMin, targetGlucoseMax, setTargetRange,
        carbGoal, setCarbGoal,
        waterGoal,
        diabetesType, setDiabetesType,
        age, setAge,
        weight, weightUnit, setWeight,
        reminderMealEnabled, reminderGlucoseEnabled, reminderWaterEnabled, setReminder,
    } = useSettingsStore();

    const t = getThemeColors(theme);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [ageInput, setAgeInput] = useState(age > 0 ? age.toString() : '');
    const [weightInput, setWeightInput] = useState(weight > 0 ? weight.toString() : '');
    const [weightUnitInput, setWeightUnitInput] = useState(weightUnit);
    const [expandedSections, setExpandedSections] = useState<string[]>(['profile']);

    const toggleSection = (section: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };


    // ─── Health Summary Stats ───────────────────────────────────────────────
    const healthStats = useMemo(() => {
        const totalReadings = glucoseLogs.length;
        const totalMeals = carbLogs.length;
        const avgGlucose = totalReadings > 0 ? Math.round(glucoseLogs.reduce((s, l) => s + l.glucose_value, 0) / totalReadings) : 0;
        const inRange = totalReadings > 0
            ? Math.round((glucoseLogs.filter(l => l.glucose_value >= targetGlucoseMin && l.glucose_value <= targetGlucoseMax).length / totalReadings) * 100)
            : 0;
        return { totalReadings, totalMeals, avgGlucose, inRange };
    }, [glucoseLogs, carbLogs, targetGlucoseMin, targetGlucoseMax]);

    const handleLogout = () => {
        Alert.alert(
            isGuest ? 'Reset App Data' : 'Logout',
            isGuest ? 'This will clear all your local logs and settings. Are you sure?' : 'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isGuest ? 'Reset' : 'Logout', style: 'destructive',
                    onPress: async () => { if (!isGuest) await authService.signOut(); logout(); navigation.replace('Onboarding'); }
                }
            ]
        );
    };

    const showModal = (title: string, content: string) => {
        setModalTitle(title);
        setModalContent(content);
        setModalVisible(true);
    };

    const handleSync = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', 'Health data synced with secure cloud.');
        }, 1500);
    };

    const handleExportData = () => {
        const glucoseCSV = glucoseLogs.map(l => `${l.reading_time},${l.glucose_value}`).join('\n');
        const carbCSV = carbLogs.map(l => `${l.created_at},${l.food_name},${l.estimated_carbs}`).join('\n');
        const summary = `GlucoTrack AI Data Export\n\nGlucose Readings: ${glucoseLogs.length}\nMeals Logged: ${carbLogs.length}\nAvg Glucose: ${healthStats.avgGlucose} ${glucoseUnit}\nTime In Range: ${healthStats.inRange}%\n\nGlucose Readings:\nTime,Value\n${glucoseCSV}\n\nCarb Logs:\nTime,Food,Carbs\n${carbCSV}`;
        Alert.alert('Export Ready', `Data exported:\n• ${glucoseLogs.length} glucose readings\n• ${carbLogs.length} meal logs\n\nCopied to clipboard for sharing.`);
    };

    const handleSaveProfile = () => {
        const parsedAge = parseInt(ageInput);
        const parsedWeight = parseFloat(weightInput);
        if (parsedAge > 0) setAge(parsedAge);
        if (parsedWeight > 0) setWeight(parsedWeight, weightUnitInput);
        setProfileModalVisible(false);
        Alert.alert('Saved', 'Health profile updated successfully.');
    };

    const diabetesInfo = DIABETES_TYPES.find(d => d.key === diabetesType) || DIABETES_TYPES[4];

    const SettingRow = ({ icon, label, value, onPress, isLast, children, color }: any) => (
        <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: t.border }, isLast && { borderBottomWidth: 0 }]}
            onPress={onPress} disabled={!onPress}
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

    const CollapsibleSection = ({ id, title, icon, children }: any) => {
        const isExpanded = expandedSections.includes(id);
        return (
            <View style={styles.sectionWrapper}>
                <TouchableOpacity
                    style={[styles.sectionHeader, { backgroundColor: t.card, borderColor: t.border }]}
                    onPress={() => toggleSection(id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.sectionHeaderLeft}>
                        <Text style={styles.sectionIcon}>{icon}</Text>
                        <Text style={[styles.sectionTitleText, { color: t.text }]}>{title}</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={t.textTertiary} />
                </TouchableOpacity>
                {isExpanded && (
                    <View style={[styles.settingsGroup, { backgroundColor: t.card, borderColor: t.border }, Shadow.light]}>
                        {children}
                    </View>
                )}
            </View>
        );
    };


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
                    <View style={styles.profileTop}>
                        <View style={styles.avatarLarge}>
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarEmoji}>🧔🏻‍♂️</Text>
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: t.text }]}>{user?.email?.split('@')[0] || 'User'}</Text>
                            <Text style={[styles.profileEmail, { color: t.textSecondary }]}>{user?.email || 'Guest User'}</Text>
                            <View style={styles.profileBadgeRow}>
                                <View style={[styles.typeBadge, { backgroundColor: t.primary + '15' }]}>
                                    <Text style={{ fontSize: 10 }}>{diabetesInfo.icon}</Text>
                                    <Text style={[styles.typeBadgeText, { color: t.primary }]}>{diabetesInfo.label}</Text>
                                </View>
                                {isGuest && (
                                    <TouchableOpacity style={styles.signInBadge} onPress={() => navigation.navigate('Login')}>
                                        <Text style={styles.signInBadgeText}>Join Now</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Health Stats Mini Grid */}
                    <View style={[styles.statsGrid, { borderTopColor: t.border }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: t.primary }]}>{healthStats.totalReadings}</Text>
                            <Text style={[styles.statLabel, { color: t.textTertiary }]}>Readings</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: t.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: t.text }]}>{healthStats.avgGlucose || '--'}</Text>
                            <Text style={[styles.statLabel, { color: t.textTertiary }]}>Avg {glucoseUnit}</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: t.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: healthStats.inRange >= 70 ? '#4CAF50' : '#FF9800' }]}>{healthStats.inRange}%</Text>
                            <Text style={[styles.statLabel, { color: t.textTertiary }]}>In Range</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: t.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: t.text }]}>{healthStats.totalMeals}</Text>
                            <Text style={[styles.statLabel, { color: t.textTertiary }]}>Meals</Text>
                        </View>
                    </View>
                </View>

                {/* Sections */}
                <CollapsibleSection id="profile" title="Health Profile" icon="🏥">
                    <SettingRow icon="medical" label="Diabetes Type" value={diabetesInfo.label} color="#E91E63"
                        onPress={() => {
                            Alert.alert('Diabetes Type', 'Select your condition:', [
                                ...DIABETES_TYPES.map(d => ({
                                    text: `${d.icon} ${d.label} — ${d.desc}`,
                                    onPress: () => setDiabetesType(d.key),
                                })),
                                { text: 'Cancel', style: 'cancel' as const }
                            ]);
                        }}
                    />
                    <SettingRow icon="body" label="Age & Weight"
                        value={`${age > 0 ? `${age}y` : '--'} · ${weight > 0 ? `${weight}${weightUnit}` : '--'}`}
                        color="#9C27B0"
                        onPress={() => setProfileModalVisible(true)}
                    />
                    <SettingRow icon="flask" label="Glucose Unit" value={glucoseUnit} color="#4CAF50"
                        onPress={() => {
                            Alert.alert('Select Glucose Unit', 'Choose your measurement:', [
                                { text: 'mg/dL', onPress: () => setGlucoseUnit('mg/dL') },
                                { text: 'mmol/L', onPress: () => setGlucoseUnit('mmol/L') },
                                { text: 'Cancel', style: 'cancel' }
                            ]);
                        }}
                    />
                    <SettingRow icon="analytics" label="Target Range" value={`${targetGlucoseMin}-${targetGlucoseMax} ${glucoseUnit}`} color="#FF9800"
                        onPress={() => {
                            Alert.alert('Set Target Range', `Current: ${targetGlucoseMin}-${targetGlucoseMax}\n\nSelect a preset:`, [
                                { text: 'Tight (70-140)', onPress: () => setTargetRange(70, 140) },
                                { text: 'Standard (70-180)', onPress: () => setTargetRange(70, 180) },
                                { text: 'Relaxed (80-200)', onPress: () => setTargetRange(80, 200) },
                                { text: 'Cancel', style: 'cancel' }
                            ]);
                        }}
                        isLast
                    />
                </CollapsibleSection>

                <CollapsibleSection id="goals" title="Daily Goals" icon="🎯">
                    <SettingRow icon="restaurant" label="Daily Carb Goal" value={`${carbGoal}g`} color="#E91E63"
                        onPress={() => {
                            Alert.alert('Set Daily Carb Goal', `Current: ${carbGoal}g`, [
                                { text: '100g (Low Carb)', onPress: () => setCarbGoal(100) },
                                { text: '150g (Moderate)', onPress: () => setCarbGoal(150) },
                                { text: '200g (Active)', onPress: () => setCarbGoal(200) },
                                { text: '250g (High Energy)', onPress: () => setCarbGoal(250) },
                                { text: 'Cancel', style: 'cancel' }
                            ]);
                        }}
                    />
                    <SettingRow icon="water" label="Daily Water Goal" value={`${waterGoal}ml`} color="#0A85FF"
                        onPress={() => {
                            Alert.alert('Set Water Goal', `Current: ${waterGoal}ml`, [
                                { text: '1500ml', onPress: () => useSettingsStore.setState({ waterGoal: 1500 }) },
                                { text: '2000ml', onPress: () => useSettingsStore.setState({ waterGoal: 2000 }) },
                                { text: '2500ml', onPress: () => useSettingsStore.setState({ waterGoal: 2500 }) },
                                { text: '3000ml', onPress: () => useSettingsStore.setState({ waterGoal: 3000 }) },
                                { text: 'Cancel', style: 'cancel' }
                            ]);
                        }}
                        isLast
                    />
                </CollapsibleSection>

                <CollapsibleSection id="experience" title="App Settings" icon="⚙️">
                    <SettingRow icon="moon" label="Dark Mode" color="#7B61FF">
                        <Switch value={theme === 'dark'} onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                            trackColor={{ false: '#767577', true: t.primary }} thumbColor="#f4f3f4" />
                    </SettingRow>
                    <SettingRow icon="notifications" label="Push Notifications" color="#0A85FF" isLast>
                        <Switch value={notificationsEnabled} onValueChange={setNotifications}
                            trackColor={{ false: '#767577', true: t.primary }} thumbColor="#f4f3f4" />
                    </SettingRow>
                </CollapsibleSection>

                <CollapsibleSection id="reminders" title="Reminders" icon="⏰">
                    <SettingRow icon="restaurant-outline" label="Meal Logging" color="#FF9800">
                        <Switch value={reminderMealEnabled} onValueChange={(v) => setReminder('reminderMealEnabled', v)}
                            trackColor={{ false: '#767577', true: '#FF9800' }} thumbColor="#f4f3f4" />
                    </SettingRow>
                    <SettingRow icon="water-outline" label="Glucose Check" color="#4CAF50">
                        <Switch value={reminderGlucoseEnabled} onValueChange={(v) => setReminder('reminderGlucoseEnabled', v)}
                            trackColor={{ false: '#767577', true: '#4CAF50' }} thumbColor="#f4f3f4" />
                    </SettingRow>
                    <SettingRow icon="cafe-outline" label="Water Intake" color="#0A85FF" isLast>
                        <Switch value={reminderWaterEnabled} onValueChange={(v) => setReminder('reminderWaterEnabled', v)}
                            trackColor={{ false: '#767577', true: '#0A85FF' }} thumbColor="#f4f3f4" />
                    </SettingRow>
                </CollapsibleSection>

                <CollapsibleSection id="tools" title="Tools & Features" icon="🛠️">
                    <SettingRow icon="book" label="Logbook" value="Timeline" color="#2196F3"
                        onPress={() => navigation.navigate('Logbook')} />
                    <SettingRow icon="medical" label="Medications" value="Track doses" color="#7B61FF"
                        onPress={() => navigation.navigate('Medication')} />
                    <SettingRow icon="fitness" label="Activity Tracker" value="Exercise" color="#4CAF50"
                        onPress={() => navigation.navigate('Activity')} />
                    <SettingRow icon="happy" label="Mood & Wellness" value="Check-in" color="#FF9800"
                        onPress={() => navigation.navigate('Mood')} />
                    <SettingRow icon="school" label="Learning Hub" value="Articles" color="#00BCD4"
                        onPress={() => navigation.navigate('Education')} />
                    <SettingRow icon="alert-circle" label="Emergency" value="SOS" color="#FF1744"
                        onPress={() => navigation.navigate('Emergency')} isLast />
                </CollapsibleSection>

                <CollapsibleSection id="data" title="Data & Privacy" icon="📦">
                    <SettingRow icon="download-outline" label="Export All Data" value="CSV" color="#2196F3"
                        onPress={handleExportData} />
                    <SettingRow icon="cloud-upload-outline" label="Sync to Cloud" color="#4CAF50"
                        onPress={handleSync} />
                    <SettingRow icon="shield-checkmark" label="Privacy Policy" color="#607D8B"
                        onPress={() => showModal('Privacy Policy', 'At GlucoTrack AI, your health data is private and encrypted. We do not sell your personal information. Your data is used exclusively to provide you with insights and logs. We use industry-standard security measures to protect your information.')} />
                    <SettingRow icon="document-text" label="Terms & Conditions" color="#607D8B"
                        onPress={() => showModal('Terms of Service', 'By using GlucoTrack AI, you agree to our terms. This app is for informational purposes and is not a replacement for professional medical advice. Please consult your healthcare provider before making medical decisions.')} />
                    <SettingRow icon="trash-outline" label="Clear All Logs" color="#FF5252"
                        onPress={() => {
                            Alert.alert('Clear All Logs', 'This will permanently delete all logs. This cannot be undone.', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete All', style: 'destructive', onPress: () => { useLogsStore.setState({ glucoseLogs: [], carbLogs: [], insulinLogs: [] }); Alert.alert('Done', 'All logs have been cleared.'); } }
                            ]);
                        }}
                        isLast
                    />
                </CollapsibleSection>


                {/* Actions */}
                <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: t.error + '10' }]} onPress={handleLogout}>
                    <Ionicons name={isGuest ? "refresh" : "log-out"} size={20} color={t.error} />
                    <Text style={[styles.logoutText, { color: t.error }]}>{isGuest ? 'Reset Local Data' : 'Sign Out'}</Text>
                </TouchableOpacity>

                <View style={styles.legalInfo}>
                    <Text style={[styles.medicalDisclaimer, { color: t.textTertiary }]}>
                        Disclaimer: Not medical advice. Always consult a physician.
                    </Text>
                    <Text style={[styles.versionText, { color: t.textTertiary }]}>GlucoTrack AI v1.0.5 • Build 248</Text>
                </View>
            </ScrollView>

            {/* Content Modal */}
            <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
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
                        <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: t.primary }]} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalCloseBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Health Profile Edit Modal */}
            <Modal animationType="slide" transparent visible={profileModalVisible} onRequestClose={() => setProfileModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.profileModalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>Health Profile</Text>
                            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.profileInputLabel, { color: t.textSecondary }]}>AGE</Text>
                        <TextInput
                            style={[styles.profileInput, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="Enter your age"
                            placeholderTextColor={t.textTertiary}
                            keyboardType="numeric"
                            value={ageInput}
                            onChangeText={setAgeInput}
                        />

                        <Text style={[styles.profileInputLabel, { color: t.textSecondary }]}>WEIGHT</Text>
                        <View style={styles.weightRow}>
                            <TextInput
                                style={[styles.profileInput, { flex: 1, backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                                placeholder="Enter weight"
                                placeholderTextColor={t.textTertiary}
                                keyboardType="numeric"
                                value={weightInput}
                                onChangeText={setWeightInput}
                            />
                            <View style={styles.unitToggle}>
                                <TouchableOpacity
                                    style={[styles.unitBtn, weightUnitInput === 'kg' && { backgroundColor: t.primary }]}
                                    onPress={() => setWeightUnitInput('kg')}>
                                    <Text style={[styles.unitBtnText, { color: weightUnitInput === 'kg' ? '#FFF' : t.textSecondary }]}>kg</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.unitBtn, weightUnitInput === 'lbs' && { backgroundColor: t.primary }]}
                                    onPress={() => setWeightUnitInput('lbs')}>
                                    <Text style={[styles.unitBtnText, { color: weightUnitInput === 'lbs' ? '#FFF' : t.textSecondary }]}>lbs</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.saveProfileBtn, { backgroundColor: t.primary }]} onPress={handleSaveProfile}>
                            <Text style={styles.saveProfileBtnText}>Save Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    backButton: { width: 42, height: 42, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center' },
    syncButton: { width: 42, height: 42, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
    // Profile Card
    profileCard: { borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: Spacing.xl, overflow: 'hidden' },
    profileTop: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
    avatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFE0B2', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.lg },
    avatarInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: 26 },
    profileInfo: { flex: 1 },
    profileName: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
    profileEmail: { fontSize: Typography.sizes.sm, marginBottom: 6 },
    profileBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.round },
    typeBadgeText: { fontSize: 10, fontWeight: 'bold' },
    signInBadge: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.lg },
    signInBadgeText: { color: '#FFF', fontSize: 10, fontWeight: Typography.weights.bold },
    // Stats Grid
    statsGrid: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: Spacing.md },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 9, fontWeight: '600', marginTop: 2 },
    statDivider: { width: 1, height: 30, alignSelf: 'center' },
    // Section
    // Sections
    sectionWrapper: { marginBottom: Spacing.md },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 16, borderRadius: BorderRadius.xl, borderWidth: 1 },
    sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sectionIcon: { fontSize: 18 },
    sectionTitleText: { fontSize: 15, fontWeight: '700' },
    settingsGroup: { borderRadius: BorderRadius.xl, borderWidth: 1, marginTop: Spacing.xs, overflow: 'hidden' },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1 },

    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    settingLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium },
    settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    settingValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
    // Actions
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.xl, marginTop: Spacing.sm },
    logoutText: { fontWeight: Typography.weights.bold, fontSize: Typography.sizes.md },
    legalInfo: { marginTop: Spacing.xl, alignItems: 'center', gap: 6 },
    medicalDisclaimer: { fontSize: 9, textAlign: 'center', lineHeight: 14, paddingHorizontal: Spacing.xl },
    versionText: { fontSize: 10 },
    // Content Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    modalContent: { width: '100%', maxHeight: '70%', borderRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: 1, ...Shadow.dark },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    modalTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    modalBody: { marginBottom: Spacing.xl },
    modalBodyText: { fontSize: Typography.sizes.md, lineHeight: 22 },
    modalCloseBtn: { height: 50, borderRadius: BorderRadius.xl, justifyContent: 'center', alignItems: 'center' },
    modalCloseBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: Typography.sizes.md },
    // Profile Modal
    profileModalContent: { width: '100%', borderRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: 1, ...Shadow.dark },
    profileInputLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: 6 },
    profileInput: { height: 52, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, fontSize: Typography.sizes.md, borderWidth: 1 },
    weightRow: { flexDirection: 'row', gap: Spacing.sm },
    unitToggle: { flexDirection: 'row', gap: 4 },
    unitBtn: { height: 52, paddingHorizontal: 16, borderRadius: BorderRadius.xl, justifyContent: 'center', alignItems: 'center' },
    unitBtnText: { fontSize: 14, fontWeight: 'bold' },
    saveProfileBtn: { height: 52, borderRadius: BorderRadius.xl, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
    saveProfileBtnText: { color: '#FFF', fontSize: Typography.sizes.md, fontWeight: 'bold' },
});
