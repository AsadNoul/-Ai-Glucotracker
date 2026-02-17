import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useMedicationStore, Medication, MedicationLog } from '../store';

const MED_TYPES = [
    { key: 'oral' as const, label: 'Oral (Pill)', emoji: '💊', color: '#4CAF50' },
    { key: 'injection' as const, label: 'Injection', emoji: '💉', color: '#2196F3' },
    { key: 'insulin' as const, label: 'Insulin', emoji: '🩸', color: '#7B61FF' },
    { key: 'supplement' as const, label: 'Supplement', emoji: '🧬', color: '#FF9800' },
    { key: 'other' as const, label: 'Other', emoji: '🏥', color: '#607D8B' },
];

const COMMON_MEDS = [
    { name: 'Metformin', dosage: '500mg', type: 'oral' as const, frequency: 'Twice daily' },
    { name: 'Metformin', dosage: '1000mg', type: 'oral' as const, frequency: 'Once daily' },
    { name: 'Glimepiride', dosage: '2mg', type: 'oral' as const, frequency: 'Once daily' },
    { name: 'Sitagliptin (Januvia)', dosage: '100mg', type: 'oral' as const, frequency: 'Once daily' },
    { name: 'Empagliflozin (Jardiance)', dosage: '10mg', type: 'oral' as const, frequency: 'Once daily' },
    { name: 'Dapagliflozin (Farxiga)', dosage: '10mg', type: 'oral' as const, frequency: 'Once daily' },
    { name: 'Insulin Glargine (Lantus)', dosage: '10 units', type: 'insulin' as const, frequency: 'Once daily' },
    { name: 'Insulin Lispro (Humalog)', dosage: '5 units', type: 'insulin' as const, frequency: 'With meals' },
    { name: 'Ozempic (Semaglutide)', dosage: '0.5mg', type: 'injection' as const, frequency: 'Weekly' },
    { name: 'Trulicity (Dulaglutide)', dosage: '1.5mg', type: 'injection' as const, frequency: 'Weekly' },
    { name: 'Vitamin D3', dosage: '2000 IU', type: 'supplement' as const, frequency: 'Once daily' },
    { name: 'Omega-3 Fish Oil', dosage: '1000mg', type: 'supplement' as const, frequency: 'Once daily' },
];

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Bedtime', 'With meals', 'As needed'];

