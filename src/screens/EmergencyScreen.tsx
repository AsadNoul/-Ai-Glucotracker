import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    Linking,
    Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore, EmergencyContact } from '../store';

const LOW_STEPS = [
    { step: 1, emoji: '🍬', title: 'Eat 15g fast-acting carbs', detail: '4 glucose tablets, 4 oz juice, 1 tbsp sugar, or 5 pieces hard candy' },
    { step: 2, emoji: '⏱️', title: 'Wait 15 minutes', detail: 'Sit down and rest. Do not drive or operate machinery.' },
    { step: 3, emoji: '🩸', title: 'Re-check blood sugar', detail: 'Test again after 15 minutes.' },
    { step: 4, emoji: '🔁', title: 'Repeat if still below 70', detail: 'If glucose is still low, eat another 15g carbs and wait 15 more minutes.' },
    { step: 5, emoji: '🥪', title: 'Eat a balanced snack', detail: 'Once above 70 mg/dL, eat a snack with protein + carbs (e.g., peanut butter crackers).' },
];

const HIGH_STEPS = [
    { step: 1, emoji: '💧', title: 'Drink water', detail: 'Stay hydrated. Drink 8-16 oz of water immediately.' },
    { step: 2, emoji: '🚶', title: 'Light movement', detail: 'A gentle 10-15 minute walk can help lower blood sugar.' },
    { step: 3, emoji: '💊', title: 'Check medication', detail: 'Make sure you haven\'t missed any doses. Take insulin if prescribed for corrections.' },
    { step: 4, emoji: '⏱️', title: 'Re-check in 30-60 min', detail: 'Test blood sugar again. If still above 300 mg/dL, contact your doctor.' },
    { step: 5, emoji: '🆘', title: 'Seek help if needed', detail: 'If experiencing nausea, vomiting, confusion, or difficulty breathing — call 911.' },
];

