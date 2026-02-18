import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore, useMedicationStore, useActivityStore, useMoodStore } from '../store';

const { width } = Dimensions.get('window');

interface Badge {
    id: string;
    emoji: string;
    name: string;
    description: string;
    unlocked: boolean;
    progress: number;
    target: number;
    category: 'glucose' | 'logging' | 'activity' | 'streak' | 'milestone';
}

export const AchievementsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useSettingsStore();
    const { glucoseLogs, carbLogs, insulinLogs } = useLogsStore();
    const { medicationLogs } = useMedicationStore();
    const { activityLogs } = useActivityStore();
    const { moodEntries } = useMoodStore();
    const t = getThemeColors(theme);

    const fireAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(fireAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
            Animated.timing(fireAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])).start();
    }, []);

    // ─── Streak Calculation ─────────────────────────────────────────
    const streak = useMemo(() => {
        // Combine all log dates
        const allDates = new Set<string>();
        glucoseLogs.forEach(l => allDates.add(new Date(l.reading_time).toDateString()));
        carbLogs.forEach(l => allDates.add(new Date(l.created_at).toDateString()));
        insulinLogs.forEach(l => allDates.add(new Date(l.logged_at).toDateString()));
        medicationLogs.forEach(l => allDates.add(new Date(l.takenAt).toDateString()));
        activityLogs.forEach(l => allDates.add(new Date(l.createdAt).toDateString()));
        moodEntries.forEach((l: any) => allDates.add(new Date(l.createdAt).toDateString()));

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Check consecutive days going backwards
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            if (allDates.has(d.toDateString())) {
                tempStreak++;
                if (i === currentStreak) currentStreak = tempStreak;
            } else {
                if (i <= currentStreak) break;
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 0;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

        return { current: currentStreak, longest: longestStreak, totalDays: allDates.size };
    }, [glucoseLogs, carbLogs, insulinLogs, medicationLogs, activityLogs, moodEntries]);

    // ─── Points & Level ─────────────────────────────────────────────
    const points = useMemo(() => {
        let total = 0;
        total += glucoseLogs.length * 10;  // 10 points per glucose log
        total += carbLogs.length * 8;       // 8 points per meal
        total += insulinLogs.length * 8;    // 8 points per insulin dose
        total += medicationLogs.length * 5; // 5 points per med dose
        total += activityLogs.length * 15;  // 15 points per activity
        total += moodEntries.length * 5;    // 5 points per mood check-in
        total += streak.current * 20;       // 20 points per streak day
        return total;
    }, [glucoseLogs, carbLogs, insulinLogs, medicationLogs, activityLogs, moodEntries, streak]);

    const level = useMemo(() => {
        if (points < 100) return { name: 'Beginner', level: 1, next: 100, emoji: '🌱' };
        if (points < 300) return { name: 'Tracker', level: 2, next: 300, emoji: '📊' };
        if (points < 600) return { name: 'Achiever', level: 3, next: 600, emoji: '⭐' };
        if (points < 1000) return { name: 'Champion', level: 4, next: 1000, emoji: '🏆' };
        if (points < 2000) return { name: 'Expert', level: 5, next: 2000, emoji: '💎' };
        if (points < 5000) return { name: 'Master', level: 6, next: 5000, emoji: '👑' };
        return { name: 'Legend', level: 7, next: 10000, emoji: '🌟' };
    }, [points]);

    // ─── Badges ─────────────────────────────────────────────────────
    const badges: Badge[] = useMemo(() => [
        // Streaks
        { id: 's1', emoji: '🔥', name: 'First Flame', description: '3-day logging streak', unlocked: streak.current >= 3, progress: Math.min(streak.current, 3), target: 3, category: 'streak' },
        { id: 's2', emoji: '🔥', name: 'Week Warrior', description: '7-day logging streak', unlocked: streak.current >= 7, progress: Math.min(streak.current, 7), target: 7, category: 'streak' },
        { id: 's3', emoji: '💪', name: 'Monthly Master', description: '30-day logging streak', unlocked: streak.current >= 30, progress: Math.min(streak.current, 30), target: 30, category: 'streak' },
        { id: 's4', emoji: '⚡', name: '100 Day Club', description: '100-day logging streak', unlocked: streak.current >= 100, progress: Math.min(streak.current, 100), target: 100, category: 'streak' },
        // Glucose
        { id: 'g1', emoji: '🩸', name: 'First Check', description: 'Log first glucose reading', unlocked: glucoseLogs.length >= 1, progress: Math.min(glucoseLogs.length, 1), target: 1, category: 'glucose' },
        { id: 'g2', emoji: '📈', name: 'Data Collector', description: 'Log 50 glucose readings', unlocked: glucoseLogs.length >= 50, progress: Math.min(glucoseLogs.length, 50), target: 50, category: 'glucose' },
        { id: 'g3', emoji: '🧪', name: 'Scientist', description: 'Log 200 glucose readings', unlocked: glucoseLogs.length >= 200, progress: Math.min(glucoseLogs.length, 200), target: 200, category: 'glucose' },
        // Logging
        { id: 'l1', emoji: '🍽️', name: 'Foodie', description: 'Log 20 meals', unlocked: carbLogs.length >= 20, progress: Math.min(carbLogs.length, 20), target: 20, category: 'logging' },
        { id: 'l2', emoji: '💊', name: 'Med Tracker', description: 'Log 30 medication doses', unlocked: medicationLogs.length >= 30, progress: Math.min(medicationLogs.length, 30), target: 30, category: 'logging' },
        { id: 'l3', emoji: '😊', name: 'Mindful', description: 'Log 10 mood check-ins', unlocked: moodEntries.length >= 10, progress: Math.min(moodEntries.length, 10), target: 10, category: 'logging' },
        // Activity
        { id: 'a1', emoji: '🏃', name: 'First Steps', description: 'Log first activity', unlocked: activityLogs.length >= 1, progress: Math.min(activityLogs.length, 1), target: 1, category: 'activity' },
        { id: 'a2', emoji: '🏋️', name: 'Active Life', description: 'Log 20 activities', unlocked: activityLogs.length >= 20, progress: Math.min(activityLogs.length, 20), target: 20, category: 'activity' },
        // Milestones
        { id: 'm1', emoji: '🎯', name: 'All-Rounder', description: 'Log in all 6 categories', unlocked: glucoseLogs.length > 0 && carbLogs.length > 0 && insulinLogs.length > 0 && medicationLogs.length > 0 && activityLogs.length > 0 && moodEntries.length > 0, progress: [glucoseLogs.length > 0, carbLogs.length > 0, insulinLogs.length > 0, medicationLogs.length > 0, activityLogs.length > 0, moodEntries.length > 0].filter(Boolean).length, target: 6, category: 'milestone' },
        { id: 'm2', emoji: '🏅', name: '500 Points', description: 'Earn 500 points', unlocked: points >= 500, progress: Math.min(points, 500), target: 500, category: 'milestone' },
        { id: 'm3', emoji: '💎', name: '2000 Points', description: 'Earn 2000 points', unlocked: points >= 2000, progress: Math.min(points, 2000), target: 2000, category: 'milestone' },
    ], [streak, glucoseLogs, carbLogs, insulinLogs, medicationLogs, activityLogs, moodEntries, points]);

    const unlockedCount = badges.filter(b => b.unlocked).length;
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredBadges = selectedCategory === 'all' ? badges : badges.filter(b => b.category === selectedCategory);
    const categories = [
        { key: 'all', label: 'All', emoji: '🏠' },
        { key: 'streak', label: 'Streaks', emoji: '🔥' },
        { key: 'glucose', label: 'Glucose', emoji: '🩸' },
        { key: 'logging', label: 'Logging', emoji: '📝' },
        { key: 'activity', label: 'Activity', emoji: '🏃' },
        { key: 'milestone', label: 'Milestones', emoji: '🏅' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Achievements</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Streak Banner */}
                <View style={[styles.streakBanner, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: fireAnim }] }]}>
                        🔥
                    </Animated.Text>
                    <View style={styles.streakInfo}>
                        <Text style={[styles.streakCount, { color: '#FF6B00' }]}>{streak.current}</Text>
                        <Text style={[styles.streakLabel, { color: t.textSecondary }]}>Day Streak</Text>
                    </View>
                    <View style={styles.streakDivider} />
                    <View style={styles.streakMeta}>
                        <View style={styles.streakMetaItem}>
                            <Text style={[styles.streakMetaValue, { color: t.text }]}>{streak.longest}</Text>
                            <Text style={[styles.streakMetaLabel, { color: t.textTertiary }]}>Best</Text>
                        </View>
                        <View style={styles.streakMetaItem}>
                            <Text style={[styles.streakMetaValue, { color: t.text }]}>{streak.totalDays}</Text>
                            <Text style={[styles.streakMetaLabel, { color: t.textTertiary }]}>Total Days</Text>
                        </View>
                    </View>
                </View>

                {/* Level & Points */}
                <View style={[styles.levelCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={styles.levelRow}>
                        <Text style={styles.levelEmoji}>{level.emoji}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.levelName, { color: t.text }]}>Level {level.level} — {level.name}</Text>
                            <View style={[styles.progressBar, { backgroundColor: t.glass }]}>
                                <View style={[styles.progressFill, { width: `${Math.min(100, (points / level.next) * 100)}%`, backgroundColor: t.primary }]} />
                            </View>
                        </View>
                        <View style={styles.pointsDisplay}>
                            <Text style={[styles.pointsValue, { color: t.primary }]}>{points}</Text>
                            <Text style={[styles.pointsLabel, { color: t.textTertiary }]}>pts</Text>
                        </View>
                    </View>
                    <Text style={[styles.progressText, { color: t.textTertiary }]}>{level.next - points > 0 ? `${level.next - points} pts to next level` : 'Max level!'}</Text>
                </View>

                {/* Daily Goals */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>📋 TODAY'S GOALS</Text>
                <View style={[styles.goalsCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <GoalItem label="Log glucose" done={glucoseLogs.some(l => new Date(l.reading_time).toDateString() === new Date().toDateString())} theme={t} />
                    <GoalItem label="Log a meal" done={carbLogs.some(l => new Date(l.created_at).toDateString() === new Date().toDateString())} theme={t} />
                    <GoalItem label="Take medication" done={medicationLogs.some(l => new Date(l.takenAt).toDateString() === new Date().toDateString())} theme={t} />
                    <GoalItem label="Log activity" done={activityLogs.some(l => new Date(l.createdAt).toDateString() === new Date().toDateString())} theme={t} />
                    <GoalItem label="Mood check-in" done={moodEntries.some((l: any) => new Date(l.createdAt).toDateString() === new Date().toDateString())} theme={t} />
                </View>

                {/* Badges Filter */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>🏆 BADGES ({unlockedCount}/{badges.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                    {categories.map(c => (
                        <TouchableOpacity
                            key={c.key}
                            style={[styles.categoryChip, { backgroundColor: selectedCategory === c.key ? t.primary : t.card, borderColor: selectedCategory === c.key ? t.primary : t.border }]}
                            onPress={() => setSelectedCategory(c.key)}
                        >
                            <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                            <Text style={[styles.categoryText, { color: selectedCategory === c.key ? '#FFF' : t.textSecondary }]}>{c.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Badge Grid */}
                <View style={styles.badgeGrid}>
                    {filteredBadges.map(badge => (
                        <View key={badge.id} style={[styles.badgeCard, { backgroundColor: t.card, borderColor: badge.unlocked ? '#FFD700' + '40' : t.border, opacity: badge.unlocked ? 1 : 0.6 }]}>
                            <Text style={[styles.badgeEmoji, { opacity: badge.unlocked ? 1 : 0.3 }]}>{badge.emoji}</Text>
                            <Text style={[styles.badgeName, { color: badge.unlocked ? t.text : t.textTertiary }]} numberOfLines={1}>{badge.name}</Text>
                            <Text style={[styles.badgeDesc, { color: t.textTertiary }]} numberOfLines={2}>{badge.description}</Text>
                            {!badge.unlocked && (
                                <View style={[styles.badgeProgress, { backgroundColor: t.glass }]}>
                                    <View style={[styles.badgeProgressFill, { width: `${(badge.progress / badge.target) * 100}%`, backgroundColor: t.primary }]} />
                                </View>
                            )}
                            {badge.unlocked && (
                                <View style={[styles.unlockedBadge, { backgroundColor: '#FFD700' + '20' }]}>
                                    <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700' }}>UNLOCKED ✓</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const GoalItem = ({ label, done, theme }: { label: string; done: boolean; theme: any }) => (
    <View style={gi.row}>
        <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? '#4CAF50' : theme.textTertiary} />
        <Text style={[gi.label, { color: done ? theme.text : theme.textTertiary, textDecorationLine: done ? 'line-through' : 'none' }]}>{label}</Text>
        {done && <Text style={gi.pts}>+10 pts</Text>}
    </View>
);
const gi = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    label: { flex: 1, fontSize: 15 },
    pts: { color: '#4CAF50', fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xl, marginBottom: Spacing.sm },
    // Streak
    streakBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, ...Shadow.light },
    fireEmoji: { fontSize: 48 },
    streakInfo: { marginLeft: 12 },
    streakCount: { fontSize: 42, fontWeight: '900' },
    streakLabel: { fontSize: 14, fontWeight: '600', marginTop: -4 },
    streakDivider: { width: 1, height: 50, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: Spacing.md },
    streakMeta: { gap: 8 },
    streakMetaItem: { alignItems: 'center' },
    streakMetaValue: { fontSize: 18, fontWeight: '800' },
    streakMetaLabel: { fontSize: 11 },
    // Level
    levelCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, marginTop: Spacing.md, ...Shadow.light },
    levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    levelEmoji: { fontSize: 36 },
    levelName: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
    progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    pointsDisplay: { alignItems: 'center' },
    pointsValue: { fontSize: 24, fontWeight: '900' },
    pointsLabel: { fontSize: 11 },
    progressText: { fontSize: 12, marginTop: 8, textAlign: 'center' },
    // Goals
    goalsCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, ...Shadow.light },
    // Categories
    categoryRow: { gap: 8, paddingBottom: Spacing.sm },
    categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
    categoryEmoji: { fontSize: 14 },
    categoryText: { fontSize: 13, fontWeight: '600' },
    // Badge Grid
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: Spacing.md },
    badgeCard: { width: (width - Spacing.lg * 2 - 12) / 2, borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, alignItems: 'center', ...Shadow.light },
    badgeEmoji: { fontSize: 36, marginBottom: 6 },
    badgeName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
    badgeDesc: { fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 15 },
    badgeProgress: { height: 4, borderRadius: 2, width: '100%', marginTop: 8, overflow: 'hidden' },
    badgeProgressFill: { height: '100%', borderRadius: 2 },
    unlockedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
});