export const MedicationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useSettingsStore();
    const { medications, medicationLogs, addMedication, removeMedication, addMedicationLog } = useMedicationStore();
    const t = getThemeColors(theme);

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [medName, setMedName] = useState('');
    const [medDosage, setMedDosage] = useState('');
    const [medType, setMedType] = useState<Medication['type']>('oral');
    const [medFrequency, setMedFrequency] = useState('Once daily');
    const [medTimes, setMedTimes] = useState<string[]>(['Morning']);
    const [medNotes, setMedNotes] = useState('');
    const [showCommon, setShowCommon] = useState(false);

    const resetForm = () => {
        setMedName('');
        setMedDosage('');
        setMedType('oral');
        setMedFrequency('Once daily');
        setMedTimes(['Morning']);
        setMedNotes('');
        setShowCommon(false);
    };

    const handleAddMedication = () => {
        if (!medName.trim() || !medDosage.trim()) {
            Alert.alert('Required', 'Please enter medication name and dosage.');
            return;
        }
        const med: Medication = {
            id: Date.now().toString(),
            name: medName.trim(),
            dosage: medDosage.trim(),
            frequency: medFrequency,
            type: medType,
            timeOfDay: medTimes,
            notes: medNotes.trim() || undefined,
            active: true,
            createdAt: new Date().toISOString(),
        };
        addMedication(med);
        resetForm();
        setAddModalVisible(false);
        Alert.alert('Added', `${med.name} ${med.dosage} added to your medications.`);
    };

    const handleTakeMed = (med: Medication) => {
        const log: MedicationLog = {
            id: Date.now().toString(),
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            taken: true,
            takenAt: new Date().toISOString(),
        };
        addMedicationLog(log);
        Alert.alert('✅ Logged', `${med.name} ${med.dosage} marked as taken.`);
    };

    const handleSkipMed = (med: Medication) => {
        Alert.alert('Skip Medication', `Why are you skipping ${med.name}?`, [
            { text: 'Side effects', onPress: () => logSkip(med, 'Side effects') },
            { text: 'Forgot', onPress: () => logSkip(med, 'Forgot') },
            { text: 'Ran out', onPress: () => logSkip(med, 'Ran out') },
            { text: 'Other', onPress: () => logSkip(med, 'Other') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const logSkip = (med: Medication, reason: string) => {
        const log: MedicationLog = {
            id: Date.now().toString(),
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            taken: false,
            takenAt: new Date().toISOString(),
            skippedReason: reason,
        };
        addMedicationLog(log);
    };

    const handleRemoveMed = (med: Medication) => {
        Alert.alert('Remove Medication', `Remove ${med.name} from your list?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeMedication(med.id) },
        ]);
    };

    const selectCommonMed = (cm: typeof COMMON_MEDS[0]) => {
        setMedName(cm.name);
        setMedDosage(cm.dosage);
        setMedType(cm.type);
        setMedFrequency(cm.frequency);
        setShowCommon(false);
    };

    const toggleTime = (time: string) => {
        setMedTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
    };

    // Today's adherence
    const today = new Date().toDateString();
    const todayLogs = medicationLogs.filter(l => new Date(l.takenAt).toDateString() === today);
    const activeMeds = medications.filter(m => m.active);
    const takenToday = todayLogs.filter(l => l.taken).length;
    const adherenceRate = activeMeds.length > 0 ? Math.round((takenToday / activeMeds.length) * 100) : 0;

    const typeInfo = (type: Medication['type']) => MED_TYPES.find(t => t.key === type) || MED_TYPES[4];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: t.glass }]}>
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Medications</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(true)} style={[styles.addBtn, { backgroundColor: t.primary }]}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Today's Adherence Card */}
                <View style={[styles.adherenceCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={styles.adherenceHeader}>
                        <View>
                            <Text style={[styles.adhTitle, { color: t.text }]}>Today's Adherence</Text>
                            <Text style={[styles.adhSub, { color: t.textTertiary }]}>{takenToday} of {activeMeds.length} medications taken</Text>
                        </View>
                        <View style={[styles.adhCircle, { borderColor: adherenceRate >= 80 ? '#4CAF50' : adherenceRate >= 50 ? '#FF9800' : '#FF5252' }]}>
                            <Text style={[styles.adhPct, { color: adherenceRate >= 80 ? '#4CAF50' : adherenceRate >= 50 ? '#FF9800' : '#FF5252' }]}>
                                {adherenceRate}%
                            </Text>
                        </View>
                    </View>
                    {/* Progress bar */}
                    <View style={[styles.progressBg, { backgroundColor: t.glass }]}>
                        <View style={[styles.progressFill, {
                            width: `${Math.min(adherenceRate, 100)}%`,
                            backgroundColor: adherenceRate >= 80 ? '#4CAF50' : adherenceRate >= 50 ? '#FF9800' : '#FF5252'
                        }]} />
                    </View>
                </View>

                {/* Active Medications */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>💊 ACTIVE MEDICATIONS ({activeMeds.length})</Text>

                {activeMeds.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <MaterialCommunityIcons name="pill" size={48} color={t.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: t.text }]}>No Medications Added</Text>
                        <Text style={[styles.emptySubtitle, { color: t.textTertiary }]}>
                            Add your medications to track doses, set reminders, and monitor adherence.
                        </Text>
                        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: t.primary }]} onPress={() => setAddModalVisible(true)}>
                            <Text style={styles.emptyBtnText}>+ Add Medication</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    activeMeds.map(med => {
                        const info = typeInfo(med.type);
                        const wasTakenToday = todayLogs.some(l => l.medicationId === med.id && l.taken);
                        return (
                            <View key={med.id} style={[styles.medCard, { backgroundColor: t.card, borderColor: t.border }, Shadow.light]}>
                                <View style={styles.medCardTop}>
                                    <View style={[styles.medIcon, { backgroundColor: info.color + '15' }]}>
                                        <Text style={{ fontSize: 22 }}>{info.emoji}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.medName, { color: t.text }]}>{med.name}</Text>
                                        <Text style={[styles.medDosage, { color: t.textSecondary }]}>{med.dosage} · {med.frequency}</Text>
                                        <View style={styles.medTimesRow}>
                                            {med.timeOfDay.map((time, i) => (
                                                <View key={i} style={[styles.timeTag, { backgroundColor: t.glass }]}>
                                                    <Text style={[styles.timeTagText, { color: t.textSecondary }]}>{time}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemoveMed(med)}>
                                        <Ionicons name="ellipsis-vertical" size={20} color={t.textTertiary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Action Row */}
                                <View style={[styles.medActions, { borderTopColor: t.border }]}>
                                    {wasTakenToday ? (
                                        <View style={[styles.takenBadge, { backgroundColor: '#4CAF5010' }]}>
                                            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                            <Text style={[styles.takenText, { color: '#4CAF50' }]}>Taken Today</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.takeBtn, { backgroundColor: t.primary }]}
                                                onPress={() => handleTakeMed(med)}
                                            >
                                                <Ionicons name="checkmark" size={16} color="#FFF" />
                                                <Text style={styles.takeBtnText}>Take Now</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.skipBtn, { backgroundColor: t.glass }]}
                                                onPress={() => handleSkipMed(med)}
                                            >
                                                <Text style={[styles.skipBtnText, { color: t.textSecondary }]}>Skip</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}

                {/* Recent Medication Logs */}
                {medicationLogs.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>📋 RECENT LOGS</Text>
                        {medicationLogs.slice(0, 10).map((log, i) => (
                            <View key={log.id} style={[styles.logItem, { borderBottomColor: t.border }]}>
                                <View style={[styles.logDot, { backgroundColor: log.taken ? '#4CAF50' : '#FF5252' }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.logName, { color: t.text }]}>{log.medicationName} {log.dosage}</Text>
                                    <Text style={[styles.logTime, { color: t.textTertiary }]}>
                                        {new Date(log.takenAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        {!log.taken && log.skippedReason ? ` — Skipped: ${log.skippedReason}` : ''}
                                    </Text>
                                </View>
                                <Text style={{ color: log.taken ? '#4CAF50' : '#FF5252', fontSize: 12, fontWeight: 'bold' }}>
                                    {log.taken ? '✓ Taken' : '✗ Skipped'}
                                </Text>
                            </View>
                        ))}
                    </>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Add Medication Modal */}
            <Modal animationType="slide" transparent visible={addModalVisible} onRequestClose={() => { setAddModalVisible(false); resetForm(); }}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>Add Medication</Text>
                            <TouchableOpacity onPress={() => { setAddModalVisible(false); resetForm(); }}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Quick Select */}
                            <TouchableOpacity style={[styles.quickSelectBtn, { backgroundColor: t.glass }]} onPress={() => setShowCommon(!showCommon)}>
                                <MaterialCommunityIcons name="lightning-bolt" size={18} color={t.primary} />
                                <Text style={[styles.quickSelectText, { color: t.primary }]}>
                                    {showCommon ? 'Hide Common Meds' : 'Select from Common Medications'}
                                </Text>
                                <Ionicons name={showCommon ? 'chevron-up' : 'chevron-down'} size={16} color={t.primary} />
                            </TouchableOpacity>

                            {showCommon && (
                                <View style={styles.commonGrid}>
                                    {COMMON_MEDS.map((cm, i) => {
                                        const info = typeInfo(cm.type);
                                        return (
                                            <TouchableOpacity key={i} style={[styles.commonItem, { backgroundColor: t.glass, borderColor: t.border }]}
                                                onPress={() => selectCommonMed(cm)}>
                                                <Text style={{ fontSize: 16 }}>{info.emoji}</Text>
                                                <Text style={[styles.commonName, { color: t.text }]}>{cm.name}</Text>
                                                <Text style={[styles.commonDosage, { color: t.textTertiary }]}>{cm.dosage}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Form */}
                            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>MEDICATION NAME</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                                placeholder="e.g. Metformin"
                                placeholderTextColor={t.textTertiary}
                                value={medName}
                                onChangeText={setMedName}
                            />

                            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>DOSAGE</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                                placeholder="e.g. 500mg"
                                placeholderTextColor={t.textTertiary}
                                value={medDosage}
                                onChangeText={setMedDosage}
                            />

                            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>TYPE</Text>
                            <View style={styles.typeRow}>
                                {MED_TYPES.map(mt => (
                                    <TouchableOpacity key={mt.key}
                                        style={[styles.typeChip, medType === mt.key && { backgroundColor: mt.color + '20', borderColor: mt.color }]}
                                        onPress={() => setMedType(mt.key)}>
                                        <Text style={{ fontSize: 16 }}>{mt.emoji}</Text>
                                        <Text style={[styles.typeChipText, { color: medType === mt.key ? mt.color : t.textSecondary }]}>{mt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>FREQUENCY</Text>
                            <View style={styles.freqRow}>
                                {['Once daily', 'Twice daily', 'Three times', 'Weekly', 'As needed'].map(f => (
                                    <TouchableOpacity key={f}
                                        style={[styles.freqChip, medFrequency === f && { backgroundColor: t.primary + '15', borderColor: t.primary }]}
                                        onPress={() => setMedFrequency(f)}>
                                        <Text style={[styles.freqChipText, { color: medFrequency === f ? t.primary : t.textSecondary }]}>{f}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>TIME OF DAY</Text>
                            <View style={styles.freqRow}>
                                {TIME_OPTIONS.map(time => (
                                    <TouchableOpacity key={time}
                                        style={[styles.freqChip, medTimes.includes(time) && { backgroundColor: t.primary + '15', borderColor: t.primary }]}
                                        onPress={() => toggleTime(time)}>
                                        <Text style={[styles.freqChipText, { color: medTimes.includes(time) ? t.primary : t.textSecondary }]}>{time}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>NOTES (optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: t.glass, color: t.text, borderColor: t.border, height: 60 }]}
                                placeholder="e.g. Take with food"
                                placeholderTextColor={t.textTertiary}
                                value={medNotes}
                                onChangeText={setMedNotes}
                                multiline
                            />

                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.primary }]} onPress={handleAddMedication}>
                                <Ionicons name="checkmark" size={20} color="#FFF" />
                                <Text style={styles.saveBtnText}>Save Medication</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
    addBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
    // Adherence
    adherenceCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl, ...Shadow.light },
    adherenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    adhTitle: { fontSize: Typography.sizes.lg, fontWeight: 'bold' },
    adhSub: { fontSize: 12, marginTop: 2 },
    adhCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
    adhPct: { fontSize: 16, fontWeight: 'bold' },
    progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    // Section
    sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: Spacing.md },
    // Empty
    emptyCard: { padding: Spacing.xxl, borderRadius: BorderRadius.xxl, borderWidth: 1, alignItems: 'center', gap: 10 },
    emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: 'bold' },
    emptySubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
    emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.xl, marginTop: 4 },
    emptyBtnText: { color: '#FFF', fontWeight: 'bold' },
    // Med Card
    medCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.md, overflow: 'hidden' },
    medCardTop: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md },
    medIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    medName: { fontSize: Typography.sizes.md, fontWeight: 'bold' },
    medDosage: { fontSize: 12, marginTop: 2 },
    medTimesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
    timeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.round },
    timeTagText: { fontSize: 9, fontWeight: '600' },
    medActions: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, gap: 8 },
    takenBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', paddingVertical: 8, borderRadius: BorderRadius.xl },
    takenText: { fontWeight: 'bold', fontSize: 13 },
    takeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.xl },
    takeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
    skipBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.xl },
    skipBtnText: { fontWeight: '600', fontSize: 13 },
    // Logs
    logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, gap: Spacing.md },
    logDot: { width: 10, height: 10, borderRadius: 5 },
    logName: { fontSize: 14, fontWeight: '600' },
    logTime: { fontSize: 11, marginTop: 2 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, maxHeight: '90%', borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    modalTitle: { fontSize: Typography.sizes.xl, fontWeight: 'bold' },
    quickSelectBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: BorderRadius.xl, marginBottom: Spacing.md },
    quickSelectText: { flex: 1, fontSize: 13, fontWeight: '600' },
    commonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
    commonItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: BorderRadius.xl, borderWidth: 1, gap: 2 },
    commonName: { fontSize: 12, fontWeight: '600' },
    commonDosage: { fontSize: 10 },
    inputLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6, marginTop: Spacing.md },
    input: { height: 48, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, fontSize: 14, borderWidth: 1 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'transparent' },
    typeChipText: { fontSize: 11, fontWeight: '600' },
    freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    freqChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'transparent' },
    freqChipText: { fontSize: 11, fontWeight: '600' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: BorderRadius.xl, marginTop: Spacing.xl, marginBottom: Spacing.xl },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
