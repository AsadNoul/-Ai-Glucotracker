import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, getThemeColors } from '../constants/Theme';
import { useLogsStore, useSettingsStore, useMedicationStore, useActivityStore } from '../store';

type FilterType = 'all' | 'glucose' | 'meals' | 'insulin' | 'meds' | 'activity';

interface TimelineItem {
    id: string;
    type: 'glucose' | 'meal' | 'insulin' | 'medication' | 'activity';
    timestamp: string;
    primary: string;
    secondary: string;
    icon: string;
    iconColor: string;
    value?: number;
    emoji?: string;
}

export const LogbookScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, glucoseUnit, targetGlucoseMin, targetGlucoseMax } = useSettingsStore();
    const { glucoseLogs, carbLogs, insulinLogs } = useLogsStore();
    const { medicationLogs } = useMedicationStore();
    const { activityLogs } = useActivityStore();
    const t = getThemeColors(theme);
    const [filter, setFilter] = useState<FilterType>('all');

    // ─── Merge all logs into timeline ───────────────────────────────────
    const timeline = useMemo(() => {
        const items: TimelineItem[] = [];

        if (filter === 'all' || filter === 'glucose') {
            glucoseLogs.forEach(l => {
                const inRange = l.glucose_value >= targetGlucoseMin && l.glucose_value <= targetGlucoseMax;
                const isHigh = l.glucose_value > targetGlucoseMax;
                items.push({
                    id: `g-${l.id}`,
                    type: 'glucose',
                    timestamp: l.reading_time,
                    primary: `${l.glucose_value} ${glucoseUnit}`,
                    secondary: inRange ? 'In Range' : isHigh ? 'Above Target' : 'Below Target',
                    icon: inRange ? 'checkmark-circle' : 'alert-circle',
                    iconColor: inRange ? '#4CAF50' : isHigh ? '#FF5252' : '#FFC107',
                    value: l.glucose_value,
                });
            });
        }

        if (filter === 'all' || filter === 'meals') {
            carbLogs.forEach(l => {
                items.push({
                    id: `c-${l.id}`,
                    type: 'meal',
                    timestamp: l.created_at,
                    primary: l.food_name,
                    secondary: `${l.estimated_carbs}g carbs`,
                    icon: 'restaurant',
                    iconColor: '#FF9800',
                });
            });
        }

        if (filter === 'all' || filter === 'insulin') {
            insulinLogs.forEach(l => {
                items.push({
                    id: `i-${l.id}`,
                    type: 'insulin',
                    timestamp: l.timestamp,
                    primary: `${l.units} units`,
                    secondary: l.type.charAt(0).toUpperCase() + l.type.slice(1),
                    icon: 'medical',
                    iconColor: '#7B61FF',
                });
            });
        }

        if (filter === 'all' || filter === 'meds') {
            medicationLogs.forEach(l => {
                items.push({
                    id: `m-${l.id}`,
                    type: 'medication',
                    timestamp: l.takenAt,
                    primary: l.medicationName,
                    secondary: `${l.dosage} — ${l.taken ? 'Taken' : 'Skipped'}`,
                    icon: l.taken ? 'checkmark-done' : 'close-circle',
                    iconColor: l.taken ? '#4CAF50' : '#FF5252',
                    emoji: '💊',
                });
            });
        }

        if (filter === 'all' || filter === 'activity') {
            activityLogs.forEach(l => {
                items.push({
                    id: `a-${l.id}`,
                    type: 'activity',
                    timestamp: l.createdAt,
                    primary: l.type,
                    secondary: `${l.duration} min · ${l.caloriesBurned} cal`,
                    icon: 'fitness',
                    iconColor: '#00BCD4',
                    emoji: l.emoji,
                });
            });
        }

        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [glucoseLogs, carbLogs, insulinLogs, medicationLogs, activityLogs, filter, glucoseUnit, targetGlucoseMin, targetGlucoseMax]);

    // ─── Group by date ──────────────────────────────────────────────────
    const grouped = useMemo(() => {
        const groups: { [date: string]: TimelineItem[] } = {};
        timeline.forEach(item => {
            const date = new Date(item.timestamp).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return Object.entries(groups).map(([date, items]) => ({ date, items }));
    }, [timeline]);

    const getDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const filters: { key: FilterType; label: string; icon: string }[] = [
        { key: 'all', label: 'All', icon: 'layers' },
        { key: 'glucose', label: 'Glucose', icon: 'water' },
        { key: 'meals', label: 'Meals', icon: 'restaurant' },
        { key: 'insulin', label: 'Insulin', icon: 'medical' },
        { key: 'meds', label: 'Meds', icon: 'medkit' },
        { key: 'activity', label: 'Activity', icon: 'fitness' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: t.glass }]}>
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Logbook</Text>
                <View style={styles.headerRight}>
                    <Text style={[styles.totalCount, { color: t.textSecondary }]}>{timeline.length} entries</Text>
                </View>
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
                {filters.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, filter === f.key && { backgroundColor: t.primary }]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Ionicons name={f.icon as any} size={14} color={filter === f.key ? '#FFF' : t.textSecondary} />
                        <Text style={[styles.filterText, { color: filter === f.key ? '#FFF' : t.textSecondary }]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {grouped.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="clipboard-text-clock-outline" size={64} color={t.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: t.text }]}>No Entries Yet</Text>
                        <Text style={[styles.emptySubtitle, { color: t.textTertiary }]}>Start logging glucose, meals, or medications to see your health timeline here.</Text>
                        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: t.primary }]} onPress={() => navigation.navigate('AddLog')}>
                            <Ionicons name="add" size={20} color="#FFF" />
                            <Text style={styles.emptyBtnText}>Add First Log</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    grouped.map((group, gi) => {
                        // Day summary
                        const dayGlucose = group.items.filter(i => i.type === 'glucose');
                        const dayAvg = dayGlucose.length > 0
                            ? Math.round(dayGlucose.reduce((s, i) => s + (i.value || 0), 0) / dayGlucose.length)
                            : null;

                        return (
                            <View key={gi} style={styles.dayGroup}>
                                {/* Day Header */}
                                <View style={styles.dayHeader}>
                                    <View>
                                        <Text style={[styles.dayLabel, { color: t.text }]}>{getDateLabel(group.date)}</Text>
                                        <Text style={[styles.dayMeta, { color: t.textTertiary }]}>
                                            {group.items.length} entries
                                            {dayAvg ? ` · Avg: ${dayAvg} ${glucoseUnit}` : ''}
                                        </Text>
                                    </View>
                                    {dayAvg && (
                                        <View style={[styles.dayBadge, {
                                            backgroundColor: dayAvg >= targetGlucoseMin && dayAvg <= targetGlucoseMax
                                                ? '#4CAF5015' : '#FF525215'
                                        }]}>
                                            <Text style={[styles.dayBadgeText, {
                                                color: dayAvg >= targetGlucoseMin && dayAvg <= targetGlucoseMax
                                                    ? '#4CAF50' : '#FF5252'
                                            }]}>
                                                {dayAvg >= targetGlucoseMin && dayAvg <= targetGlucoseMax ? '✓ In Range' : '⚠ Off Target'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Timeline Items */}
                                {group.items.map((item, ii) => (
                                    <View key={item.id} style={[styles.timelineItem, ii === group.items.length - 1 && { borderBottomWidth: 0 }]}>
                                        {/* Timeline Line */}
                                        <View style={styles.timelineLeft}>
                                            <View style={[styles.timelineDot, { backgroundColor: item.iconColor + '20' }]}>
                                                {item.emoji ? (
                                                    <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
                                                ) : (
                                                    <Ionicons name={item.icon as any} size={14} color={item.iconColor} />
                                                )}
                                            </View>
                                            {ii < group.items.length - 1 && <View style={[styles.timelineLine, { backgroundColor: t.border }]} />}
                                        </View>

                                        {/* Content */}
                                        <View style={[styles.timelineContent, { borderBottomColor: t.border }]}>
                                            <View style={styles.timelineMain}>
                                                <Text style={[styles.itemPrimary, { color: t.text }]}>{item.primary}</Text>
                                                <Text style={[styles.itemTime, { color: t.textTertiary }]}>
                                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            <Text style={[styles.itemSecondary, { color: item.iconColor }]}>{item.secondary}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        );
                    })
                )}
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    backBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    headerRight: { alignItems: 'flex-end' },
    totalCount: { fontSize: 12, fontWeight: '600' },
    filterRow: { maxHeight: 44, marginBottom: Spacing.sm },
    filterContent: { paddingHorizontal: Spacing.xl, gap: 8 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.round },
    filterText: { fontSize: 12, fontWeight: 'bold' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
    // Empty
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: 'bold' },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: BorderRadius.xl, marginTop: 8 },
    emptyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    // Day Group
    dayGroup: { marginBottom: Spacing.xl },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, paddingBottom: Spacing.sm },
    dayLabel: { fontSize: Typography.sizes.lg, fontWeight: 'bold' },
    dayMeta: { fontSize: 11, marginTop: 2 },
    dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round },
    dayBadgeText: { fontSize: 10, fontWeight: 'bold' },
    // Timeline
    timelineItem: { flexDirection: 'row', minHeight: 50 },
    timelineLeft: { width: 36, alignItems: 'center' },
    timelineDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    timelineLine: { flex: 1, width: 2, marginVertical: 2 },
    timelineContent: { flex: 1, paddingBottom: Spacing.md, marginLeft: Spacing.md, borderBottomWidth: 1 },
    timelineMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemPrimary: { fontSize: Typography.sizes.md, fontWeight: '600' },
    itemTime: { fontSize: 11 },
    itemSecondary: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
