import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore } from '../store';

export const InsulinCalculatorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, glucoseUnit, targetGlucoseMin, targetGlucoseMax } = useSettingsStore();
    const { insulinLogs, addInsulinLog } = useLogsStore();
    const t = getThemeColors(theme);

    // ... rest of the component state ...


    // Settings
    const [carbRatio, setCarbRatio] = useState('10'); // 1u per X grams carbs
    const [sensitivityFactor, setSensitivityFactor] = useState('50'); // 1u drops glucose by X
    const [targetBG, setTargetBG] = useState(String(Math.round((targetGlucoseMin + targetGlucoseMax) / 2)));

    // Input
    const [currentBG, setCurrentBG] = useState('');
    const [carbsEaten, setCarbsEaten] = useState('');
    const [activeInsulin, setActiveInsulin] = useState('0'); // IOB

    // Calculate
    const calculation = useMemo(() => {
        const bg = parseFloat(currentBG);
        const carbs = parseFloat(carbsEaten);
        const cr = parseFloat(carbRatio);
        const sf = parseFloat(sensitivityFactor);
        const target = parseFloat(targetBG);
        const iob = parseFloat(activeInsulin) || 0;

        if (!cr || !sf) return null;

        let carbDose = 0;
        let correctionDose = 0;

        if (carbs && cr) {
            carbDose = carbs / cr;
        }
        if (bg && sf && target) {
            correctionDose = (bg - target) / sf;
        }

        const totalBefore = carbDose + correctionDose;
        const total = Math.max(0, totalBefore - iob);

        return {
            carbDose: Math.max(0, carbDose),
            correctionDose,
            iob,
            totalBefore,
            total: Math.round(total * 10) / 10,
        };
    }, [currentBG, carbsEaten, carbRatio, sensitivityFactor, targetBG, activeInsulin]);

    // Recent IOB estimation (insulin within last 4 hours)
    const estimatedIOB = useMemo(() => {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        const recent = insulinLogs.filter(l => l.timestamp >= fourHoursAgo);
        if (recent.length === 0) return 0;
        // Simple linear decay: insulin active for ~4 hours
        return recent.reduce((sum, l) => {
            const hoursAgo = (Date.now() - new Date(l.timestamp).getTime()) / (1000 * 60 * 60);
            const remaining = Math.max(0, 1 - hoursAgo / 4);
            return sum + l.units * remaining;
        }, 0);
    }, [insulinLogs]);


    const handleUseEstimatedIOB = () => {
        setActiveInsulin(estimatedIOB.toFixed(1));
    };

    const handleLog = () => {
        if (!calculation || calculation.total <= 0) return;
        Alert.alert(
            '💉 Log This Dose?',
            `${calculation.total}u will be logged to your insulin records.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Dose',
                    onPress: () => {
                        addInsulinLog({
                            id: Date.now().toString(),
                            user_id: 'local',
                            units: calculation.total,
                            type: 'rapid', // Usually rapid for corrections/meals
                            timestamp: new Date().toISOString(),
                            created_at: new Date().toISOString(),
                        });

                        Alert.alert('✅ Logged', `${calculation.total}u insulin dose recorded.`);
                    },
                },
            ]
        );
    };


    const InputField = ({ label, value, onChangeText, placeholder, suffix, hint }: any) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: t.textSecondary }]}>{label}</Text>
            <View style={[styles.inputRow, { backgroundColor: t.card, borderColor: t.border }]}>
                <TextInput
                    style={[styles.input, { color: t.text }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={t.textTertiary}
                    keyboardType="decimal-pad"
                />
                {suffix && <Text style={[styles.inputSuffix, { color: t.textTertiary }]}>{suffix}</Text>}
            </View>
            {hint && <Text style={[styles.inputHint, { color: t.textTertiary }]}>{hint}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Insulin Calculator</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Settings Section */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>⚙️ YOUR SETTINGS</Text>
                <View style={[styles.settingsCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={styles.settingsRow}>
                        <InputField label="Carb Ratio (1u per)" value={carbRatio} onChangeText={setCarbRatio} placeholder="10" suffix="g" />
                        <InputField label="Sensitivity Factor" value={sensitivityFactor} onChangeText={setSensitivityFactor} placeholder="50" suffix={glucoseUnit} />
                    </View>
                    <InputField label="Target Blood Glucose" value={targetBG} onChangeText={setTargetBG} placeholder="100" suffix={glucoseUnit} />
                </View>

                {/* Calculate Section */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>📊 CALCULATE DOSE</Text>
                <View style={[styles.calcCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <InputField label="Current Blood Glucose" value={currentBG} onChangeText={setCurrentBG} placeholder="Enter current BG" suffix={glucoseUnit} />
                    <InputField label="Carbs to Eat" value={carbsEaten} onChangeText={setCarbsEaten} placeholder="Enter carbs" suffix="g" />
                    <View style={styles.iobRow}>
                        <View style={{ flex: 1 }}>
                            <InputField label="Active Insulin (IOB)" value={activeInsulin} onChangeText={setActiveInsulin} placeholder="0" suffix="u" />
                        </View>
                        {estimatedIOB > 0 && (
                            <TouchableOpacity style={[styles.iobBtn, { backgroundColor: t.primary + '15' }]} onPress={handleUseEstimatedIOB}>
                                <Text style={[styles.iobBtnText, { color: t.primary }]}>Use {estimatedIOB.toFixed(1)}u est.</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Result */}
                {calculation && (currentBG || carbsEaten) && (
                    <View style={[styles.resultCard, { backgroundColor: t.primary + '08', borderColor: t.primary + '30' }]}>
                        <Text style={[styles.resultTitle, { color: t.primary }]}>RECOMMENDED DOSE</Text>

                        <View style={styles.resultBreakdown}>
                            {calculation.carbDose > 0 && (
                                <View style={styles.resultRow}>
                                    <Text style={[styles.resultLabel, { color: t.textSecondary }]}>Carb coverage ({carbsEaten}g ÷ {carbRatio})</Text>
                                    <Text style={[styles.resultValue, { color: t.text }]}>{calculation.carbDose.toFixed(1)}u</Text>
                                </View>
                            )}
                            {currentBG && (
                                <View style={styles.resultRow}>
                                    <Text style={[styles.resultLabel, { color: t.textSecondary }]}>
                                        Correction ({currentBG} → {targetBG} {glucoseUnit})
                                    </Text>
                                    <Text style={[styles.resultValue, { color: calculation.correctionDose >= 0 ? t.text : '#4CAF50' }]}>
                                        {calculation.correctionDose >= 0 ? '+' : ''}{calculation.correctionDose.toFixed(1)}u
                                    </Text>
                                </View>
                            )}
                            {calculation.iob > 0 && (
                                <View style={styles.resultRow}>
                                    <Text style={[styles.resultLabel, { color: t.textSecondary }]}>Active insulin (IOB)</Text>
                                    <Text style={[styles.resultValue, { color: '#FF9800' }]}>-{calculation.iob.toFixed(1)}u</Text>
                                </View>
                            )}
                        </View>

                        <View style={[styles.totalRow, { borderTopColor: t.border }]}>
                            <Text style={[styles.totalLabel, { color: t.textSecondary }]}>Total Dose</Text>
                            <View style={styles.totalValueContainer}>
                                <Text style={[styles.totalValue, { color: t.primary }]}>{calculation.total}</Text>
                                <Text style={[styles.totalUnit, { color: t.primary }]}>units</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.logBtn, { backgroundColor: t.primary }]} onPress={handleLog}>
                            <MaterialCommunityIcons name="needle" size={20} color="#FFF" />
                            <Text style={styles.logBtnText}>Log This Dose</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Safety Warning */}
                <View style={[styles.warning, { backgroundColor: '#FFF3E0' }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#E65100" />
                    <Text style={styles.warningText}>
                        This calculator is for reference only. Always follow your healthcare provider's prescribed insulin regimen. Never adjust doses without medical guidance.
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
    scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xl, marginBottom: Spacing.sm },
    settingsCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, ...Shadow.light },
    settingsRow: { flexDirection: 'row', gap: 12 },
    calcCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, ...Shadow.light },
    inputGroup: { marginBottom: Spacing.md, flex: 1 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1, paddingHorizontal: 12 },
    input: { flex: 1, fontSize: 18, fontWeight: '600', paddingVertical: 12 },
    inputSuffix: { fontSize: 14, fontWeight: '500', marginLeft: 8 },
    inputHint: { fontSize: 11, marginTop: 4 },
    iobRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    iobBtn: { borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: Spacing.md },
    iobBtnText: { fontSize: 12, fontWeight: '700' },
    resultCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, marginTop: Spacing.lg },
    resultTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: Spacing.md },
    resultBreakdown: { gap: 8 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resultLabel: { fontSize: 13, flex: 1 },
    resultValue: { fontSize: 15, fontWeight: '700' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: Spacing.md, marginTop: Spacing.md },
    totalLabel: { fontSize: 14, fontWeight: '600' },
    totalValueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    totalValue: { fontSize: 36, fontWeight: '800' },
    totalUnit: { fontSize: 16, fontWeight: '600' },
    logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: BorderRadius.xl, paddingVertical: 14, marginTop: Spacing.md },
    logBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    warning: { flexDirection: 'row', borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.xl, gap: 8, alignItems: 'flex-start' },
    warningText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#E65100' },
});
