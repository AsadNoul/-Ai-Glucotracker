import React, { useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore } from '../store';

const { width } = Dimensions.get('window');

export const A1CReportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, targetGlucoseMin, targetGlucoseMax, glucoseUnit } = useSettingsStore();
    const { glucoseLogs } = useLogsStore();
    const t = getThemeColors(theme);

    // ─── Estimated A1C Calculation ──────────────────────────────────
    const estimatedA1C = useMemo(() => {
        if (glucoseLogs.length < 5) return null;
        const avg = glucoseLogs.reduce((s, l) => s + l.glucose_value, 0) / glucoseLogs.length;
        // NGSP formula: eA1C = (avg_glucose + 46.7) / 28.7
        return ((avg + 46.7) / 28.7).toFixed(1);
    }, [glucoseLogs]);

    const avgGlucose = useMemo(() => {
        if (glucoseLogs.length === 0) return null;
        return Math.round(glucoseLogs.reduce((s, l) => s + l.glucose_value, 0) / glucoseLogs.length);
    }, [glucoseLogs]);

    // ─── Time in Range (TIR) ────────────────────────────────────────
    const tirData = useMemo(() => {
        if (glucoseLogs.length === 0) return { inRange: 0, below: 0, above: 0, veryHigh: 0, veryLow: 0 };
        const total = glucoseLogs.length;
        let inRange = 0, below = 0, above = 0, veryHigh = 0, veryLow = 0;
        glucoseLogs.forEach(l => {
            const v = l.glucose_value;
            if (v < 54) veryLow++;
            else if (v < targetGlucoseMin) below++;
            else if (v > 250) veryHigh++;
            else if (v > targetGlucoseMax) above++;
            else inRange++;
        });
        return {
            inRange: Math.round((inRange / total) * 100),
            below: Math.round((below / total) * 100),
            above: Math.round((above / total) * 100),
            veryHigh: Math.round((veryHigh / total) * 100),
            veryLow: Math.round((veryLow / total) * 100),
        };
    }, [glucoseLogs, targetGlucoseMin, targetGlucoseMax]);

    // ─── Weekly Breakdown ───────────────────────────────────────────
    const weeklyData = useMemo(() => {
        const days: { label: string; avg: number | null; count: number; min: number; max: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toDateString();
            const dayLogs = glucoseLogs.filter(l => new Date(l.reading_time).toDateString() === dayStr);
            const label = d.toLocaleDateString([], { weekday: 'short' });
            if (dayLogs.length > 0) {
                const values = dayLogs.map(l => l.glucose_value);
                days.push({
                    label,
                    avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
                    count: values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                });
            } else {
                days.push({ label, avg: null, count: 0, min: 0, max: 0 });
            }
        }
        return days;
    }, [glucoseLogs]);

    // ─── Glucose Variability (CV) ───────────────────────────────────
    const glucoseCV = useMemo(() => {
        if (glucoseLogs.length < 5) return null;
        const values = glucoseLogs.map(l => l.glucose_value);
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
        const sd = Math.sqrt(variance);
        return Math.round((sd / avg) * 100);
    }, [glucoseLogs]);

    // ─── Pattern Detection ──────────────────────────────────────────
    const patterns = useMemo(() => {
        const insights: { emoji: string; title: string; text: string; color: string }[] = [];
        if (glucoseLogs.length < 7) {
            insights.push({ emoji: '📊', title: 'Need More Data', text: 'Log at least 7 readings for pattern detection.', color: t.textSecondary });
            return insights;
        }

        // Dawn phenomenon
        const morningLogs = glucoseLogs.filter(l => {
            const h = new Date(l.reading_time).getHours();
            return h >= 5 && h <= 8;
        });
        if (morningLogs.length > 2) {
            const morningAvg = morningLogs.reduce((s, l) => s + l.glucose_value, 0) / morningLogs.length;
            if (morningAvg > targetGlucoseMax) {
                insights.push({ emoji: '🌅', title: 'Dawn Phenomenon', text: `Morning avg: ${Math.round(morningAvg)} ${glucoseUnit} — above target. Common in diabetes; consider talking to your doctor.`, color: '#FF9800' });
            }
        }

        // Post-meal spikes
        const afterMealLogs = glucoseLogs.filter(l => {
            const h = new Date(l.reading_time).getHours();
            return (h >= 12 && h <= 14) || (h >= 18 && h <= 21);
        });
        if (afterMealLogs.length > 2) {
            const spikes = afterMealLogs.filter(l => l.glucose_value > targetGlucoseMax);
            if (spikes.length > afterMealLogs.length * 0.5) {
                insights.push({ emoji: '📈', title: 'Post-Meal Spikes', text: `${Math.round((spikes.length / afterMealLogs.length) * 100)}% of after-meal readings are above target. Try smaller portions or a walk after eating.`, color: '#FF5252' });
            }
        }

        // Good stability
        if (tirData.inRange >= 70) {
            insights.push({ emoji: '🏆', title: 'Excellent Control!', text: `${tirData.inRange}% time in range — you're meeting the clinical target of ≥70%. Keep it up!`, color: '#4CAF50' });
        }

        // CV warning
        if (glucoseCV && glucoseCV > 36) {
            insights.push({ emoji: '⚡', title: 'High Variability', text: `Glucose CV is ${glucoseCV}% (target: <36%). Large swings increase complications risk.`, color: '#FF5252' });
        } else if (glucoseCV && glucoseCV <= 36) {
            insights.push({ emoji: '✅', title: 'Stable Glucose', text: `CV of ${glucoseCV}% is within the recommended <36% range. Great consistency!`, color: '#4CAF50' });
        }

        if (insights.length === 0) {
            insights.push({ emoji: '📊', title: 'Looking Good', text: 'Keep logging to unlock deeper pattern analysis.', color: t.primary });
        }
        return insights;
    }, [glucoseLogs, targetGlucoseMin, targetGlucoseMax, tirData, glucoseCV]);

    const a1cStatus = useMemo(() => {
        if (!estimatedA1C) return { label: 'N/A', color: t.textTertiary, description: '' };
        const val = parseFloat(estimatedA1C);
        if (val < 5.7) return { label: 'Normal', color: '#4CAF50', description: 'Non-diabetic range' };
        if (val < 6.5) return { label: 'Prediabetes', color: '#FF9800', description: 'Monitor closely' };
        if (val < 7.0) return { label: 'Well Controlled', color: '#2196F3', description: 'ADA target for most adults' };
        if (val < 8.0) return { label: 'Needs Improvement', color: '#FF9800', description: 'Discuss with your doctor' };
        return { label: 'High Risk', color: '#FF5252', description: 'Urgent medical attention needed' };
    }, [estimatedA1C]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>A1C & Glucose Report</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* A1C Card */}
                <View style={[styles.a1cCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={styles.a1cHeader}>
                        <View>
                            <Text style={[styles.a1cLabel, { color: t.textSecondary }]}>ESTIMATED A1C</Text>
                            <Text style={[styles.a1cSubtitle, { color: t.textTertiary }]}>Based on {glucoseLogs.length} readings</Text>
                        </View>
                        <MaterialCommunityIcons name="flask" size={24} color={t.primary} />
                    </View>
                    <View style={styles.a1cValueRow}>
                        <Text style={[styles.a1cValue, { color: a1cStatus.color }]}>
                            {estimatedA1C || '--'}
                        </Text>
                        <Text style={[styles.a1cPercent, { color: a1cStatus.color }]}>%</Text>
                    </View>
                    <View style={[styles.a1cBadge, { backgroundColor: a1cStatus.color + '15' }]}>
                        <View style={[styles.a1cDot, { backgroundColor: a1cStatus.color }]} />
                        <Text style={[styles.a1cBadgeText, { color: a1cStatus.color }]}>{a1cStatus.label}</Text>
                        {a1cStatus.description ? <Text style={[styles.a1cDesc, { color: t.textTertiary }]}> — {a1cStatus.description}</Text> : null}
                    </View>
                    {avgGlucose && (
                        <Text style={[styles.avgText, { color: t.textSecondary }]}>
                            Average Glucose: {avgGlucose} {glucoseUnit}
                        </Text>
                    )}
                </View>

                {/* Time in Range — TIR */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>⏱️ TIME IN RANGE</Text>
                <View style={[styles.tirCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    {/* TIR Bar */}
                    <View style={styles.tirBarContainer}>
                        {tirData.veryLow > 0 && (
                            <View style={[styles.tirSegment, { flex: tirData.veryLow, backgroundColor: '#C62828' }]}>
                                {tirData.veryLow > 8 && <Text style={styles.tirBarText}>{tirData.veryLow}%</Text>}
                            </View>
                        )}
                        {tirData.below > 0 && (
                            <View style={[styles.tirSegment, { flex: tirData.below, backgroundColor: '#F44336' }]}>
                                {tirData.below > 8 && <Text style={styles.tirBarText}>{tirData.below}%</Text>}
                            </View>
                        )}
                        <View style={[styles.tirSegment, { flex: Math.max(tirData.inRange, 1), backgroundColor: '#4CAF50', borderRadius: tirData.below === 0 ? 8 : 0 }]}>
                            <Text style={styles.tirBarText}>{tirData.inRange}%</Text>
                        </View>
                        {tirData.above > 0 && (
                            <View style={[styles.tirSegment, { flex: tirData.above, backgroundColor: '#FF9800' }]}>
                                {tirData.above > 8 && <Text style={styles.tirBarText}>{tirData.above}%</Text>}
                            </View>
                        )}
                        {tirData.veryHigh > 0 && (
                            <View style={[styles.tirSegment, { flex: tirData.veryHigh, backgroundColor: '#E65100' }]}>
                                {tirData.veryHigh > 8 && <Text style={styles.tirBarText}>{tirData.veryHigh}%</Text>}
                            </View>
                        )}
                    </View>

                    {/* TIR Legend */}
                    <View style={styles.tirLegend}>
                        <View style={styles.tirLegendItem}>
                            <View style={[styles.tirLegendDot, { backgroundColor: '#4CAF50' }]} />
                            <Text style={[styles.tirLegendLabel, { color: t.textSecondary }]}>In Range ({targetGlucoseMin}-{targetGlucoseMax})</Text>
                            <Text style={[styles.tirLegendValue, { color: '#4CAF50' }]}>{tirData.inRange}%</Text>
                        </View>
                        <View style={styles.tirLegendItem}>
                            <View style={[styles.tirLegendDot, { backgroundColor: '#F44336' }]} />
                            <Text style={[styles.tirLegendLabel, { color: t.textSecondary }]}>Below Range (&lt;{targetGlucoseMin})</Text>
                            <Text style={[styles.tirLegendValue, { color: '#F44336' }]}>{tirData.below}%</Text>
                        </View>
                        <View style={styles.tirLegendItem}>
                            <View style={[styles.tirLegendDot, { backgroundColor: '#FF9800' }]} />
                            <Text style={[styles.tirLegendLabel, { color: t.textSecondary }]}>Above Range (&gt;{targetGlucoseMax})</Text>
                            <Text style={[styles.tirLegendValue, { color: '#FF9800' }]}>{tirData.above}%</Text>
                        </View>
                        {tirData.veryLow > 0 && (
                            <View style={styles.tirLegendItem}>
                                <View style={[styles.tirLegendDot, { backgroundColor: '#C62828' }]} />
                                <Text style={[styles.tirLegendLabel, { color: t.textSecondary }]}>Very Low (&lt;54)</Text>
                                <Text style={[styles.tirLegendValue, { color: '#C62828' }]}>{tirData.veryLow}%</Text>
                            </View>
                        )}
                        {tirData.veryHigh > 0 && (
                            <View style={styles.tirLegendItem}>
                                <View style={[styles.tirLegendDot, { backgroundColor: '#E65100' }]} />
                                <Text style={[styles.tirLegendLabel, { color: t.textSecondary }]}>Very High (&gt;250)</Text>
                                <Text style={[styles.tirLegendValue, { color: '#E65100' }]}>{tirData.veryHigh}%</Text>
                            </View>
                        )}
                    </View>

                    {/* TIR Target */}
                    <View style={[styles.tirTarget, { backgroundColor: tirData.inRange >= 70 ? '#E8F5E9' : '#FFF3E0' }]}>
                        <Text style={{ color: tirData.inRange >= 70 ? '#2E7D32' : '#E65100', fontWeight: '600', fontSize: 13 }}>
                            {tirData.inRange >= 70 ? '✅ Meeting' : '⚠️ Below'} clinical target (≥70% in range)
                        </Text>
                    </View>
                </View>

                {/* Glucose Variability */}
                {glucoseCV !== null && (
                    <>
                        <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>📊 GLUCOSE VARIABILITY</Text>
                        <View style={[styles.cvCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            <View style={styles.cvRow}>
                                <View>
                                    <Text style={[styles.cvLabel, { color: t.textSecondary }]}>Coefficient of Variation (CV)</Text>
                                    <Text style={[styles.cvTarget, { color: t.textTertiary }]}>Target: &lt;36%</Text>
                                </View>
                                <View style={styles.cvValueContainer}>
                                    <Text style={[styles.cvValue, { color: glucoseCV <= 36 ? '#4CAF50' : '#FF5252' }]}>{glucoseCV}%</Text>
                                    <MaterialCommunityIcons name={glucoseCV <= 36 ? 'check-circle' : 'alert-circle'} size={20} color={glucoseCV <= 36 ? '#4CAF50' : '#FF5252'} />
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Weekly Chart */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>📅 7-DAY OVERVIEW</Text>
                <View style={[styles.chartCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={styles.chartGrid}>
                        {weeklyData.map((day, i) => (
                            <View key={i} style={styles.chartDay}>
                                <View style={styles.chartBarContainer}>
                                    {day.avg !== null ? (
                                        <>
                                            <View style={[
                                                styles.chartBar,
                                                {
                                                    height: Math.max(20, (day.avg / 300) * 120),
                                                    backgroundColor: day.avg >= targetGlucoseMin && day.avg <= targetGlucoseMax ? '#4CAF50' : day.avg > targetGlucoseMax ? '#FF9800' : '#F44336',
                                                }
                                            ]} />
                                            <Text style={[styles.chartValue, { color: t.text }]}>{day.avg}</Text>
                                        </>
                                    ) : (
                                        <View style={[styles.chartBar, { height: 20, backgroundColor: t.glass }]} />
                                    )}
                                </View>
                                <Text style={[styles.chartLabel, { color: i === 6 ? t.primary : t.textTertiary }]}>{day.label}</Text>
                                <Text style={[styles.chartCount, { color: t.textTertiary }]}>{day.count > 0 ? `${day.count}r` : '-'}</Text>
                            </View>
                        ))}
                    </View>
                    {/* Target Range Band */}
                    <View style={styles.rangeLabels}>
                        <Text style={[styles.rangeText, { color: '#4CAF50' }]}>■ In Range</Text>
                        <Text style={[styles.rangeText, { color: '#FF9800' }]}>■ Above</Text>
                        <Text style={[styles.rangeText, { color: '#F44336' }]}>■ Below</Text>
                    </View>
                </View>

                {/* AI Pattern Insights */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>🤖 AI PATTERN INSIGHTS</Text>
                {patterns.map((p, i) => (
                    <View key={i} style={[styles.insightCard, { backgroundColor: p.color + '10', borderColor: p.color + '30' }]}>
                        <Text style={styles.insightEmoji}>{p.emoji}</Text>
                        <View style={styles.insightContent}>
                            <Text style={[styles.insightTitle, { color: p.color }]}>{p.title}</Text>
                            <Text style={[styles.insightText, { color: t.textSecondary }]}>{p.text}</Text>
                        </View>
                    </View>
                ))}

                {/* Medical Disclaimer */}
                <View style={[styles.disclaimer, { backgroundColor: t.glass }]}>
                    <MaterialCommunityIcons name="information" size={16} color={t.textTertiary} />
                    <Text style={[styles.disclaimerText, { color: t.textTertiary }]}>
                        Estimated A1C is based on average glucose readings and may differ from lab results. Always consult your healthcare provider for clinical decisions.
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
    // A1C
    a1cCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, ...Shadow.light },
    a1cHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    a1cLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    a1cSubtitle: { fontSize: 12, marginTop: 2 },
    a1cValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.md },
    a1cValue: { fontSize: 64, fontWeight: '800' },
    a1cPercent: { fontSize: 28, fontWeight: '600', marginLeft: 4 },
    a1cBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginTop: Spacing.sm, alignSelf: 'flex-start' },
    a1cDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    a1cBadgeText: { fontSize: 14, fontWeight: '700' },
    a1cDesc: { fontSize: 12 },
    avgText: { fontSize: 13, marginTop: Spacing.md },
    // TIR
    tirCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, ...Shadow.light },
    tirBarContainer: { flexDirection: 'row', height: 32, borderRadius: 8, overflow: 'hidden', marginBottom: Spacing.lg },
    tirSegment: { justifyContent: 'center', alignItems: 'center' },
    tirBarText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    tirLegend: { gap: 8 },
    tirLegendItem: { flexDirection: 'row', alignItems: 'center' },
    tirLegendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    tirLegendLabel: { flex: 1, fontSize: 13 },
    tirLegendValue: { fontSize: 14, fontWeight: '700' },
    tirTarget: { borderRadius: 8, padding: 10, marginTop: Spacing.md, alignItems: 'center' },
    // CV
    cvCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, ...Shadow.light },
    cvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cvLabel: { fontSize: 14, fontWeight: '600' },
    cvTarget: { fontSize: 12, marginTop: 2 },
    cvValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cvValue: { fontSize: 28, fontWeight: '800' },
    // Chart
    chartCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, ...Shadow.light },
    chartGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    chartDay: { alignItems: 'center', flex: 1 },
    chartBarContainer: { height: 140, justifyContent: 'flex-end', alignItems: 'center' },
    chartBar: { width: 24, borderRadius: 6 },
    chartValue: { fontSize: 10, fontWeight: '700', marginTop: 4 },
    chartLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    chartCount: { fontSize: 9 },
    rangeLabels: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: Spacing.md },
    rangeText: { fontSize: 11, fontWeight: '600' },
    // Insights
    insightCard: { flexDirection: 'row', borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm, gap: 12, alignItems: 'flex-start' },
    insightEmoji: { fontSize: 24, marginTop: 2 },
    insightContent: { flex: 1 },
    insightTitle: { fontSize: 15, fontWeight: '700' },
    insightText: { fontSize: 13, lineHeight: 19, marginTop: 4 },
    // Disclaimer
    disclaimer: { flexDirection: 'row', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.xl, gap: 8, alignItems: 'flex-start' },
    disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
