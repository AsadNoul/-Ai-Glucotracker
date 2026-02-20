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
import { CartesianChart, Line, Area } from "victory-native";

type TimePeriod = 7 | 14 | 30 | 90;

export const InsightsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, targetGlucoseMin, targetGlucoseMax, carbGoal, glucoseUnit } = useSettingsStore();
    const { glucoseLogs, carbLogs } = useLogsStore();

    const t = getThemeColors(theme);
    const [reportVisible, setReportVisible] = useState(false);
    const [period, setPeriod] = useState<TimePeriod>(14);

    // ─── Filter logs by period ──────────────────────────────────────────────
    const filteredGlucose = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - period);
        return glucoseLogs.filter(l => new Date(l.reading_time) >= cutoff);
    }, [glucoseLogs, period]);

    const filteredCarbs = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - period);
        return carbLogs.filter(l => new Date(l.created_at) >= cutoff);
    }, [carbLogs, period]);

    // ─── Core Stats ─────────────────────────────────────────────────────────
    const averageGlucose = useMemo(() => {
        if (filteredGlucose.length === 0) return 0;
        return Math.round(filteredGlucose.reduce((s, l) => s + l.glucose_value, 0) / filteredGlucose.length);
    }, [filteredGlucose]);

    const estimatedA1c = useMemo(() => {
        if (averageGlucose === 0) return '--';
        return ((averageGlucose + 46.7) / 28.7).toFixed(1);
    }, [averageGlucose]);

    // ─── Time In Range Breakdown ────────────────────────────────────────────
    const rangeBreakdown = useMemo(() => {
        if (filteredGlucose.length === 0) return { low: 0, inRange: 0, high: 0, veryHigh: 0 };
        const low = filteredGlucose.filter(l => l.glucose_value < targetGlucoseMin).length;
        const high = filteredGlucose.filter(l => l.glucose_value > targetGlucoseMax && l.glucose_value <= 250).length;
        const veryHigh = filteredGlucose.filter(l => l.glucose_value > 250).length;
        const inRange = filteredGlucose.length - low - high - veryHigh;
        const total = filteredGlucose.length;
        return {
            low: Math.round((low / total) * 100),
            inRange: Math.round((inRange / total) * 100),
            high: Math.round((high / total) * 100),
            veryHigh: Math.round((veryHigh / total) * 100),
        };
    }, [filteredGlucose, targetGlucoseMin, targetGlucoseMax]);

    // ─── Min / Max / Variability ────────────────────────────────────────────
    const glucoseStats = useMemo(() => {
        if (filteredGlucose.length === 0) return { min: 0, max: 0, sd: 0 };
        const values = filteredGlucose.map(l => l.glucose_value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
        return { min, max, sd: Math.round(Math.sqrt(variance)) };
    }, [filteredGlucose]);

    // ─── Average by Time of Day ─────────────────────────────────────────────
    const timeOfDayAvg = useMemo(() => {
        const buckets: { [key: string]: number[] } = {
            'Morning': [], 'Afternoon': [], 'Evening': [], 'Night': []
        };
        filteredGlucose.forEach(l => {
            const h = new Date(l.reading_time).getHours();
            if (h >= 5 && h < 12) buckets['Morning'].push(l.glucose_value);
            else if (h >= 12 && h < 17) buckets['Afternoon'].push(l.glucose_value);
            else if (h >= 17 && h < 21) buckets['Evening'].push(l.glucose_value);
            else buckets['Night'].push(l.glucose_value);
        });
        return Object.entries(buckets).map(([name, vals]) => ({
            name,
            avg: vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null,
            count: vals.length,
            emoji: name === 'Morning' ? '🌅' : name === 'Afternoon' ? '☀️' : name === 'Evening' ? '🌆' : '🌙',
        }));
    }, [filteredGlucose]);

    // ─── Weekly Comparison ──────────────────────────────────────────────────
    const weeklyComparison = useMemo(() => {
        if (glucoseLogs.length < 2) return null;
        const now = new Date();
        const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7);
        const lastWeekStart = new Date(now); lastWeekStart.setDate(now.getDate() - 14);

        const thisWeek = glucoseLogs.filter(l => {
            const d = new Date(l.reading_time);
            return d >= thisWeekStart;
        });
        const lastWeek = glucoseLogs.filter(l => {
            const d = new Date(l.reading_time);
            return d >= lastWeekStart && d < thisWeekStart;
        });

        if (thisWeek.length === 0 || lastWeek.length === 0) return null;
        const thisAvg = Math.round(thisWeek.reduce((s, l) => s + l.glucose_value, 0) / thisWeek.length);
        const lastAvg = Math.round(lastWeek.reduce((s, l) => s + l.glucose_value, 0) / lastWeek.length);
        const diff = thisAvg - lastAvg;
        return { thisAvg, lastAvg, diff, improved: diff < 0 };
    }, [glucoseLogs]);

    // ─── Meal Pattern Analysis ──────────────────────────────────────────────
    const mealPatterns = useMemo(() => {
        if (filteredCarbs.length === 0) return [];
        const foodMap: { [key: string]: { totalCarbs: number; count: number } } = {};
        filteredCarbs.forEach(l => {
            const key = l.food_name.toLowerCase();
            if (!foodMap[key]) foodMap[key] = { totalCarbs: 0, count: 0 };
            foodMap[key].totalCarbs += l.estimated_carbs;
            foodMap[key].count++;
        });
        return Object.entries(foodMap)
            .map(([name, data]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                avgCarbs: Math.round(data.totalCarbs / data.count),
                frequency: data.count,
            }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);
    }, [filteredCarbs]);

    // ─── Top Trigger ────────────────────────────────────────────────────────
    const topTrigger = useMemo(() => {
        if (filteredCarbs.length === 0) return { name: 'None', grams: 0 };
        const sorted = [...filteredCarbs].sort((a, b) => b.estimated_carbs - a.estimated_carbs);
        return { name: sorted[0].food_name, grams: sorted[0].estimated_carbs };
    }, [filteredCarbs]);

    // ─── Daily Carb Average ─────────────────────────────────────────────────
    const dailyCarbAvg = useMemo(() => {
        if (filteredCarbs.length === 0) return 0;
        const totalCarbs = filteredCarbs.reduce((s, l) => s + l.estimated_carbs, 0);
        const days = new Set(filteredCarbs.map(l => new Date(l.created_at).toDateString())).size;
        return days > 0 ? Math.round(totalCarbs / days) : 0;
    }, [filteredCarbs]);

    // ─── AI Behavioral Insight ──────────────────────────────────────────────
    const behavioralInsight = useMemo(() => {
        if (filteredGlucose.length === 0) return { emoji: '👋', text: 'Start logging glucose readings to unlock personalized AI patterns and insights.', color: 'primary' };

        // Check evening stability
        const eveningLogs = filteredGlucose.filter(l => {
            const h = new Date(l.reading_time).getHours();
            return h >= 17 && h < 22;
        });
        const eveningAvg = eveningLogs.length > 0
            ? eveningLogs.reduce((s, l) => s + l.glucose_value, 0) / eveningLogs.length
            : null;

        // Check post-meal patterns
        const highCarbMeals = filteredCarbs.filter(l => l.estimated_carbs > 40);

        if (rangeBreakdown.inRange >= 80) {
            return { emoji: '🌟', text: `Excellent glucose control! ${rangeBreakdown.inRange}% time in range over the last ${period} days. Keep up your current routine.`, color: 'success' };
        }
        if (rangeBreakdown.high > 30) {
            if (highCarbMeals.length > 0) {
                return { emoji: '🍝', text: `${rangeBreakdown.high}% of readings are high. High-carb meals (${highCarbMeals.length} meals >40g) may be a factor. Try pairing with protein or fiber.`, color: 'warning' };
            }
            return { emoji: '📈', text: `${rangeBreakdown.high}% of readings are above target. Consider reviewing meal timing and carb intake with your care team.`, color: 'warning' };
        }
        if (rangeBreakdown.low > 15) {
            return { emoji: '⚠️', text: `${rangeBreakdown.low}% of readings are below ${targetGlucoseMin}. Watch for symptoms of hypoglycemia. Consider adjusting medication timing.`, color: 'error' };
        }
        if (eveningAvg && eveningAvg > targetGlucoseMax) {
            return { emoji: '🌆', text: `Evening readings average ${Math.round(eveningAvg)} mg/dL — above your target. A short walk after dinner may help lower post-meal spikes.`, color: 'warning' };
        }
        if (glucoseStats.sd > 36) {
            return { emoji: '🎢', text: `Your glucose variability is high (SD: ${glucoseStats.sd}). Consistent meal times and portions can help stabilize your levels.`, color: 'warning' };
        }
        return { emoji: '📊', text: `Tracking ${filteredGlucose.length} readings over ${period} days. Average: ${averageGlucose} mg/dL. Consistent logging helps build better AI insights.`, color: 'primary' };
    }, [filteredGlucose, filteredCarbs, rangeBreakdown, period, averageGlucose, targetGlucoseMin, targetGlucoseMax, glucoseStats.sd]);

    // ─── Glucose Prediction ─────────────────────────────────────────────────
    const glucosePrediction = useMemo(() => {
        if (glucoseLogs.length < 2) return null;
        const recent = glucoseLogs.slice(0, 5);
        const trend = recent[0].glucose_value - recent[recent.length - 1].glucose_value;
        const trendPerReading = trend / (recent.length - 1);
        const today = new Date().toDateString();
        const todayCarbLogs = carbLogs.filter(l => new Date(l.created_at).toDateString() === today);
        const recentCarbImpact = todayCarbLogs.reduce((s, l) => s + l.estimated_carbs, 0);
        const predicted = Math.round(recent[0].glucose_value + trendPerReading + (recentCarbImpact > 30 ? 15 : 0));
        const direction = trendPerReading > 2 ? 'rising' : trendPerReading < -2 ? 'falling' : 'stable';
        return { value: Math.max(50, Math.min(300, predicted)), direction };
    }, [glucoseLogs, carbLogs]);

    // ─── Doctor Summary ─────────────────────────────────────────────────────
    const doctorSummary = useMemo(() => {
        const bullets: string[] = [];
        if (filteredGlucose.length === 0) return ['No data available for this period. Log glucose readings to generate a clinical summary.'];

        bullets.push(`${filteredGlucose.length} glucose readings over ${period} days. Average: ${averageGlucose} ${glucoseUnit}. Estimated A1c: ${estimatedA1c}%.`);
        bullets.push(`Time in range (${targetGlucoseMin}-${targetGlucoseMax}): ${rangeBreakdown.inRange}%. Below: ${rangeBreakdown.low}%. Above: ${rangeBreakdown.high}%.${rangeBreakdown.inRange < 70 ? ' Below recommended 70% target.' : ' Meets clinical guideline.'}`);

        if (glucoseStats.sd > 0) {
            bullets.push(`Glucose range: ${glucoseStats.min}-${glucoseStats.max} ${glucoseUnit}. Variability (SD): ${glucoseStats.sd} mg/dL.${glucoseStats.sd > 36 ? ' High variability detected.' : ' Within acceptable limits.'}`);
        }

        if (weeklyComparison) {
            bullets.push(`Week-over-week: ${weeklyComparison.improved ? '↓ Improved' : '↑ Increased'} by ${Math.abs(weeklyComparison.diff)} mg/dL (${weeklyComparison.lastAvg} → ${weeklyComparison.thisAvg}).`);
        }

        if (topTrigger.name !== 'None') {
            bullets.push(`Top carb intake: ${topTrigger.name} (${topTrigger.grams}g). Daily avg carbs: ${dailyCarbAvg}g vs ${carbGoal}g target.`);
        }

        const timeAnalysis = timeOfDayAvg.filter(t => t.avg !== null);
        if (timeAnalysis.length > 0) {
            const worst = timeAnalysis.reduce((a, b) => (a.avg! > b.avg! ? a : b));
            bullets.push(`Highest average by time of day: ${worst.name} at ${worst.avg} mg/dL.${worst.avg! > targetGlucoseMax ? ' Consider interventions during this period.' : ''}`);
        }

        return bullets;
    }, [filteredGlucose, period, averageGlucose, estimatedA1c, rangeBreakdown, glucoseStats, weeklyComparison, topTrigger, dailyCarbAvg, carbGoal, targetGlucoseMin, targetGlucoseMax, glucoseUnit, timeOfDayAvg]);

    // ─── Glucose Distribution Bars ──────────────────────────────────────────
    const glucoseDistribution = useMemo(() => {
        if (filteredGlucose.length === 0) return [];
        const ranges = [
            { label: '<70', min: 0, max: 70, color: '#FFC107' },
            { label: '70-100', min: 70, max: 100, color: '#8BC34A' },
            { label: '100-140', min: 100, max: 140, color: '#4CAF50' },
            { label: '140-180', min: 140, max: 180, color: '#FF9800' },
            { label: '180-250', min: 180, max: 250, color: '#FF5722' },
            { label: '>250', min: 250, max: 999, color: '#F44336' },
        ];
        return ranges.map(r => {
            const count = filteredGlucose.filter(l => l.glucose_value >= r.min && l.glucose_value < r.max).length;
            return { ...r, count, pct: Math.round((count / filteredGlucose.length) * 100) };
        });
    }, [filteredGlucose]);

    // ─── Chart Data (Daily Trend) ───────────────────────────────────────────
    const dailyTrendData = useMemo(() => {
        if (filteredGlucose.length === 0) return [];
        const dailyMap: { [key: string]: number[] } = {};

        filteredGlucose.forEach(l => {
            const date = new Date(l.reading_time).toLocaleDateString([], { month: 'short', day: 'numeric' });
            if (!dailyMap[date]) dailyMap[date] = [];
            dailyMap[date].push(l.glucose_value);
        });

        return Object.entries(dailyMap).map(([day, values]) => ({
            day,
            value: Math.round(values.reduce((s, v) => s + v, 0) / values.length)
        })).reverse(); // Oldest to newest
    }, [filteredGlucose]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={[styles.avatarButton, { backgroundColor: t.primary + '20' }]} onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person" size={20} color={t.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Health Insights</Text>
                <TouchableOpacity style={[styles.exportButton, { backgroundColor: t.glass }]} onPress={() => setReportVisible(true)}>
                    <Ionicons name="document-text-outline" size={20} color={t.primary} />
                </TouchableOpacity>
            </View>

            {/* Period Selector */}
            <View style={[styles.periodRow, { borderBottomColor: t.border }]}>
                {([7, 14, 30, 90] as TimePeriod[]).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodChip, period === p && { backgroundColor: t.primary }]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodText, { color: period === p ? '#FFF' : t.textSecondary }]}>{p}D</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Key Metrics Row 1 */}
                <View style={styles.metricsRow}>
                    <MetricCard label="AVG GLUCOSE" value={averageGlucose || '--'} unit={glucoseUnit} icon="heart-pulse" theme={t}
                        color={averageGlucose > targetGlucoseMax ? t.error : averageGlucose < targetGlucoseMin ? t.warning : t.success} />
                    <MetricCard label="EST. A1C" value={estimatedA1c} unit="%" icon="calculator" theme={t}
                        color={parseFloat(estimatedA1c) > 7 ? t.error : t.primary} />
                </View>

                {/* Key Metrics Row 2 */}
                <View style={styles.metricsRow}>
                    <MetricCard label="READINGS" value={filteredGlucose.length} unit="" icon="clipboard-pulse" theme={t} color={t.primary} />
                    <MetricCard label="VARIABILITY" value={glucoseStats.sd || '--'} unit="SD" icon="chart-line-variant" theme={t}
                        color={glucoseStats.sd > 36 ? t.error : t.success} />
                </View>

                {/* Min / Max / Prediction Row */}
                <View style={styles.threeColRow}>
                    <View style={[styles.miniCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Ionicons name="arrow-down-circle" size={18} color="#FFC107" />
                        <Text style={[styles.miniValue, { color: t.text }]}>{glucoseStats.min || '--'}</Text>
                        <Text style={[styles.miniLabel, { color: t.textTertiary }]}>MIN</Text>
                    </View>
                    <View style={[styles.miniCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Ionicons name="arrow-up-circle" size={18} color="#FF5252" />
                        <Text style={[styles.miniValue, { color: t.text }]}>{glucoseStats.max || '--'}</Text>
                        <Text style={[styles.miniLabel, { color: t.textTertiary }]}>MAX</Text>
                    </View>
                    {glucosePrediction && (
                        <View style={[styles.miniCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            <MaterialCommunityIcons name="crystal-ball" size={18}
                                color={glucosePrediction.value > targetGlucoseMax ? t.error : t.success} />
                            <Text style={[styles.miniValue, { color: t.text }]}>{glucosePrediction.value}</Text>
                            <Text style={[styles.miniLabel, { color: t.textTertiary }]}>
                                {glucosePrediction.direction === 'rising' ? 'PRED ↑' : glucosePrediction.direction === 'falling' ? 'PRED ↓' : 'PRED →'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* AI Trend Chart */}
                {dailyTrendData.length > 1 && (
                    <View style={[styles.chartCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.chartHeader}>
                            <Text style={[styles.cardTitle, { color: t.text }]}>Glucose Trends</Text>
                            <Text style={[styles.cardSubtitle, { color: t.textTertiary }]}>Daily Average ({glucoseUnit})</Text>
                        </View>
                        <View style={{ height: 180, marginTop: Spacing.md }}>
                            <CartesianChart
                                data={dailyTrendData}
                                xKey="day"
                                yKeys={["value"]}
                                domain={{ y: [Math.max(0, glucoseStats.min - 20), Math.min(400, glucoseStats.max + 20)] }}
                                axisOptions={{
                                    font: null as any,
                                    tickCount: 5,
                                    labelColor: t.textTertiary,
                                    lineColor: t.border
                                }}
                            >
                                {({ points, chartBounds }) => (
                                    <>
                                        <Area
                                            points={points.value}
                                            y0={chartBounds.bottom}
                                            color={t.primary + '20'}
                                            animate={{ type: "timing", duration: 500 }}
                                        />
                                        <Line
                                            points={points.value}
                                            color={t.primary}
                                            strokeWidth={3}
                                            animate={{ type: "timing", duration: 500 }}
                                        />
                                    </>
                                )}
                            </CartesianChart>
                        </View>
                    </View>
                )}

                {/* Time In Range Breakdown */}
                <View style={[styles.rangeCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[styles.cardTitle, { color: t.text }]}>Time In Range</Text>
                    <Text style={[styles.cardSubtitle, { color: t.textTertiary }]}>{targetGlucoseMin}-{targetGlucoseMax} {glucoseUnit}</Text>
                    <View style={styles.rangeBarContainer}>
                        {rangeBreakdown.low > 0 && (
                            <View style={[styles.rangeSegment, { flex: rangeBreakdown.low, backgroundColor: '#FFC107' }]} />
                        )}
                        <View style={[styles.rangeSegment, { flex: Math.max(rangeBreakdown.inRange, 1), backgroundColor: '#4CAF50' }]} />
                        {rangeBreakdown.high > 0 && (
                            <View style={[styles.rangeSegment, { flex: rangeBreakdown.high, backgroundColor: '#FF9800' }]} />
                        )}
                        {rangeBreakdown.veryHigh > 0 && (
                            <View style={[styles.rangeSegment, { flex: rangeBreakdown.veryHigh, backgroundColor: '#FF5252' }]} />
                        )}
                    </View>
                    <View style={styles.rangeLegend}>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} /><Text style={[styles.legendText, { color: t.textSecondary }]}>Low {rangeBreakdown.low}%</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} /><Text style={[styles.legendText, { color: t.textSecondary }]}>In Range {rangeBreakdown.inRange}%</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} /><Text style={[styles.legendText, { color: t.textSecondary }]}>High {rangeBreakdown.high}%</Text></View>
                    </View>
                </View>

                {/* Glucose Distribution */}
                {glucoseDistribution.length > 0 && glucoseDistribution.some(d => d.count > 0) && (
                    <View style={[styles.distCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Text style={[styles.cardTitle, { color: t.text }]}>Glucose Distribution</Text>
                        {glucoseDistribution.map((d, i) => (
                            <View key={i} style={styles.distRow}>
                                <Text style={[styles.distLabel, { color: t.textSecondary }]}>{d.label}</Text>
                                <View style={[styles.distBarBg, { backgroundColor: t.glass }]}>
                                    <View style={[styles.distBarFill, { width: `${Math.max(d.pct, 2)}%`, backgroundColor: d.color }]} />
                                </View>
                                <Text style={[styles.distPct, { color: t.text }]}>{d.pct}%</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Time of Day Averages */}
                {timeOfDayAvg.some(t => t.avg !== null) && (
                    <View style={[styles.todCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Text style={[styles.cardTitle, { color: t.text }]}>Average by Time of Day</Text>
                        <View style={styles.todGrid}>
                            {timeOfDayAvg.map((slot, i) => (
                                <View key={i} style={[styles.todSlot, { backgroundColor: t.glass }]}>
                                    <Text style={styles.todEmoji}>{slot.emoji}</Text>
                                    <Text style={[styles.todName, { color: t.textSecondary }]}>{slot.name}</Text>
                                    <Text style={[styles.todAvg, {
                                        color: slot.avg === null ? t.textTertiary
                                            : slot.avg > targetGlucoseMax ? '#FF5252'
                                                : slot.avg < targetGlucoseMin ? '#FFC107'
                                                    : '#4CAF50'
                                    }]}>
                                        {slot.avg ?? '--'}
                                    </Text>
                                    <Text style={[styles.todCount, { color: t.textTertiary }]}>{slot.count} reads</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Weekly Comparison */}
                {weeklyComparison && (
                    <View style={[styles.weekCard, {
                        backgroundColor: weeklyComparison.improved ? '#4CAF5010' : '#FF525210',
                        borderColor: weeklyComparison.improved ? '#4CAF5030' : '#FF525230'
                    }]}>
                        <View style={styles.weekContent}>
                            <Ionicons name={weeklyComparison.improved ? 'trending-down' : 'trending-up'} size={28}
                                color={weeklyComparison.improved ? '#4CAF50' : '#FF5252'} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.weekTitle, { color: t.text }]}>Week-over-Week</Text>
                                <Text style={[styles.weekDetail, { color: t.textSecondary }]}>
                                    Last week avg: {weeklyComparison.lastAvg} → This week: {weeklyComparison.thisAvg} ({weeklyComparison.improved ? '↓' : '↑'}{Math.abs(weeklyComparison.diff)})
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* AI Behavioral Insight */}
                <View style={[styles.insightCard, {
                    backgroundColor: (t as any)[behavioralInsight.color] + '10',
                    borderColor: (t as any)[behavioralInsight.color] + '25'
                }]}>
                    <View style={styles.insightHeader}>
                        <View style={[styles.discoveryIcon, { backgroundColor: (t as any)[behavioralInsight.color] + '20' }]}>
                            <Ionicons name="sparkles" size={20} color={(t as any)[behavioralInsight.color]} />
                        </View>
                        <View>
                            <Text style={[styles.discoveryLabel, { color: (t as any)[behavioralInsight.color] }]}>AI PATTERN ALERT</Text>
                            <Text style={[styles.discoveryTitle, { color: t.text }]}>Behavioral Discovery</Text>
                        </View>
                    </View>
                    <Text style={[styles.insightText, { color: t.text }]}>{behavioralInsight.emoji} {behavioralInsight.text}</Text>
                    <TouchableOpacity style={[styles.reportBtn, { backgroundColor: t.primary + '10' }]} onPress={() => setReportVisible(true)}>
                        <Ionicons name="document-text" size={18} color={t.primary} />
                        <Text style={[styles.reportBtnText, { color: t.primary }]}>View Doctor's AI Summary</Text>
                    </TouchableOpacity>
                </View>

                {/* Carb Stats Card */}
                <View style={[styles.carbCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[styles.cardTitle, { color: t.text }]}>Carb Intake ({period}D)</Text>
                    <View style={styles.carbStats}>
                        <View style={styles.carbStat}>
                            <Text style={[styles.carbStatValue, { color: t.primary }]}>{dailyCarbAvg}g</Text>
                            <Text style={[styles.carbStatLabel, { color: t.textTertiary }]}>Daily Avg</Text>
                        </View>
                        <View style={[styles.carbDivider, { backgroundColor: t.border }]} />
                        <View style={styles.carbStat}>
                            <Text style={[styles.carbStatValue, { color: t.text }]}>{carbGoal}g</Text>
                            <Text style={[styles.carbStatLabel, { color: t.textTertiary }]}>Goal</Text>
                        </View>
                        <View style={[styles.carbDivider, { backgroundColor: t.border }]} />
                        <View style={styles.carbStat}>
                            <Text style={[styles.carbStatValue, { color: filteredCarbs.length > 0 ? t.success : t.textTertiary }]}>{filteredCarbs.length}</Text>
                            <Text style={[styles.carbStatLabel, { color: t.textTertiary }]}>Meals</Text>
                        </View>
                    </View>
                </View>

                {/* Meal Patterns */}
                {mealPatterns.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>TOP FOODS ({period}D)</Text>
                        {mealPatterns.map((food, i) => (
                            <View key={i} style={[styles.patternRow, { borderBottomColor: t.border }]}>
                                <View style={[styles.rankBadge, {
                                    backgroundColor: i === 0 ? '#FFD70020' : i === 1 ? '#C0C0C020' : i === 2 ? '#CD7F3220' : t.glass
                                }]}>
                                    <Text style={[styles.rankText, {
                                        color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : t.textTertiary
                                    }]}>{i + 1}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.patternName, { color: t.text }]}>{food.name}</Text>
                                    <Text style={[styles.patternFreq, { color: t.textTertiary }]}>{food.frequency}× logged</Text>
                                </View>
                                <Text style={[styles.patternCarbs, { color: t.primary }]}>{food.avgCarbs}g avg</Text>
                            </View>
                        ))}
                    </>
                )}

                {/* Trigger Card */}
                {topTrigger.name !== 'None' && (
                    <>
                        <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>🔴 HIGHEST IMPACT FOOD</Text>
                        <View style={[styles.triggerCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            <View style={[styles.triggerIcon, { backgroundColor: t.error + '15' }]}>
                                <MaterialCommunityIcons name="food-apple" size={24} color={t.error} />
                            </View>
                            <View style={styles.triggerInfo}>
                                <Text style={[styles.triggerName, { color: t.text }]}>{topTrigger.name}</Text>
                                <Text style={[styles.triggerDetail, { color: t.textSecondary }]}>Highest single carb intake this period</Text>
                            </View>
                            <View style={styles.triggerValue}>
                                <Text style={[styles.triggerGrams, { color: t.error }]}>{topTrigger.grams}g</Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Recent Logs */}
                <View style={styles.activityHeader}>
                    <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>RECENT READINGS</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                        <Text style={{ color: t.primary, fontSize: 12, fontWeight: '600' }}>See all</Text>
                    </TouchableOpacity>
                </View>

                {glucoseLogs.slice(0, 5).map((log, index) => {
                    const val = log.glucose_value;
                    const inRange = val >= targetGlucoseMin && val <= targetGlucoseMax;
                    return (
                        <View key={index} style={[styles.activityItem, { borderBottomColor: t.border }]}>
                            <View style={[styles.activityIcon, { backgroundColor: inRange ? '#4CAF5012' : val > targetGlucoseMax ? '#FF525212' : '#FFC10712' }]}>
                                <Ionicons name={inRange ? 'checkmark-circle' : 'alert-circle'} size={18}
                                    color={inRange ? '#4CAF50' : val > targetGlucoseMax ? '#FF5252' : '#FFC107'} />
                            </View>
                            <View style={styles.activityText}>
                                <Text style={[styles.activityTitle, { color: t.text }]}>{val} {glucoseUnit}</Text>
                                <Text style={[styles.activityTime, { color: t.textTertiary }]}>
                                    {new Date(log.reading_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <Text style={[styles.activityValue, { color: inRange ? '#4CAF50' : val > targetGlucoseMax ? '#FF5252' : '#FFC107' }]}>
                                {inRange ? '✓ In Range' : val > targetGlucoseMax ? '↑ High' : '↓ Low'}
                            </Text>
                        </View>
                    );
                })}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Doctor's AI Summary Modal */}
            <Modal animationType="slide" transparent visible={reportVisible} onRequestClose={() => setReportVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[styles.discoveryIcon, { backgroundColor: t.primary + '20' }]}>
                                    <MaterialCommunityIcons name="robot" size={22} color={t.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.discoveryLabel, { color: t.primary }]}>AI-GENERATED • {period} DAYS</Text>
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
                                <Text style={[styles.disclaimerText, { color: t.textTertiary }]}>AI-generated summary for informational purposes only. Consult your healthcare provider for medical decisions.</Text>
                            </View>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.reportBtn, { backgroundColor: t.primary }]}
                            onPress={() => { setReportVisible(false); Alert.alert('Success', 'Doctor\'s AI Summary ready to share with your healthcare provider.'); }}
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
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    avatarButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
    exportButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    periodRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: Spacing.md, borderBottomWidth: 1, marginHorizontal: Spacing.xl },
    periodChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: BorderRadius.round },
    periodText: { fontSize: 12, fontWeight: 'bold' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
    metricsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
    metricCard: { flex: 1, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, ...Shadow.light },
    metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    metricLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    metricValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    metricValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    metricUnit: { fontSize: Typography.sizes.xs },
    threeColRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
    miniCard: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1, gap: 4 },
    miniValue: { fontSize: 18, fontWeight: 'bold' },
    miniLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    // Range
    rangeCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    cardTitle: { fontSize: Typography.sizes.md, fontWeight: 'bold', marginBottom: 4 },
    cardSubtitle: { fontSize: 11, marginBottom: Spacing.lg },
    rangeBarContainer: { flexDirection: 'row', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: Spacing.md },
    rangeSegment: { height: '100%' },
    rangeLegend: { flexDirection: 'row', justifyContent: 'space-between' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, fontWeight: '600' },
    // Chart
    chartCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl, height: 280 },
    chartHeader: { marginBottom: Spacing.sm },
    // Distribution
    distCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    distLabel: { width: 48, fontSize: 10, fontWeight: '600', textAlign: 'right' },
    distBarBg: { flex: 1, height: 14, borderRadius: 7, overflow: 'hidden' },
    distBarFill: { height: '100%', borderRadius: 7 },
    distPct: { width: 32, fontSize: 11, fontWeight: 'bold', textAlign: 'right' },
    // Time of Day
    todCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    todGrid: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    todSlot: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.xl, gap: 4 },
    todEmoji: { fontSize: 22 },
    todName: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    todAvg: { fontSize: 18, fontWeight: 'bold' },
    todCount: { fontSize: 9 },
    // Weekly
    weekCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: Spacing.xl },
    weekContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    weekTitle: { fontSize: Typography.sizes.md, fontWeight: 'bold', marginBottom: 2 },
    weekDetail: { fontSize: 12, lineHeight: 18 },
    // Insight
    insightCard: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, marginBottom: Spacing.xl, borderWidth: 1 },
    insightHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    discoveryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    discoveryLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
    discoveryTitle: { fontSize: Typography.sizes.md, fontWeight: 'bold' },
    insightText: { fontSize: Typography.sizes.md, lineHeight: 22, marginBottom: Spacing.lg },
    reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, borderRadius: BorderRadius.xl },
    reportBtnText: { fontSize: 12, fontWeight: 'bold' },
    // Carbs
    carbCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    carbStats: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
    carbStat: { flex: 1, alignItems: 'center' },
    carbStatValue: { fontSize: 22, fontWeight: 'bold' },
    carbStatLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
    carbDivider: { width: 1, height: 30 },
    // Patterns
    sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: Spacing.md },
    patternRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
    rankBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 14, fontWeight: 'bold' },
    patternName: { fontSize: Typography.sizes.md, fontWeight: '600' },
    patternFreq: { fontSize: 11, marginTop: 1 },
    patternCarbs: { fontSize: Typography.sizes.md, fontWeight: 'bold' },
    // Trigger
    triggerCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: Spacing.xl, ...Shadow.light },
    triggerIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    triggerInfo: { flex: 1 },
    triggerName: { fontSize: Typography.sizes.md, fontWeight: 'bold', marginBottom: 4 },
    triggerDetail: { fontSize: 11 },
    triggerValue: { alignItems: 'flex-end' },
    triggerGrams: { fontSize: Typography.sizes.lg, fontWeight: 'bold' },
    // Activity
    activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1 },
    activityIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    activityText: { flex: 1 },
    activityTitle: { fontSize: Typography.sizes.md, fontWeight: '600' },
    activityTime: { fontSize: 11 },
    activityValue: { fontSize: 12, fontWeight: 'bold' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, maxHeight: '85%', borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    summaryBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.lg },
    bulletNumber: { fontSize: 18, fontWeight: 'bold', width: 24 },
    bulletText: { flex: 1, fontSize: Typography.sizes.md, lineHeight: 22 },
    disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
    disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
