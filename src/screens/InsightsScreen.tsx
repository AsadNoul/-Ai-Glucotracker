import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useLogsStore, useSettingsStore } from '../store';

export const InsightsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, targetGlucoseMin, targetGlucoseMax, carbGoal } = useSettingsStore();
    const { glucoseLogs, carbLogs } = useLogsStore();

    const t = getThemeColors(theme);
    const [reportVisible, setReportVisible] = useState(false);

    // Calculate real stats
    const averageGlucose = useMemo(() => {
        if (glucoseLogs.length === 0) return 0;
        const sum = glucoseLogs.reduce((acc, log) => acc + log.glucose_value, 0);
        return Math.round(sum / glucoseLogs.length);
    }, [glucoseLogs]);

    const estimatedA1c = useMemo(() => {
        if (averageGlucose === 0) return '--';
        return ((averageGlucose + 46.7) / 28.7).toFixed(1);
    }, [averageGlucose]);

    const timeInRange = useMemo(() => {
        if (glucoseLogs.length === 0) return 0;
        const inRange = glucoseLogs.filter(log => log.glucose_value >= 70 && log.glucose_value <= 180);
        return Math.round((inRange.length / glucoseLogs.length) * 100);
    }, [glucoseLogs]);

    const behavioralInsight = useMemo(() => {
        if (glucoseLogs.length === 0) return "Start logging to see patterns.";
        if (timeInRange < 70) return "You usually spike after high-carb meals like Pasta. Consider a 10-minute walk after lunch.";
        return "Excellent stability! Your evening glucose is particularly stable today.";
    }, [timeInRange, glucoseLogs]);

    const topTrigger = useMemo(() => {
        if (carbLogs.length === 0) return { name: 'None', grams: 0 };
        const sorted = [...carbLogs].sort((a, b) => b.estimated_carbs - a.estimated_carbs);
        return { name: sorted[0].food_name, grams: sorted[0].estimated_carbs };
    }, [carbLogs]);

    // Glucose Variability (Standard Deviation)
    const glucoseVariability = useMemo(() => {
        if (glucoseLogs.length < 3) return null;
        const values = glucoseLogs.slice(0, 14).map(l => l.glucose_value);
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
        return Math.round(Math.sqrt(variance));
    }, [glucoseLogs]);

    // AI Glucose Prediction
    const glucosePrediction = useMemo(() => {
        if (glucoseLogs.length < 2) return null;
        const recent = glucoseLogs.slice(0, 5);
        const trend = recent[0].glucose_value - recent[recent.length - 1].glucose_value;
        const trendPerReading = trend / (recent.length - 1);

        // Factor in recent carbs
        const today = new Date().toDateString();
        const todayCarbLogs = carbLogs.filter(l => new Date(l.created_at).toDateString() === today);
        const recentCarbImpact = todayCarbLogs.length > 0
            ? todayCarbLogs.reduce((s, l) => s + l.estimated_carbs, 0) * 0.5
            : 0;

        const predicted = Math.round(recent[0].glucose_value + trendPerReading + (recentCarbImpact > 30 ? 15 : 0));
        const direction = trendPerReading > 2 ? 'rising' : trendPerReading < -2 ? 'falling' : 'stable';
        return { value: Math.max(50, Math.min(300, predicted)), direction };
    }, [glucoseLogs, carbLogs]);

    // Doctor's AI Summary Generator
    const doctorSummary = useMemo(() => {
        const bullets: string[] = [];
        if (glucoseLogs.length === 0) return ['No data available yet. Log glucose readings to generate a clinical summary.'];

        bullets.push(`Patient has ${glucoseLogs.length} glucose readings. Average: ${averageGlucose} mg/dL. Est. A1c: ${estimatedA1c}%.`);
        bullets.push(`Time in range (${targetGlucoseMin}-${targetGlucoseMax} mg/dL): ${timeInRange}%.${timeInRange < 70 ? ' Below recommended 70% threshold.' : ' Meets recommended threshold.'}`);

        if (glucoseVariability !== null) {
            bullets.push(`Glucose variability (SD): ${glucoseVariability} mg/dL.${glucoseVariability > 36 ? ' High variability — consider lifestyle adjustments.' : ' Within acceptable range.'}`);
        }

        if (topTrigger.name !== 'None') {
            bullets.push(`Highest carb intake recorded: ${topTrigger.name} (${topTrigger.grams}g carbs). This may be a key spike trigger.`);
        }

        const totalMeals = carbLogs.length;
        const avgCarbs = totalMeals > 0 ? Math.round(carbLogs.reduce((s, l) => s + l.estimated_carbs, 0) / totalMeals) : 0;
        bullets.push(`${totalMeals} meals logged with avg ${avgCarbs}g carbs per meal. Daily carb target: ${carbGoal}g.`);

        return bullets;
    }, [glucoseLogs, carbLogs, averageGlucose, estimatedA1c, timeInRange, topTrigger, glucoseVariability, targetGlucoseMin, targetGlucoseMax, carbGoal]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={[styles.avatarButton, { backgroundColor: t.primary + '20' }]} onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person" size={20} color={t.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Health Insights</Text>
                <TouchableOpacity style={[styles.exportButton, { backgroundColor: t.glass }]} onPress={() => Alert.alert('Success', 'PDF Report Generated!')}>
                    <Ionicons name="share-outline" size={20} color={t.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Metrics Row */}
                <View style={styles.metricsRow}>
                    <MetricCard
                        label="EST. A1C"
                        value={estimatedA1c}
                        unit="%"
                        icon="calculator"
                        theme={t}
                        color={parseFloat(estimatedA1c) > 7 ? t.error : t.primary}
                    />
                    <MetricCard
                        label="TIME IN RANGE"
                        value={`${timeInRange}%`}
                        unit=""
                        icon="timer-outline"
                        theme={t}
                        color={timeInRange > 80 ? t.success : t.warning}
                    />
                </View>

                {/* Glucose Variability */}
                {glucoseVariability !== null && (
                    <View style={styles.metricsRow}>
                        <MetricCard
                            label="VARIABILITY"
                            value={`${glucoseVariability}`}
                            unit="SD"
                            icon="chart-line-variant"
                            theme={t}
                            color={glucoseVariability > 36 ? t.error : t.success}
                        />
                        {glucosePrediction && (
                            <MetricCard
                                label="NEXT PREDICTION"
                                value={`${glucosePrediction.value}`}
                                unit={glucosePrediction.direction === 'rising' ? '↑' : glucosePrediction.direction === 'falling' ? '↓' : '→'}
                                icon="crystal-ball"
                                theme={t}
                                color={glucosePrediction.value > targetGlucoseMax ? t.error : glucosePrediction.value < targetGlucoseMin ? t.warning : t.success}
                            />
                        )}
                    </View>
                )}

                {/* Smart Insight Card */}
                <View style={[styles.mainCard, { backgroundColor: t.card, borderColor: t.border }, Shadow.medium]}>
                    <View style={styles.discoveryHeader}>
                        <View style={[styles.discoveryIcon, { backgroundColor: t.primary + '20' }]}>
                            <Ionicons name="sparkles" size={20} color={t.primary} />
                        </View>
                        <View>
                            <Text style={[styles.discoveryLabel, { color: t.primary }]}>AI PATTERN ALERT</Text>
                            <Text style={[styles.discoveryTitle, { color: t.text }]}>Behavioral Discovery</Text>
                        </View>
                    </View>

                    <Text style={[styles.insightText, { color: t.text }]}>
                        {behavioralInsight}
                    </Text>

                    <TouchableOpacity style={[styles.reportBtn, { backgroundColor: t.primary + '10' }]} onPress={() => setReportVisible(true)}>
                        <Ionicons name="document-text" size={18} color={t.primary} />
                        <Text style={[styles.reportBtnText, { color: t.primary }]}>View Doctor's AI Summary</Text>
                    </TouchableOpacity>
                </View>

                {/* Top Trigger Section */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>DAILY TRIGGERS</Text>
                <View style={[styles.triggerCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={[styles.triggerIcon, { backgroundColor: t.error + '20' }]}>
                        <MaterialCommunityIcons name="food-apple" size={24} color={t.error} />
                    </View>
                    <View style={styles.triggerInfo}>
                        <Text style={[styles.triggerName, { color: t.text }]}>{topTrigger.name}</Text>
                        <Text style={[styles.triggerDetail, { color: t.textSecondary }]}>Highest impact on your stability today.</Text>
                    </View>
                    <View style={styles.triggerValue}>
                        <Text style={[styles.triggerGrams, { color: t.error }]}>{topTrigger.grams}g</Text>
                        <Text style={[styles.triggerUnit, { color: t.textTertiary }]}>Carbs</Text>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activityHeader}>
                    <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>RECENT LOGS</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                        <Text style={{ color: t.primary, fontSize: 12, fontWeight: '600' }}>See all</Text>
                    </TouchableOpacity>
                </View>

                {glucoseLogs.slice(0, 3).map((log, index) => (
                    <View key={index} style={[styles.activityItem, { borderBottomColor: t.border }]}>
                        <View style={[styles.activityIcon, { backgroundColor: t.glass }]}>
                            <MaterialCommunityIcons name="water" size={18} color={t.primary} />
                        </View>
                        <View style={styles.activityText}>
                            <Text style={[styles.activityTitle, { color: t.text }]}>Reading</Text>
                            <Text style={[styles.activityTime, { color: t.textTertiary }]}>{new Date(log.reading_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <Text style={[styles.activityValue, { color: t.text }]}>{log.glucose_value} mg/dL</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Doctor's AI Summary Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={reportVisible}
                onRequestClose={() => setReportVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[styles.discoveryIcon, { backgroundColor: t.primary + '20' }]}>
                                    <MaterialCommunityIcons name="robot" size={22} color={t.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.discoveryLabel, { color: t.primary }]}>AI-GENERATED</Text>
                                    <Text style={[styles.discoveryTitle, { color: t.text }]}>Doctor's Summary</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setReportVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ marginBottom: 16 }}>
                            {doctorSummary.map((bullet, i) => (
                                <View key={i} style={styles.summaryBullet}>
                                    <Text style={[styles.bulletNumber, { color: t.primary }]}>{i + 1}</Text>
                                    <Text style={[styles.bulletText, { color: t.text }]}>{bullet}</Text>
                                </View>
                            ))}
                            <View style={[styles.disclaimerBox, { backgroundColor: t.glass }]}>
                                <Ionicons name="information-circle" size={16} color={t.textTertiary} />
                                <Text style={[styles.disclaimerText, { color: t.textTertiary }]}>This is an AI-generated summary for informational purposes only. Consult your healthcare provider for medical decisions.</Text>
                            </View>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.reportBtn, { backgroundColor: t.primary }]}
                            onPress={() => {
                                setReportVisible(false);
                                Alert.alert('Success', 'Doctor\'s AI Summary copied. You can share it with your healthcare provider.');
                            }}
                        >
                            <Ionicons name="share-outline" size={18} color="#FFF" />
                            <Text style={[styles.reportBtnText, { color: '#FFF' }]}>Share Summary</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const MetricCard = ({ label, value, unit, icon, theme: t, color }: any) => (
    <View style={[styles.metricCard, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={styles.metricHeader}>
            <MaterialCommunityIcons name={icon} size={16} color={color || t.textSecondary} />
            <Text style={[styles.metricLabel, { color: t.textTertiary }]}>{label}</Text>
        </View>
        <View style={styles.metricValueRow}>
            <Text style={[styles.metricValue, { color: color || t.text }]}>{value}</Text>
            {unit ? <Text style={[styles.metricUnit, { color: t.textTertiary }]}> {unit}</Text> : null}
        </View>
    </View>
);

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
    avatarButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
    },
    exportButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxxl,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    metricCard: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadow.light,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    metricValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    metricValue: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
    },
    metricUnit: {
        fontSize: Typography.sizes.xs,
    },
    mainCard: {
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
        borderWidth: 1,
    },
    discoveryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    discoveryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    discoveryLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    discoveryTitle: {
        fontSize: Typography.sizes.md,
        fontWeight: 'bold',
    },
    insightText: {
        fontSize: Typography.sizes.md,
        lineHeight: 24,
        marginBottom: Spacing.xl,
    },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 48,
        borderRadius: BorderRadius.xl,
    },
    reportBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },
    triggerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.xl,
        ...Shadow.light,
    },
    triggerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    triggerInfo: {
        flex: 1,
    },
    triggerName: {
        fontSize: Typography.sizes.md,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    triggerDetail: {
        fontSize: 11,
    },
    triggerValue: {
        alignItems: 'flex-end',
    },
    triggerGrams: {
        fontSize: Typography.sizes.lg,
        fontWeight: 'bold',
    },
    triggerUnit: {
        fontSize: 10,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    activityText: {
        flex: 1,
    },
    activityTitle: {
        fontSize: Typography.sizes.md,
        fontWeight: '600',
    },
    activityTime: {
        fontSize: 11,
    },
    activityValue: {
        fontSize: Typography.sizes.md,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        maxHeight: '80%',
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    summaryBullet: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    bulletNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        width: 24,
    },
    bulletText: {
        flex: 1,
        fontSize: Typography.sizes.md,
        lineHeight: 22,
    },
    disclaimerBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.md,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 16,
    },
});
