import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useAuthStore, useLogsStore, useSubscriptionStore, useSettingsStore } from '../store';
import { glucoseService } from '../services/supabase';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, isGuest } = useAuthStore();
    const { theme, dailyStats, addWater, waterGoal } = useSettingsStore();
    const { glucoseLogs, carbLogs, setGlucoseLogs } = useLogsStore();
    const { creditsRemaining } = useSubscriptionStore();
    const [refreshing, setRefreshing] = useState(false);

    const t = getThemeColors(theme);

    // Calculate real data
    const latestGlucose = useMemo(() => glucoseLogs.length > 0 ? glucoseLogs[0].glucose_value : 108, [glucoseLogs]);
    const latestGlucoseTime = useMemo(() => glucoseLogs.length > 0
        ? new Date(glucoseLogs[0].reading_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '10:23 AM', [glucoseLogs]);

    const todayCarbs = useMemo(() => carbLogs.reduce((acc, log) => {
        const isToday = new Date(log.created_at).toDateString() === new Date().toDateString();
        return isToday ? acc + log.estimated_carbs : acc;
    }, 0), [carbLogs]);

    const carbGoal = 120;
    const carbPercent = Math.min(100, Math.round((todayCarbs / carbGoal) * 100));

    // Weekly trend data mockup
    const weeklyData = useMemo(() => {
        return [110, 105, 120, 95, 108, 115, latestGlucose];
    }, [latestGlucose]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        if (!user || isGuest) return;
        try {
            const logs = await glucoseService.getLogs(user.id, 30);
            setGlucoseLogs(logs);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (!isGuest) await loadDashboardData();
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatarContainer, { backgroundColor: t.primary + '20' }]}>
                        <View style={[styles.avatarInner, { backgroundColor: t.card }]}>
                            <Text style={styles.avatarEmoji}>🧔🏻‍♂️</Text>
                        </View>
                    </View>
                    <View>
                        <Text style={[styles.helloText, { color: t.textSecondary }]}>Hello,</Text>
                        <Text style={[styles.userName, { color: t.text }]}>{user?.email?.split('@')[0] || 'Jessica'}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={[styles.creditsBadge, { backgroundColor: t.card }]} onPress={() => navigation.navigate('CreditsStore')}>
                        <MaterialCommunityIcons name="lightning-bolt" size={18} color={t.primary} />
                        <Text style={[styles.creditsText, { color: t.text }]}>{creditsRemaining}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.settingsButton, { backgroundColor: t.card }]} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="settings-sharp" size={24} color={t.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Weekly Trend Mini-Card */}
                <View style={[styles.trendCard, { backgroundColor: t.primary + '10', borderColor: t.primary + '30' }]}>
                    <View style={styles.trendInfo}>
                        <Text style={[styles.trendLabel, { color: t.textSecondary }]}>7-Day Avg</Text>
                        <Text style={[styles.trendValue, { color: t.primary }]}>106 <Text style={styles.trendUnit}>mg/dL</Text></Text>
                    </View>
                    <View style={styles.sparkline}>
                        {weeklyData.map((val, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.sparkBar,
                                    {
                                        height: (val / 150) * 40,
                                        backgroundColor: i === weeklyData.length - 1 ? t.primary : t.primary + '40'
                                    }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Glucose Card */}
                <View style={[styles.mainCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleRow}>
                            <MaterialCommunityIcons name="water" size={20} color={t.primary} />
                            <Text style={[styles.cardTitle, { color: t.textSecondary }]}>Glucose Level</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: t.success + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: t.success }]} />
                            <Text style={[styles.statusText, { color: t.success }]}>In Range</Text>
                        </View>
                    </View>
                    <Text style={[styles.timestamp, { color: t.textTertiary }]}>Today, {latestGlucoseTime}</Text>

                    <View style={styles.glucoseRow}>
                        <Text style={[styles.glucoseValue, { color: t.text }]}>{latestGlucose}</Text>
                        <Text style={[styles.glucoseUnit, { color: t.textTertiary }]}> mg/dL</Text>
                    </View>

                    <View style={styles.rangeIndicator}>
                        <View style={[styles.rangeBackground, { backgroundColor: t.glass }]} />
                        <View style={[styles.rangeActive, { left: '45%', backgroundColor: t.primary }]} />
                        <TouchableOpacity style={styles.detailsLink} onPress={() => navigation.navigate('Insights')}>
                            <Text style={styles.detailsText}>Details </Text>
                            <Ionicons name="arrow-forward" size={14} color={t.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    {/* Carb Progress */}
                    <View style={[styles.compactCard, { backgroundColor: t.card, borderColor: t.border, flex: 1.2 }]}>
                        <Text style={[styles.compactTitle, { color: t.textSecondary }]}>Carbs</Text>
                        <View style={styles.donutPlaceholder}>
                            <View style={[styles.donutInner, { borderColor: t.glass }]}>
                                <Text style={[styles.donutText, { color: t.text }]}>{carbPercent}%</Text>
                            </View>
                            <View style={[styles.donutProgress, { borderColor: t.primary, transform: [{ rotate: '-90deg' }] }]} />
                        </View>
                        <Text style={[styles.compactValue, { color: t.text }]}>{todayCarbs} / {carbGoal}g</Text>
                    </View>

                    {/* Water Tracker */}
                    <View style={[styles.compactCard, { backgroundColor: t.card, borderColor: t.border, flex: 1 }]}>
                        <Text style={[styles.compactTitle, { color: t.textSecondary }]}>Water</Text>
                        <Ionicons name="water" size={32} color="#0A85FF" />
                        <Text style={[styles.compactValue, { color: t.text, marginVertical: 8 }]}>{dailyStats.waterGlasses} / {waterGoal}</Text>
                        <TouchableOpacity style={[styles.addButton, { backgroundColor: '#0A85FF' }]} onPress={addWater}>
                            <Ionicons name="add" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Today's Log Row */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>TODAY'S ACTIVITY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {carbLogs.filter(log => new Date(log.created_at).toDateString() === new Date().toDateString()).map((log, i) => (
                        <View key={i} style={[styles.logChip, { backgroundColor: t.card, borderColor: t.border }]}>
                            <MaterialCommunityIcons name="food" size={16} color={t.primary} />
                            <View>
                                <Text style={[styles.logChipName, { color: t.text }]}>{log.food_name}</Text>
                                <Text style={[styles.logChipValue, { color: t.textSecondary }]}>{log.estimated_carbs}g carbs</Text>
                            </View>
                        </View>
                    ))}
                    {carbLogs.length === 0 && (
                        <View style={[styles.logChip, { backgroundColor: t.glass, borderColor: 'transparent' }]}>
                            <Text style={{ color: t.textTertiary, fontSize: 12 }}>No meals logged yet</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>QUICK ACTIONS</Text>
                <View style={styles.actionsGrid}>
                    <ActionItem
                        icon="overscan"
                        label="Scan Meal"
                        onPress={() => navigation.navigate('ScanMeal')}
                        color={t.primary}
                        theme={t}
                    />
                    <ActionItem
                        icon="edit-calendar"
                        label="Quick Log"
                        onPress={() => navigation.navigate('AddLog', { tab: 'carbs' })}
                        color={t.primary}
                        theme={t}
                    />
                    <ActionItem
                        icon="add"
                        label="Add Glucose"
                        color={t.primary}
                        isFab
                        onPress={() => navigation.navigate('AddLog', { tab: 'glucose' })}
                        theme={t}
                    />
                    <ActionItem
                        icon="history"
                        label="View History"
                        color={t.primary}
                        theme={t}
                        onPress={() => navigation.navigate('Insights')}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const ActionItem = ({ icon, label, onPress, color, isFab, theme }: any) => {
    const t = theme;
    return (
        <TouchableOpacity style={styles.actionContainer} onPress={onPress}>
            <View style={[
                styles.actionIconCircle,
                { backgroundColor: isFab ? t.primary : t.card },
                isFab && Shadow.blue,
                !isFab && { borderColor: t.border, borderWidth: 1 }
            ]}>
                <MaterialCommunityIcons
                    name={icon === 'overscan' ? 'scan-helper' : icon === 'edit-calendar' ? 'note-edit-outline' : icon === 'add' ? 'plus' : 'history'}
                    size={isFab ? 28 : 24}
                    color={isFab ? '#FFF' : color || t.primary}
                />
            </View>
            <Text style={[styles.actionLabel, { color: t.textSecondary }]}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.light,
    },
    avatarEmoji: {
        fontSize: 22,
    },
    helloText: {
        fontSize: Typography.sizes.md,
    },
    userName: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.round,
        marginRight: Spacing.md,
        ...Shadow.light,
    },
    creditsText: {
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.bold,
        marginLeft: Spacing.xs,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.light,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxxl,
    },
    trendCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    trendInfo: {
        gap: 2,
    },
    trendLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    trendValue: {
        fontSize: Typography.sizes.xl,
        fontWeight: 'bold',
    },
    trendUnit: {
        fontSize: 10,
        fontWeight: 'normal',
    },
    sparkline: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
        height: 40,
    },
    sparkBar: {
        width: 6,
        borderRadius: 3,
    },
    mainCard: {
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        ...Shadow.light,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.medium,
        marginLeft: Spacing.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.round,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: Spacing.xs,
    },
    statusText: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.medium,
    },
    timestamp: {
        fontSize: Typography.sizes.md,
        marginBottom: Spacing.lg,
    },
    glucoseRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: Spacing.xl,
    },
    glucoseValue: {
        fontSize: Typography.sizes.huge + 8,
        fontWeight: Typography.weights.bold,
    },
    glucoseUnit: {
        fontSize: Typography.sizes.xxl,
    },
    rangeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 20,
    },
    rangeBackground: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        marginRight: Spacing.xl,
    },
    rangeActive: {
        position: 'absolute',
        width: 12,
        height: 8,
        borderRadius: 4,
    },
    detailsLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsText: {
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.semibold,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },
    compactCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        alignItems: 'center',
        ...Shadow.light,
    },
    compactTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
    },
    donutPlaceholder: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    donutInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    donutProgress: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 6,
        borderColor: 'transparent',
    },
    compactValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },
    horizontalScroll: {
        gap: Spacing.md,
        paddingRight: Spacing.xl,
    },
    logChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        minWidth: 120,
    },
    logChipName: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    logChipValue: {
        fontSize: 10,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    actionContainer: {
        alignItems: 'center',
        width: '22%',
    },
    actionIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        ...Shadow.light,
    },
    actionLabel: {
        fontSize: Typography.sizes.xs + 1,
        fontWeight: Typography.weights.medium,
        textAlign: 'center',
    },
});
