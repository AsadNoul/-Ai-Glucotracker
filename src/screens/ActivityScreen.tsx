import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useActivityStore, ActivityLog } from '../store';

const ACTIVITY_TYPES = [
    { type: 'Walking', emoji: '🚶', met: 3.5 },
    { type: 'Running', emoji: '🏃', met: 8 },
    { type: 'Cycling', emoji: '🚴', met: 6 },
    { type: 'Swimming', emoji: '🏊', met: 7 },
    { type: 'Yoga', emoji: '🧘', met: 2.5 },
    { type: 'Gym / Weights', emoji: '🏋️', met: 5 },
    { type: 'Dancing', emoji: '💃', met: 5 },
    { type: 'Hiking', emoji: '🥾', met: 6 },
    { type: 'Team Sports', emoji: '⚽', met: 7 },
    { type: 'Stretching', emoji: '🤸', met: 2 },
    { type: 'Housework', emoji: '🧹', met: 3 },
    { type: 'Gardening', emoji: '🌱', met: 4 },
];

const INTENSITY_OPTIONS: { key: ActivityLog['intensity']; label: string; color: string; multiplier: number }[] = [
    { key: 'light', label: 'Light', color: '#4CAF50', multiplier: 0.8 },
    { key: 'moderate', label: 'Moderate', color: '#FF9800', multiplier: 1.0 },
    { key: 'vigorous', label: 'Vigorous', color: '#FF5252', multiplier: 1.3 },
];

