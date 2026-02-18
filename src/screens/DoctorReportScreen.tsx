import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';

import { useSettingsStore, useLogsStore, useMedicationStore, useActivityStore, useMoodStore } from '../store';

export const DoctorReportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, glucoseUnit, targetGlucoseMin, targetGlucoseMax } = useSettingsStore();
    const { glucoseLogs, carbLogs, insulinLogs } = useLogsStore();
    const { medications, medicationLogs } = useMedicationStore();
    const { activityLogs } = useActivityStore();
    const { moodEntries } = useMoodStore();
    const t = getThemeColors(theme);

    const [reportPeriod, setReportPeriod] = useState<7 | 14 | 30 | 90>(30);
    const [generating, setGenerating] = useState(false);

    // Filter data by period
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - reportPeriod);
    const cutoffStr = cutoff.toISOString();

    const filteredGlucose = useMemo(() => glucoseLogs.filter(l => l.reading_time >= cutoffStr), [glucoseLogs, cutoffStr]);
    const filteredCarbs = useMemo(() => carbLogs.filter(l => l.created_at >= cutoffStr), [carbLogs, cutoffStr]);
    const filteredInsulin = useMemo(() => insulinLogs.filter(l => (l.timestamp || l.created_at) >= cutoffStr), [insulinLogs, cutoffStr]);

    const filteredMedLogs = useMemo(() => medicationLogs.filter(l => l.takenAt >= cutoffStr), [medicationLogs, cutoffStr]);
    const filteredActivity = useMemo(() => activityLogs.filter(l => l.createdAt >= cutoffStr), [activityLogs, cutoffStr]);

    // Stats
    const glucoseStats = useMemo(() => {
        if (filteredGlucose.length === 0) return null;
        const values = filteredGlucose.map(l => l.glucose_value);
        const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const inRange = values.filter(v => v >= targetGlucoseMin && v <= targetGlucoseMax).length;
        const tir = Math.round((inRange / values.length) * 100);
        const eA1C = ((avg + 46.7) / 28.7).toFixed(1);
        return { avg, min, max, tir, count: values.length, eA1C };
    }, [filteredGlucose, targetGlucoseMin, targetGlucoseMax]);

    // Generate text report
    const generateReportText = () => {
        const now = new Date();
        const fromDate = new Date(cutoff).toLocaleDateString();
        const toDate = now.toLocaleDateString();

        let report = `══════════════════════════════════════════\n`;
        report += `       GLUCOTRACK AI — PATIENT REPORT\n`;
        report += `══════════════════════════════════════════\n\n`;
        report += `📅 Report Period: ${fromDate} – ${toDate} (${reportPeriod} days)\n`;
        report += `📋 Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}\n\n`;

        report += `── GLUCOSE SUMMARY ──────────────────────\n`;
        if (glucoseStats) {
            report += `  Total Readings:     ${glucoseStats.count}\n`;
            report += `  Average Glucose:    ${glucoseStats.avg} ${glucoseUnit}\n`;
            report += `  Estimated A1C:      ${glucoseStats.eA1C}%\n`;
            report += `  Time in Range:      ${glucoseStats.tir}% (${targetGlucoseMin}-${targetGlucoseMax} ${glucoseUnit})\n`;
            report += `  Lowest Reading:     ${glucoseStats.min} ${glucoseUnit}\n`;
            report += `  Highest Reading:    ${glucoseStats.max} ${glucoseUnit}\n`;
        } else {
            report += `  No glucose readings in this period.\n`;
        }

        report += `\n── MEAL & CARB LOG ──────────────────────\n`;
        report += `  Total Meals Logged: ${filteredCarbs.length}\n`;
        if (filteredCarbs.length > 0) {
            const totalCarbs = filteredCarbs.reduce((s, l) => s + l.estimated_carbs, 0);
            const avgCarbs = Math.round(totalCarbs / filteredCarbs.length);
            report += `  Total Carbs:        ${totalCarbs}g\n`;
            report += `  Avg Carbs/Meal:     ${avgCarbs}g\n`;
        }

        report += `\n── INSULIN LOG ─────────────────────────\n`;
        report += `  Total Doses:        ${filteredInsulin.length}\n`;
        if (filteredInsulin.length > 0) {
            const totalUnits = filteredInsulin.reduce((s, l) => s + l.units, 0);
            report += `  Total Units:        ${totalUnits}u\n`;
            report += `  Avg Units/Dose:     ${(totalUnits / filteredInsulin.length).toFixed(1)}u\n`;
        }

        report += `\n── MEDICATIONS ─────────────────────────\n`;
        report += `  Active Medications: ${medications.filter(m => m.active).length}\n`;
        medications.filter(m => m.active).forEach(m => {
            report += `    • ${m.name} — ${m.dosage} (${m.frequency})\n`;
        });
        report += `  Doses Logged:       ${filteredMedLogs.length}\n`;

        report += `\n── ACTIVITY ────────────────────────────\n`;
        report += `  Sessions Logged:    ${filteredActivity.length}\n`;
        if (filteredActivity.length > 0) {
            const totalMin = filteredActivity.reduce((s, l) => s + l.duration, 0);
            const totalCal = filteredActivity.reduce((s, l) => s + l.caloriesBurned, 0);
            report += `  Total Minutes:      ${totalMin}\n`;
            report += `  Total Calories:     ${totalCal}\n`;
        }

        report += `\n── MOOD & WELLNESS ─────────────────────\n`;
        const filteredMood = moodEntries.filter((e: any) => e.createdAt >= cutoffStr);
        report += `  Check-ins:          ${filteredMood.length}\n`;

        report += `\n══════════════════════════════════════════\n`;
        report += `  Generated by GlucoTrack AI\n`;
        report += `  This report is for informational purposes only.\n`;
        report += `  Always consult your healthcare provider.\n`;
        report += `══════════════════════════════════════════\n`;

        return report;
    };

    const handleShare = async () => {

        try {
            const report = generateReportText();
            await Share.share({
                message: report,
                title: `GlucoTrack AI Report — ${reportPeriod} Days`,
            });
        } catch (e: any) {
            Alert.alert('Error', 'Failed to share report.');
        }
    };


    const handleCopy = () => {
        Alert.alert('📋 Report Generated', 'Report text has been generated. Use the Share button to send it to your doctor via email, WhatsApp, or any messaging app.');
    };


    const periods: { value: 7 | 14 | 30 | 90; label: string }[] = [
        { value: 7, label: '7 Days' },
        { value: 14, label: '14 Days' },
        { value: 30, label: '30 Days' },
        { value: 90, label: '90 Days' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Doctor Report</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Icon */}
                <View style={[styles.reportIcon, { backgroundColor: t.primary + '10' }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={48} color={t.primary} />
                </View>
                <Text style={[styles.reportTitle, { color: t.text }]}>Share with Your Doctor</Text>
                <Text style={[styles.reportSubtitle, { color: t.textSecondary }]}>
                    Generate a comprehensive report of your glucose, meals, medications, and activity data.
                </Text>

                {/* Period Selector */}
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>REPORT PERIOD</Text>
                <View style={styles.periodRow}>
                    {periods.map(p => (
                        <TouchableOpacity
                            key={p.value}
                            style={[styles.periodChip, { backgroundColor: reportPeriod === p.value ? t.primary : t.card, borderColor: reportPeriod === p.value ? t.primary : t.border }]}
                            onPress={() => setReportPeriod(p.value)}
                        >
                            <Text style={[styles.periodText, { color: reportPeriod === p.value ? '#FFF' : t.textSecondary }]}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Preview Summary */}
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>REPORT PREVIEW</Text>
                <View style={[styles.previewCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <StatRow icon="water" label="Glucose Readings" value={`${filteredGlucose.length}`} color="#2196F3" theme={t} />
                    {glucoseStats && (
                        <>
                            <StatRow icon="analytics" label="Average Glucose" value={`${glucoseStats.avg} ${glucoseUnit}`} color="#4CAF50" theme={t} />
                            <StatRow icon="flask" label="Estimated A1C" value={`${glucoseStats.eA1C}%`} color="#FF9800" theme={t} />
                            <StatRow icon="timer" label="Time in Range" value={`${glucoseStats.tir}%`} color="#4CAF50" theme={t} />
                        </>
                    )}
                    <StatRow icon="restaurant" label="Meals Logged" value={`${filteredCarbs.length}`} color="#E91E63" theme={t} />
                    <StatRow icon="fitness" label="Activity Sessions" value={`${filteredActivity.length}`} color="#9C27B0" theme={t} />
                    <StatRow icon="medkit" label="Medication Doses" value={`${filteredMedLogs.length}`} color="#00BCD4" theme={t} />
                </View>

                {/* Share Buttons */}
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: t.primary }]} onPress={handleShare}>
                    <Ionicons name="share-outline" size={22} color="#FFF" />
                    <Text style={styles.shareBtnText}>Share Report</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.previewBtn, { backgroundColor: t.card, borderColor: t.border }]} onPress={handleCopy}>
                    <MaterialCommunityIcons name="eye-outline" size={22} color={t.text} />
                    <Text style={[styles.previewBtnText, { color: t.text }]}>Preview Report</Text>
                </TouchableOpacity>

                <View style={[styles.securityNote, { backgroundColor: t.glass }]}>
                    <Ionicons name="lock-closed" size={14} color={t.textTertiary} />
                    <Text style={[styles.securityText, { color: t.textTertiary }]}>
                        Your data never leaves your device. Reports are generated locally and shared only when you choose.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const StatRow = ({ icon, label, value, color, theme }: any) => (
    <View style={sr.row}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[sr.label, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[sr.value, { color: theme.text }]}>{value}</Text>
    </View>
);
const sr = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
    label: { flex: 1, fontSize: 14 },
    value: { fontSize: 15, fontWeight: '700' },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
    reportIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: Spacing.md },
    reportTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: Spacing.md },
    reportSubtitle: { fontSize: 14, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20, paddingHorizontal: Spacing.lg },
    sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xl, marginBottom: Spacing.sm },
    periodRow: { flexDirection: 'row', gap: 8 },
    periodChip: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center' },
    periodText: { fontSize: 13, fontWeight: '600' },
    previewCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, ...Shadow.light },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: BorderRadius.xl, paddingVertical: 16, marginTop: Spacing.xl },
    shareBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: BorderRadius.xl, paddingVertical: 16, marginTop: Spacing.sm, borderWidth: 1 },
    previewBtnText: { fontSize: 16, fontWeight: '600' },
    securityNote: { flexDirection: 'row', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.lg, gap: 8, alignItems: 'center' },
    securityText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