export const EmergencyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, targetGlucoseMax, emergencyContacts, addEmergencyContact, removeEmergencyContact } = useSettingsStore();
    const { glucoseLogs } = useLogsStore();
    const t = getThemeColors(theme);

    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactRelation, setContactRelation] = useState('');
    const [activeProtocol, setActiveProtocol] = useState<'low' | 'high' | null>(null);

    const latestGlucose = useMemo(() => {
        if (glucoseLogs.length === 0) return null;
        return glucoseLogs[0];
    }, [glucoseLogs]);

    const glucoseStatus = useMemo(() => {
        if (!latestGlucose) return 'unknown';
        const v = latestGlucose.glucose_value;
        if (v < 54) return 'critical-low';
        if (v < 70) return 'low';
        if (v <= targetGlucoseMax) return 'normal';
        if (v <= 300) return 'high';
        return 'critical-high';
    }, [latestGlucose, targetGlucoseMax]);

    const handleEmergencyCall = () => {
        Alert.alert('📞 Call Emergency Services', 'This will dial 911 (or your local emergency number).', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call 911', style: 'destructive', onPress: () => Linking.openURL('tel:911') },
        ]);
    };

    const handleCallContact = (contact: EmergencyContact) => {
        Alert.alert(`📞 Call ${contact.name}`, `Dial ${contact.phone}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => Linking.openURL(`tel:${contact.phone}`) },
        ]);
    };

    const handlePanicAlert = () => {
        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
        if (emergencyContacts.length > 0) {
            const names = emergencyContacts.map(c => c.name).join(', ');
            Alert.alert(
                '🆘 Alert Sent',
                `Emergency alerts would be sent to: ${names}\n\nIn a production build, this would send SMS/push notifications with your location and current glucose reading.`,
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert(
                '⚠️ No Emergency Contacts',
                'Add emergency contacts below so we can alert them when you need help.',
                [
                    { text: 'Cancel' },
                    { text: 'Add Contact', onPress: () => setContactModalVisible(true) },
                ]
            );
        }
    };

    const handleAddContact = () => {
        if (!contactName.trim() || !contactPhone.trim()) {
            Alert.alert('Required', 'Please enter name and phone number.');
            return;
        }
        const contact: EmergencyContact = {
            id: Date.now().toString(),
            name: contactName.trim(),
            phone: contactPhone.trim(),
            relationship: contactRelation.trim() || 'Other',
        };
        addEmergencyContact(contact);
        setContactName('');
        setContactPhone('');
        setContactRelation('');
        setContactModalVisible(false);
    };

    const handleRemoveContact = (contact: EmergencyContact) => {
        Alert.alert('Remove Contact', `Remove ${contact.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeEmergencyContact(contact.id) },
        ]);
    };

    const statusColor = glucoseStatus === 'critical-low' || glucoseStatus === 'critical-high' ? '#FF1744'
        : glucoseStatus === 'low' || glucoseStatus === 'high' ? '#FF9800'
            : glucoseStatus === 'normal' ? '#4CAF50' : t.textTertiary;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: t.glass }]}>
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Emergency</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Current Status */}
                <View style={[styles.statusCard, { backgroundColor: statusColor + '10', borderColor: statusColor + '30' }]}>
                    <View style={styles.statusLeft}>
                        <MaterialCommunityIcons
                            name={glucoseStatus === 'normal' ? 'check-circle' : 'alert-circle'}
                            size={32}
                            color={statusColor}
                        />
                        <View>
                            <Text style={[styles.statusLabel, { color: t.textTertiary }]}>CURRENT STATUS</Text>
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {glucoseStatus === 'critical-low' ? '⚠️ CRITICALLY LOW' :
                                    glucoseStatus === 'low' ? '⚡ LOW BLOOD SUGAR' :
                                        glucoseStatus === 'high' ? '📈 HIGH BLOOD SUGAR' :
                                            glucoseStatus === 'critical-high' ? '🚨 CRITICALLY HIGH' :
                                                glucoseStatus === 'normal' ? '✅ In Range' : '-- No Reading --'}
                            </Text>
                        </View>
                    </View>
                    {latestGlucose && (
                        <Text style={[styles.statusValue, { color: statusColor }]}>
                            {latestGlucose.glucose_value}
                        </Text>
                    )}
                </View>

                {/* Emergency Actions */}
                <View style={styles.emergencyRow}>
                    <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#FF1744' }]} onPress={handleEmergencyCall}>
                        <Ionicons name="call" size={28} color="#FFF" />
                        <Text style={styles.emergencyBtnText}>Call 911</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#FF6D00' }]} onPress={handlePanicAlert}>
                        <Ionicons name="notifications" size={28} color="#FFF" />
                        <Text style={styles.emergencyBtnText}>Alert Contacts</Text>
                    </TouchableOpacity>
                </View>

                {/* Protocol Cards */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>📋 EMERGENCY PROTOCOLS</Text>

                <TouchableOpacity
                    style={[styles.protocolCard, { backgroundColor: '#FFC10710', borderColor: '#FFC10740' }]}
                    onPress={() => setActiveProtocol(activeProtocol === 'low' ? null : 'low')}
                >
                    <View style={styles.protocolHeader}>
                        <Text style={styles.protocolEmoji}>⬇️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.protocolTitle, { color: t.text }]}>Low Blood Sugar (Hypo)</Text>
                            <Text style={[styles.protocolSub, { color: t.textTertiary }]}>Below 70 mg/dL — The 15-15 Rule</Text>
                        </View>
                        <Ionicons name={activeProtocol === 'low' ? 'chevron-up' : 'chevron-down'} size={20} color={t.textTertiary} />
                    </View>
                    {activeProtocol === 'low' && (
                        <View style={styles.stepsContainer}>
                            {LOW_STEPS.map(s => (
                                <View key={s.step} style={[styles.stepRow, { borderBottomColor: t.border }]}>
                                    <View style={[styles.stepNum, { backgroundColor: '#FFC10720' }]}>
                                        <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.stepTitle, { color: t.text }]}>Step {s.step}: {s.title}</Text>
                                        <Text style={[styles.stepDetail, { color: t.textSecondary }]}>{s.detail}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.protocolCard, { backgroundColor: '#FF525210', borderColor: '#FF525240' }]}
                    onPress={() => setActiveProtocol(activeProtocol === 'high' ? null : 'high')}
                >
                    <View style={styles.protocolHeader}>
                        <Text style={styles.protocolEmoji}>⬆️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.protocolTitle, { color: t.text }]}>High Blood Sugar (Hyper)</Text>
                            <Text style={[styles.protocolSub, { color: t.textTertiary }]}>Above 250 mg/dL — What to do</Text>
                        </View>
                        <Ionicons name={activeProtocol === 'high' ? 'chevron-up' : 'chevron-down'} size={20} color={t.textTertiary} />
                    </View>
                    {activeProtocol === 'high' && (
                        <View style={styles.stepsContainer}>
                            {HIGH_STEPS.map(s => (
                                <View key={s.step} style={[styles.stepRow, { borderBottomColor: t.border }]}>
                                    <View style={[styles.stepNum, { backgroundColor: '#FF525220' }]}>
                                        <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.stepTitle, { color: t.text }]}>Step {s.step}: {s.title}</Text>
                                        <Text style={[styles.stepDetail, { color: t.textSecondary }]}>{s.detail}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>

                {/* Emergency Contacts */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>👥 EMERGENCY CONTACTS</Text>

                {emergencyContacts.length === 0 ? (
                    <View style={[styles.emptyContacts, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Ionicons name="people" size={40} color={t.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: t.text }]}>No Emergency Contacts</Text>
                        <Text style={[styles.emptySub, { color: t.textTertiary }]}>Add trusted contacts who can help during a glucose emergency.</Text>
                    </View>
                ) : (
                    emergencyContacts.map(contact => (
                        <View key={contact.id} style={[styles.contactCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            <View style={[styles.contactAvatar, { backgroundColor: t.primary + '15' }]}>
                                <Ionicons name="person" size={20} color={t.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.contactName, { color: t.text }]}>{contact.name}</Text>
                                <Text style={[styles.contactInfo, { color: t.textTertiary }]}>{contact.relationship} · {contact.phone}</Text>
                            </View>
                            <TouchableOpacity style={[styles.callBtn, { backgroundColor: '#4CAF5015' }]} onPress={() => handleCallContact(contact)}>
                                <Ionicons name="call" size={18} color="#4CAF50" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveContact(contact)}>
                                <Ionicons name="close" size={20} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                <TouchableOpacity style={[styles.addContactBtn, { borderColor: t.primary }]} onPress={() => setContactModalVisible(true)}>
                    <Ionicons name="add" size={20} color={t.primary} />
                    <Text style={[styles.addContactText, { color: t.primary }]}>Add Emergency Contact</Text>
                </TouchableOpacity>

                {/* Emergency Kit Checklist */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>🎒 EMERGENCY KIT CHECKLIST</Text>
                <View style={[styles.checklistCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    {[
                        { item: 'Glucose tablets or gel', emoji: '🍬' },
                        { item: 'Juice box (4 oz)', emoji: '🧃' },
                        { item: 'Glucagon kit', emoji: '💉' },
                        { item: 'Blood glucose meter + strips', emoji: '🩸' },
                        { item: 'Medical ID card/bracelet', emoji: '🪪' },
                        { item: 'Emergency contact list', emoji: '📋' },
                        { item: 'Snack (crackers + peanut butter)', emoji: '🥜' },
                        { item: 'Water bottle', emoji: '💧' },
                    ].map((item, i) => (
                        <View key={i} style={[styles.checkItem, i < 7 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
                            <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                            <Text style={[styles.checkText, { color: t.text }]}>{item.item}</Text>
                        </View>
                    ))}
                </View>

                {/* Disclaimer */}
                <View style={[styles.disclaimer, { backgroundColor: t.glass }]}>
                    <Ionicons name="warning" size={18} color="#FF9800" />
                    <Text style={[styles.disclaimerText, { color: t.textTertiary }]}>
                        This app is not a substitute for professional medical advice. In case of a real medical emergency, always call your local emergency number (911) immediately.
                    </Text>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Add Contact Modal */}
            <Modal animationType="slide" transparent visible={contactModalVisible} onRequestClose={() => setContactModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>Add Emergency Contact</Text>
                            <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="Contact name"
                            placeholderTextColor={t.textTertiary}
                            value={contactName}
                            onChangeText={setContactName}
                        />

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>PHONE NUMBER</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="Phone number"
                            placeholderTextColor={t.textTertiary}
                            value={contactPhone}
                            onChangeText={setContactPhone}
                            keyboardType="phone-pad"
                        />

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>RELATIONSHIP</Text>
                        <View style={styles.relationRow}>
                            {['Spouse', 'Parent', 'Sibling', 'Friend', 'Doctor', 'Other'].map(rel => (
                                <TouchableOpacity key={rel}
                                    style={[styles.relChip, contactRelation === rel && { backgroundColor: t.primary + '15', borderColor: t.primary }]}
                                    onPress={() => setContactRelation(rel)}>
                                    <Text style={[styles.relText, { color: contactRelation === rel ? t.primary : t.textSecondary }]}>{rel}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.primary }]} onPress={handleAddContact}>
                            <Ionicons name="person-add" size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>Save Contact</Text>
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
    backBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
    // Status
    statusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1.5, marginBottom: Spacing.xl },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    statusLabel: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
    statusText: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
    statusValue: { fontSize: 36, fontWeight: 'bold' },
    // Emergency
    emergencyRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    emergencyBtn: { flex: 1, height: 80, borderRadius: BorderRadius.xxl, justifyContent: 'center', alignItems: 'center', gap: 6, ...Shadow.dark },
    emergencyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    // Section
    sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: Spacing.md },
    // Protocol
    protocolCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.md, overflow: 'hidden' },
    protocolHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
    protocolEmoji: { fontSize: 28 },
    protocolTitle: { fontSize: Typography.sizes.md, fontWeight: 'bold' },
    protocolSub: { fontSize: 11, marginTop: 2 },
    stepsContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.md, borderBottomWidth: 1, gap: Spacing.md },
    stepNum: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    stepTitle: { fontSize: 14, fontWeight: '600' },
    stepDetail: { fontSize: 12, lineHeight: 18, marginTop: 2 },
    // Contacts
    emptyContacts: { padding: Spacing.xxl, borderRadius: BorderRadius.xxl, borderWidth: 1, alignItems: 'center', gap: 8 },
    emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: 'bold' },
    emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
    contactCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 8, gap: Spacing.md },
    contactAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    contactName: { fontSize: 14, fontWeight: '600' },
    contactInfo: { fontSize: 11, marginTop: 2 },
    callBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    addContactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 4 },
    addContactText: { fontWeight: 'bold', fontSize: 14 },
    // Checklist
    checklistCard: { padding: Spacing.lg, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
    checkText: { fontSize: 14, fontWeight: '500' },
    // Disclaimer
    disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: Spacing.lg, borderRadius: BorderRadius.xl },
    disclaimerText: { flex: 1, fontSize: 11, lineHeight: 17 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    modalTitle: { fontSize: Typography.sizes.xl, fontWeight: 'bold' },
    inputLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6, marginTop: Spacing.md },
    input: { height: 48, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, fontSize: 14, borderWidth: 1 },
    relationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    relChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.round, borderWidth: 1, borderColor: 'transparent' },
    relText: { fontSize: 12, fontWeight: '600' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: BorderRadius.xl, marginTop: Spacing.xl },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
