import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore, VitalEntry } from '../store';

export const VitalsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, weightUnit: settingsWeightUnit } = useSettingsStore();
    const { vitals, addVital } = useLogsStore();
    const t = getThemeColors(theme);

    const [activeTab, setActiveTab] = useState<'blood_pressure' | 'weight' | 'heart_rate'>('blood_pressure');

    const [showInput, setShowInput] = useState(false);

    // BP inputs
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    // Weight inputs
    const [weightVal, setWeightVal] = useState('');
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(settingsWeightUnit);

    // HR input
    const [hrVal, setHrVal] = useState('');

    const filteredVitals = useMemo(() => vitals.filter(v => v.type === activeTab).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [vitals, activeTab]);

    // BMI Calculation
    const bmi = useMemo(() => {
        const latestWeight = vitals.filter(v => v.type === 'weight').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        if (!latestWeight?.values.weight) return null;
        // latestWeight.values.weight is stored in whichever unit was used at time of entry?
        // Actually, let's assume entries store value + we'd need metadata, 
        // but for now let's assume weight is stored in 'kg' for calculation or use its own logic.
        // The original code used weightUnit variable which is local.
        const weightKg = weightUnit === 'lbs' ? (latestWeight.values.weight * 0.453592) : latestWeight.values.weight;
        const heightM = 1.75; // Default height, would be configurable
        const bmiVal = weightKg / (heightM * heightM);
        return {
            value: bmiVal.toFixed(1),
            category: bmiVal < 18.5 ? 'Underweight' : bmiVal < 25 ? 'Normal' : bmiVal < 30 ? 'Overweight' : 'Obese',
            color: bmiVal < 18.5 ? '#FF9800' : bmiVal < 25 ? '#4CAF50' : bmiVal < 30 ? '#FF9800' : '#FF5252',
        };
    }, [vitals, weightUnit]);


    // BP Classification
    const classifyBP = (sys: number, dia: number) => {
        if (sys < 120 && dia < 80) return { label: 'Normal', color: '#4CAF50' };
        if (sys < 130 && dia < 80) return { label: 'Elevated', color: '#FFC107' };
        if (sys < 140 || dia < 90) return { label: 'Stage 1 HTN', color: '#FF9800' };
        if (sys >= 140 || dia >= 90) return { label: 'Stage 2 HTN', color: '#FF5252' };
        return { label: 'Unknown', color: '#999' };
    };

    const handleSave = () => {
        const id = Date.now().toString();
        const timestamp = new Date().toISOString();

        if (activeTab === 'blood_pressure') {
            const sys = parseInt(systolic);
            const dia = parseInt(diastolic);
            if (!sys || !dia) { Alert.alert('Error', 'Enter both systolic and diastolic values.'); return; }
            addVital({ id, type: 'blood_pressure', values: { systolic: sys, diastolic: dia }, timestamp });
            setSystolic(''); setDiastolic('');
        } else if (activeTab === 'weight') {
            const w = parseFloat(weightVal);
            if (!w) { Alert.alert('Error', 'Enter your weight.'); return; }
            addVital({ id, type: 'weight', values: { weight: w }, timestamp });
            setWeightVal('');
        } else {
            const hr = parseInt(hrVal);
            if (!hr) { Alert.alert('Error', 'Enter your heart rate.'); return; }
            addVital({ id, type: 'heart_rate', values: { heartRate: hr }, timestamp });
            setHrVal('');
        }
        setShowInput(false);
        Alert.alert('✅ Saved', 'Vital recorded successfully.');
    };


    const tabs: { key: typeof activeTab; emoji: string; label: string }[] = [
        { key: 'blood_pressure', emoji: '❤️', label: 'Blood Pressure' },
        { key: 'weight', emoji: '⚖️', label: 'Weight & BMI' },
        { key: 'heart_rate', emoji: '💓', label: 'Heart Rate' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Health Vitals</Text>
                <TouchableOpacity onPress={() => setShowInput(!showInput)}>
                    <Ionicons name={showInput ? 'close' : 'add-circle'} size={28} color={t.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, { backgroundColor: activeTab === tab.key ? t.primary : t.card, borderColor: activeTab === tab.key ? t.primary : t.border }]}
                        onPress={() => { setActiveTab(tab.key); setShowInput(false); }}
                    >
                        <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                        <Text style={[styles.tabText, { color: activeTab === tab.key ? '#FFF' : t.textSecondary }]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Input Form */}
                {showInput && (
                    <View style={[styles.inputCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Text style={[styles.inputTitle, { color: t.text }]}>
                            {activeTab === 'blood_pressure' ? '❤️ Record Blood Pressure' : activeTab === 'weight' ? '⚖️ Record Weight' : '💓 Record Heart Rate'}
                        </Text>

                        {activeTab === 'blood_pressure' && (
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Systolic</Text>
                                    <TextInput style={[styles.input, { color: t.text, borderColor: t.border }]} value={systolic} onChangeText={setSystolic} placeholder="120" placeholderTextColor={t.textTertiary} keyboardType="number-pad" />
                                </View>
                                <Text style={[styles.slash, { color: t.textTertiary }]}>/</Text>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Diastolic</Text>
                                    <TextInput style={[styles.input, { color: t.text, borderColor: t.border }]} value={diastolic} onChangeText={setDiastolic} placeholder="80" placeholderTextColor={t.textTertiary} keyboardType="number-pad" />
                                </View>
                                <Text style={[styles.unit, { color: t.textTertiary }]}>mmHg</Text>
                            </View>
                        )}

                        {activeTab === 'weight' && (
                            <View style={styles.inputRow}>
                                <View style={{ flex: 1 }}>
                                    <TextInput style={[styles.input, { color: t.text, borderColor: t.border }]} value={weightVal} onChangeText={setWeightVal} placeholder="70" placeholderTextColor={t.textTertiary} keyboardType="decimal-pad" />
                                </View>
                                <View style={styles.unitToggle}>
                                    <TouchableOpacity style={[styles.unitBtn, { backgroundColor: weightUnit === 'kg' ? t.primary : t.glass }]} onPress={() => setWeightUnit('kg')}>
                                        <Text style={{ color: weightUnit === 'kg' ? '#FFF' : t.textSecondary, fontWeight: '600', fontSize: 13 }}>kg</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.unitBtn, { backgroundColor: weightUnit === 'lbs' ? t.primary : t.glass }]} onPress={() => setWeightUnit('lbs')}>
                                        <Text style={{ color: weightUnit === 'lbs' ? '#FFF' : t.textSecondary, fontWeight: '600', fontSize: 13 }}>lbs</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {activeTab === 'heart_rate' && (
                            <View style={styles.inputRow}>
                                <View style={{ flex: 1 }}>
                                    <TextInput style={[styles.input, { color: t.text, borderColor: t.border }]} value={hrVal} onChangeText={setHrVal} placeholder="72" placeholderTextColor={t.textTertiary} keyboardType="number-pad" />
                                </View>
                                <Text style={[styles.unit, { color: t.textTertiary }]}>BPM</Text>
                            </View>
                        )}

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.primary }]} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* BMI Card (for weight tab) */}
                {activeTab === 'weight' && bmi && (
                    <View style={[styles.bmiCard, { backgroundColor: bmi.color + '10', borderColor: bmi.color + '30' }]}>
                        <Text style={[styles.bmiTitle, { color: t.textSecondary }]}>BMI</Text>
                        <Text style={[styles.bmiValue, { color: bmi.color }]}>{bmi.value}</Text>
                        <Text style={[styles.bmiCategory, { color: bmi.color }]}>{bmi.category}</Text>
                    </View>
                )}

                {/* History */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>📋 HISTORY</Text>
                {filteredVitals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="heart-pulse" size={48} color={t.textTertiary} />
                        <Text style={[styles.emptyText, { color: t.textTertiary }]}>No records yet. Tap + to add.</Text>
                    </View>
                ) : (
                    filteredVitals.map(entry => (
                        <View key={entry.id} style={[styles.historyCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            <View style={styles.historyRow}>
                                {entry.type === 'blood_pressure' && (
                                    <>
                                        <View>
                                            <Text style={[styles.historyValue, { color: t.text }]}>
                                                {entry.values.systolic}/{entry.values.diastolic}
                                            </Text>
                                            <Text style={[styles.historyUnit, { color: t.textTertiary }]}>mmHg</Text>
                                        </View>
                                        <View style={[styles.bpBadge, { backgroundColor: classifyBP(entry.values.systolic!, entry.values.diastolic!).color + '15' }]}>
                                            <Text style={{ color: classifyBP(entry.values.systolic!, entry.values.diastolic!).color, fontSize: 12, fontWeight: '700' }}>
                                                {classifyBP(entry.values.systolic!, entry.values.diastolic!).label}
                                            </Text>
                                        </View>
                                    </>
                                )}
                                {entry.type === 'weight' && (
                                    <View>
                                        <Text style={[styles.historyValue, { color: t.text }]}>{entry.values.weight}</Text>
                                        <Text style={[styles.historyUnit, { color: t.textTertiary }]}>{weightUnit}</Text>
                                    </View>
                                )}
                                {entry.type === 'heart_rate' && (
                                    <View>
                                        <Text style={[styles.historyValue, { color: t.text }]}>{entry.values.heartRate}</Text>
                                        <Text style={[styles.historyUnit, { color: t.textTertiary }]}>BPM</Text>
                                    </View>
                                )}
                                <Text style={[styles.historyTime, { color: t.textTertiary }]}>
                                    {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    ))
                )}

                {/* Info */}
                <View style={[styles.infoBox, { backgroundColor: t.glass }]}>
                    <MaterialCommunityIcons name="information" size={16} color={t.textTertiary} />
                    <Text style={[styles.infoText, { color: t.textTertiary }]}>
                        {activeTab === 'blood_pressure' ? 'Normal BP: <120/80 mmHg. Track regularly, especially with diabetes.' :
                            activeTab === 'weight' ? 'BMI is calculated using a default height of 1.75m. Consistent weight tracking helps manage diabetes.' :
                                'Resting heart rate: 60-100 BPM for adults. Lower rates often indicate better cardiovascular fitness.'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    tabRow: { paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: Spacing.sm },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    tabEmoji: { fontSize: 16 },
    tabText: { fontSize: 13, fontWeight: '600' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    // Input
    inputCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.light },
    inputTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    input: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 20, fontWeight: '700', textAlign: 'center' },
    slash: { fontSize: 28, fontWeight: '300', marginTop: 16 },
    unit: { fontSize: 14, fontWeight: '500', marginTop: 16 },
    unitToggle: { flexDirection: 'row', gap: 4 },
    unitBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.md },
    saveBtn: { borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.md },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    // BMI
    bmiCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
    bmiTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    bmiValue: { fontSize: 42, fontWeight: '900', marginTop: 4 },
    bmiCategory: { fontSize: 14, fontWeight: '600' },
    // History
    historyCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: 8, ...Shadow.light },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyValue: { fontSize: 24, fontWeight: '800' },
    historyUnit: { fontSize: 12 },
    historyTime: { fontSize: 12 },
    bpBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyText: { fontSize: 14 },
    // Info
    infoBox: { flexDirection: 'row', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.lg, gap: 8, alignItems: 'flex-start' },
    infoText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