export const ActivityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, weight, weightUnit } = useSettingsStore();
    const { activityLogs, addActivity } = useActivityStore();
    const t = getThemeColors(theme);

    const [selectedType, setSelectedType] = useState<typeof ACTIVITY_TYPES[0] | null>(null);
    const [duration, setDuration] = useState('30');
    const [intensity, setIntensity] = useState<ActivityLog['intensity']>('moderate');
    const [notes, setNotes] = useState('');

    const weightKg = useMemo(() => {
        if (weight <= 0) return 70; // default
        return weightUnit === 'lbs' ? weight * 0.453592 : weight;
    }, [weight, weightUnit]);

    const estimatedCalories = useMemo(() => {
        if (!selectedType) return 0;
        const mins = parseInt(duration) || 0;
        const intensityMult = INTENSITY_OPTIONS.find(i => i.key === intensity)?.multiplier || 1;
        return Math.round((selectedType.met * intensityMult * weightKg * mins) / 60);
    }, [selectedType, duration, intensity, weightKg]);

    const handleSave = () => {
        if (!selectedType) {
            Alert.alert('Select Activity', 'Please choose an activity type.');
            return;
        }
        const mins = parseInt(duration);
        if (!mins || mins <= 0) {
            Alert.alert('Duration Required', 'Please enter a valid duration.');
            return;
        }

        const log: ActivityLog = {
            id: Date.now().toString(),
            type: selectedType.type,
            emoji: selectedType.emoji,
            duration: mins,
            intensity,
            caloriesBurned: estimatedCalories,
            notes: notes.trim() || undefined,
            createdAt: new Date().toISOString(),
        };
        addActivity(log);
        setSelectedType(null);
        setDuration('30');
        setIntensity('moderate');
        setNotes('');
        Alert.alert('✅ Activity Logged', `${log.type} — ${log.duration} min · ${log.caloriesBurned} cal burned`);
    };

    // Weekly stats
    const weekStats = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const weekLogs = activityLogs.filter(l => new Date(l.createdAt) >= cutoff);
        const totalMins = weekLogs.reduce((s, l) => s + l.duration, 0);
        const totalCals = weekLogs.reduce((s, l) => s + l.caloriesBurned, 0);
        const sessions = weekLogs.length;
        return { totalMins, totalCals, sessions };
    }, [activityLogs]);

    // Glucose impact
    const glucoseImpact = useMemo(() => {
        const withBoth = activityLogs.filter(l => l.glucoseBefore && l.glucoseAfter);
        if (withBoth.length === 0) return null;
        const avgDrop = Math.round(withBoth.reduce((s, l) => s + ((l.glucoseBefore || 0) - (l.glucoseAfter || 0)), 0) / withBoth.length);
        return avgDrop;
    }, [activityLogs]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: t.glass }]}>
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Activity</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Weekly Summary */}
                <View style={[styles.summaryCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[styles.summaryTitle, { color: t.text }]}>This Week</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: t.primary }]}>{weekStats.sessions}</Text>
                            <Text style={[styles.summaryLabel, { color: t.textTertiary }]}>Sessions</Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: t.border }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>{weekStats.totalMins}</Text>
                            <Text style={[styles.summaryLabel, { color: t.textTertiary }]}>Minutes</Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: t.border }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#FF5252' }]}>{weekStats.totalCals}</Text>
                            <Text style={[styles.summaryLabel, { color: t.textTertiary }]}>Calories</Text>
                        </View>
                        {glucoseImpact !== null && (
                            <>
                                <View style={[styles.summaryDivider, { backgroundColor: t.border }]} />
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>↓{glucoseImpact}</Text>
                                    <Text style={[styles.summaryLabel, { color: t.textTertiary }]}>Avg Drop</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Log New Activity */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>🏃 LOG ACTIVITY</Text>

                {/* Activity Type Grid */}
                <View style={styles.typeGrid}>
                    {ACTIVITY_TYPES.map((act, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.typeCard, {
                                backgroundColor: selectedType?.type === act.type ? t.primary + '15' : t.card,
                                borderColor: selectedType?.type === act.type ? t.primary : t.border,
                            }]}
                            onPress={() => setSelectedType(act)}
                        >
                            <Text style={styles.typeEmoji}>{act.emoji}</Text>
                            <Text style={[styles.typeName, {
                                color: selectedType?.type === act.type ? t.primary : t.text
                            }]}>{act.type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedType && (
                    <View style={[styles.detailCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        {/* Duration */}
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>DURATION (minutes)</Text>
                        <View style={styles.durationRow}>
                            {['15', '30', '45', '60', '90'].map(d => (
                                <TouchableOpacity key={d}
                                    style={[styles.durChip, duration === d && { backgroundColor: t.primary }]}
                                    onPress={() => setDuration(d)}>
                                    <Text style={[styles.durText, { color: duration === d ? '#FFF' : t.textSecondary }]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                            <TextInput
                                style={[styles.durInput, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="numeric"
                                placeholder="min"
                                placeholderTextColor={t.textTertiary}
                            />
                        </View>

                        {/* Intensity */}
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>INTENSITY</Text>
                        <View style={styles.intensityRow}>
                            {INTENSITY_OPTIONS.map(opt => (
                                <TouchableOpacity key={opt.key}
                                    style={[styles.intensityBtn, intensity === opt.key && { backgroundColor: opt.color + '15', borderColor: opt.color }]}
                                    onPress={() => setIntensity(opt.key)}>
                                    <View style={[styles.intensityDot, { backgroundColor: opt.color }]} />
                                    <Text style={[styles.intensityText, { color: intensity === opt.key ? opt.color : t.textSecondary }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Calorie Preview */}
                        <View style={[styles.caloriePreview, { backgroundColor: t.glass }]}>
                            <MaterialCommunityIcons name="fire" size={24} color="#FF9800" />
                            <View>
                                <Text style={[styles.calValue, { color: t.text }]}>{estimatedCalories} cal</Text>
                                <Text style={[styles.calLabel, { color: t.textTertiary }]}>Estimated burn ({weightKg}kg)</Text>
                            </View>
                        </View>

                        {/* Notes */}
                        <TextInput
                            style={[styles.notesInput, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="Notes (optional)"
                            placeholderTextColor={t.textTertiary}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.primary }]} onPress={handleSave}>
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>Log {selectedType.emoji} {selectedType.type}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Recent Activities */}
                {activityLogs.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>📋 RECENT ACTIVITIES</Text>
                        {activityLogs.slice(0, 10).map(log => (
                            <View key={log.id} style={[styles.logItem, { backgroundColor: t.card, borderColor: t.border }]}>
                                <Text style={styles.logEmoji}>{log.emoji}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.logName, { color: t.text }]}>{log.type}</Text>
                                    <Text style={[styles.logMeta, { color: t.textTertiary }]}>
                                        {log.duration} min · {log.intensity} · {log.caloriesBurned} cal
                                    </Text>
                                </View>
                                <Text style={[styles.logTime, { color: t.textTertiary }]}>
                                    {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                        ))}
                    </>
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
    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
    // Summary
    summaryCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl, ...Shadow.light },
    summaryTitle: { fontSize: Typography.sizes.lg, fontWeight: 'bold', marginBottom: Spacing.md },
    summaryGrid: { flexDirection: 'row', alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 22, fontWeight: 'bold' },
    summaryLabel: { fontSize: 9, fontWeight: '600', marginTop: 2 },
    summaryDivider: { width: 1, height: 30 },
    // Section
    sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: Spacing.md },
    // Grid
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
    typeCard: { width: '31%', alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1, gap: 4 },
    typeEmoji: { fontSize: 26 },
    typeName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
    // Detail
    detailCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    inputLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginTop: Spacing.lg },
    durationRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    durChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.round },
    durText: { fontSize: 13, fontWeight: 'bold' },
    durInput: { width: 56, height: 38, borderRadius: BorderRadius.lg, borderWidth: 1, textAlign: 'center', fontSize: 14 },
    intensityRow: { flexDirection: 'row', gap: 8 },
    intensityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'transparent' },
    intensityDot: { width: 8, height: 8, borderRadius: 4 },
    intensityText: { fontSize: 12, fontWeight: '600' },
    caloriePreview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl, marginTop: Spacing.lg },
    calValue: { fontSize: 20, fontWeight: 'bold' },
    calLabel: { fontSize: 11 },
    notesInput: { height: 60, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, fontSize: 14, borderWidth: 1, marginTop: Spacing.lg, textAlignVertical: 'top' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: BorderRadius.xl, marginTop: Spacing.lg },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    // Logs
    logItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 8, gap: Spacing.md },
    logEmoji: { fontSize: 24 },
    logName: { fontSize: 14, fontWeight: '600' },
    logMeta: { fontSize: 11, marginTop: 2 },
    logTime: { fontSize: 11 },
});
