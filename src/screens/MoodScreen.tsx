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
import { useSettingsStore, useMoodStore, useLogsStore, MoodEntry } from '../store';

const MOODS = [
    { key: 'great' as const, emoji: '😄', label: 'Great', color: '#4CAF50' },
    { key: 'good' as const, emoji: '🙂', label: 'Good', color: '#8BC34A' },
    { key: 'okay' as const, emoji: '😐', label: 'Okay', color: '#FF9800' },
    { key: 'low' as const, emoji: '😔', label: 'Low', color: '#FF5722' },
    { key: 'bad' as const, emoji: '😢', label: 'Bad', color: '#F44336' },
];

const SYMPTOMS = [
    '🥱 Fatigue', '🤕 Headache', '😵‍💫 Dizziness', '🤢 Nausea',
    '💧 Excessive thirst', '🚽 Frequent urination', '👁️ Blurred vision',
    '🤲 Numbness/tingling', '😰 Anxiety', '😠 Irritability',
    '🍽️ Cravings', '💤 Insomnia', '🤝 Shaking/tremors', '💦 Sweating',
];

export const MoodScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useSettingsStore();
    const { moodEntries, addMoodEntry } = useMoodStore();
    const { glucoseLogs } = useLogsStore();
    const t = getThemeColors(theme);

    const [selectedMood, setSelectedMood] = useState<MoodEntry['mood'] | null>(null);
    const [energy, setEnergy] = useState(3);
    const [stress, setStress] = useState(3);
    const [sleep, setSleep] = useState(3);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    const currentGlucose = useMemo(() => {
        if (glucoseLogs.length === 0) return null;
        return glucoseLogs[0].glucose_value;
    }, [glucoseLogs]);

    const handleSave = () => {
        if (!selectedMood) {
            Alert.alert('Select Mood', 'Please tap on how you\'re feeling to log your check-in.');
            return;
        }
        const moodInfo = MOODS.find(m => m.key === selectedMood)!;
        const entry: MoodEntry = {
            id: Date.now().toString(),
            mood: selectedMood,
            emoji: moodInfo.emoji,
            energyLevel: energy,
            stressLevel: stress,
            sleepQuality: sleep,
            symptoms: selectedSymptoms,
            notes: notes.trim() || undefined,
            glucoseAtTime: currentGlucose || undefined,
            createdAt: new Date().toISOString(),
        };
        addMoodEntry(entry);
        // Reset
        setSelectedMood(null);
        setEnergy(3);
        setStress(3);
        setSleep(3);
        setSelectedSymptoms([]);
        setNotes('');
        Alert.alert('🧠 Check-In Saved', 'Your wellness entry has been recorded. Consistent tracking helps identify patterns between mood and glucose.');
    };

    const toggleSymptom = (symptom: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
        );
    };

    // Stats
    const weekEntries = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return moodEntries.filter(e => new Date(e.createdAt) >= cutoff);
    }, [moodEntries]);

    const moodCorrelation = useMemo(() => {
        const withGlucose = moodEntries.filter(e => e.glucoseAtTime);
        if (withGlucose.length < 3) return null;

        const moodToNum = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };
        const goodMoodAvgGlucose = withGlucose
            .filter(e => moodToNum[e.mood] >= 4)
            .reduce((s, e) => s + (e.glucoseAtTime || 0), 0) / (withGlucose.filter(e => moodToNum[e.mood] >= 4).length || 1);

        const lowMoodAvgGlucose = withGlucose
            .filter(e => moodToNum[e.mood] <= 2)
            .reduce((s, e) => s + (e.glucoseAtTime || 0), 0) / (withGlucose.filter(e => moodToNum[e.mood] <= 2).length || 1);

        if (goodMoodAvgGlucose === 0 && lowMoodAvgGlucose === 0) return null;

        return {
            goodMoodAvg: Math.round(goodMoodAvgGlucose),
            lowMoodAvg: Math.round(lowMoodAvgGlucose),
            pattern: lowMoodAvgGlucose > goodMoodAvgGlucose + 20
                ? 'Higher glucose readings correlate with lower mood.'
                : lowMoodAvgGlucose < goodMoodAvgGlucose - 20
                    ? 'Lower glucose readings correlate with lower mood.'
                    : 'No strong correlation detected yet between mood and glucose.',
        };
    }, [moodEntries]);

    const avgMood = useMemo(() => {
        if (weekEntries.length === 0) return null;
        const moodValues = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };
        const avg = weekEntries.reduce((s, e) => s + moodValues[e.mood], 0) / weekEntries.length;
        return avg;
    }, [weekEntries]);

    const RatingBar = ({ label, value, onChange, lowLabel, highLabel, color }: any) => (
        <View style={styles.ratingSection}>
            <Text style={[styles.ratingLabel, { color: t.textSecondary }]}>{label}</Text>
            <View style={styles.ratingRow}>
                <Text style={[styles.ratingEdge, { color: t.textTertiary }]}>{lowLabel}</Text>
                {[1, 2, 3, 4, 5].map(v => (
                    <TouchableOpacity key={v} onPress={() => onChange(v)}
                        style={[styles.ratingDot, {
                            backgroundColor: v <= value ? color : t.glass,
                            width: v <= value ? 36 : 28,
                            height: v <= value ? 36 : 28,
                            borderRadius: v <= value ? 18 : 14,
                        }]}>
                        <Text style={[styles.ratingNum, { color: v <= value ? '#FFF' : t.textTertiary }]}>{v}</Text>
                    </TouchableOpacity>
                ))}
                <Text style={[styles.ratingEdge, { color: t.textTertiary }]}>{highLabel}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: t.glass }]}>
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Wellness</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Streak / Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: t.primary }]}>{weekEntries.length}</Text>
                            <Text style={[styles.summaryLabel, { color: t.textTertiary }]}>This Week</Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: t.border }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: avgMood && avgMood >= 3.5 ? '#4CAF50' : avgMood ? '#FF9800' : t.textTertiary }]}>
                                {avgMood ? avgMood.toFixed(1) : '--'}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: t.textTertiary }]}>Avg Mood</Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: t.border }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: t.text }]}>{moodEntries.length}</Text>
                            <Text style={[styles.summaryLabel, { color: t.textTertiary }]}>All Time</Text>
                        </View>
                    </View>
                </View>

                {/* Mood-Glucose Correlation */}
                {moodCorrelation && (
                    <View style={[styles.correlationCard, { backgroundColor: '#7B61FF10', borderColor: '#7B61FF25' }]}>
                        <View style={styles.correlationHeader}>
                            <MaterialCommunityIcons name="brain" size={20} color="#7B61FF" />
                            <Text style={[styles.correlationTitle, { color: t.text }]}>AI Mood-Glucose Insight</Text>
                        </View>
                        <Text style={[styles.correlationText, { color: t.textSecondary }]}>
                            {moodCorrelation.pattern}
                        </Text>
                        <View style={styles.correlationStats}>
                            {moodCorrelation.goodMoodAvg > 0 && (
                                <View style={[styles.corrStat, { backgroundColor: t.glass }]}>
                                    <Text style={{ fontSize: 14 }}>😊</Text>
                                    <Text style={[styles.corrValue, { color: '#4CAF50' }]}>{moodCorrelation.goodMoodAvg}</Text>
                                    <Text style={[styles.corrLabel, { color: t.textTertiary }]}>Avg glucose</Text>
                                </View>
                            )}
                            {moodCorrelation.lowMoodAvg > 0 && (
                                <View style={[styles.corrStat, { backgroundColor: t.glass }]}>
                                    <Text style={{ fontSize: 14 }}>😔</Text>
                                    <Text style={[styles.corrValue, { color: '#FF5252' }]}>{moodCorrelation.lowMoodAvg}</Text>
                                    <Text style={[styles.corrLabel, { color: t.textTertiary }]}>Avg glucose</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* How are you feeling? */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>🧠 HOW ARE YOU FEELING?</Text>
                <View style={styles.moodRow}>
                    {MOODS.map(mood => (
                        <TouchableOpacity key={mood.key}
                            style={[styles.moodBtn, {
                                backgroundColor: selectedMood === mood.key ? mood.color + '15' : t.card,
                                borderColor: selectedMood === mood.key ? mood.color : t.border,
                            }]}
                            onPress={() => setSelectedMood(mood.key)}>
                            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                            <Text style={[styles.moodLabel, { color: selectedMood === mood.key ? mood.color : t.textSecondary }]}>{mood.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedMood && (
                    <View style={[styles.detailCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        {/* Energy */}
                        <RatingBar label="⚡ ENERGY LEVEL" value={energy} onChange={setEnergy}
                            lowLabel="Low" highLabel="High" color="#FF9800" />

                        {/* Stress */}
                        <RatingBar label="😰 STRESS LEVEL" value={stress} onChange={setStress}
                            lowLabel="Calm" highLabel="Stressed" color="#FF5252" />

                        {/* Sleep */}
                        <RatingBar label="😴 SLEEP QUALITY" value={sleep} onChange={setSleep}
                            lowLabel="Poor" highLabel="Great" color="#7B61FF" />

                        {/* Symptoms */}
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>🩺 ANY SYMPTOMS?</Text>
                        <View style={styles.symptomGrid}>
                            {SYMPTOMS.map((symptom, i) => (
                                <TouchableOpacity key={i}
                                    style={[styles.symptomChip, {
                                        backgroundColor: selectedSymptoms.includes(symptom) ? t.error + '15' : t.glass,
                                        borderColor: selectedSymptoms.includes(symptom) ? t.error : 'transparent',
                                    }]}
                                    onPress={() => toggleSymptom(symptom)}>
                                    <Text style={[styles.symptomText, {
                                        color: selectedSymptoms.includes(symptom) ? t.error : t.textSecondary
                                    }]}>{symptom}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Current glucose tag */}
                        {currentGlucose && (
                            <View style={[styles.glucoseTag, { backgroundColor: t.glass }]}>
                                <Ionicons name="water" size={16} color={t.primary} />
                                <Text style={[styles.glucoseTagText, { color: t.textSecondary }]}>
                                    Current glucose: <Text style={{ fontWeight: 'bold', color: t.text }}>{currentGlucose} mg/dL</Text> (auto-linked)
                                </Text>
                            </View>
                        )}

                        {/* Notes */}
                        <TextInput
                            style={[styles.notesInput, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="How are you feeling today? (optional)"
                            placeholderTextColor={t.textTertiary}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.primary }]} onPress={handleSave}>
                            <Ionicons name="heart" size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>Save Check-In</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Recent Entries */}
                {moodEntries.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>📋 RECENT CHECK-INS</Text>
                        {moodEntries.slice(0, 8).map(entry => {
                            const moodInfo = MOODS.find(m => m.key === entry.mood)!;
                            return (
                                <View key={entry.id} style={[styles.entryCard, { backgroundColor: t.card, borderColor: t.border }]}>
                                    <View style={styles.entryTop}>
                                        <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.entryMood, { color: moodInfo.color }]}>{moodInfo.label}</Text>
                                            <Text style={[styles.entryTime, { color: t.textTertiary }]}>
                                                {new Date(entry.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        {entry.glucoseAtTime && (
                                            <View style={[styles.entryGlucose, { backgroundColor: t.glass }]}>
                                                <Text style={[styles.entryGlucoseText, { color: t.primary }]}>{entry.glucoseAtTime}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.entryMetrics}>
                                        <Text style={[styles.entryMetric, { color: t.textSecondary }]}>⚡ {entry.energyLevel}/5</Text>
                                        <Text style={[styles.entryMetric, { color: t.textSecondary }]}>😰 {entry.stressLevel}/5</Text>
                                        <Text style={[styles.entryMetric, { color: t.textSecondary }]}>😴 {entry.sleepQuality}/5</Text>
                                    </View>
                                    {entry.symptoms.length > 0 && (
                                        <Text style={[styles.entrySymptoms, { color: t.textTertiary }]}>
                                            {entry.symptoms.join(' · ')}
                                        </Text>
                                    )}
                                    {entry.notes && (
                                        <Text style={[styles.entryNotes, { color: t.textSecondary }]}>"{entry.notes}"</Text>
                                    )}
                                </View>
                            );
                        })}
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
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 22, fontWeight: 'bold' },
    summaryLabel: { fontSize: 9, fontWeight: '600', marginTop: 2 },
    summaryDivider: { width: 1, height: 30 },
    // Correlation
    correlationCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    correlationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    correlationTitle: { fontSize: 14, fontWeight: 'bold' },
    correlationText: { fontSize: 13, lineHeight: 20, marginBottom: Spacing.md },
    correlationStats: { flexDirection: 'row', gap: 8 },
    corrStat: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: BorderRadius.xl, gap: 2 },
    corrValue: { fontSize: 18, fontWeight: 'bold' },
    corrLabel: { fontSize: 9 },
    // Mood
    sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: Spacing.md },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: Spacing.lg },
    moodBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1.5, gap: 4 },
    moodEmoji: { fontSize: 28 },
    moodLabel: { fontSize: 10, fontWeight: '600' },
    // Detail
    detailCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    inputLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: 8 },
    // Rating
    ratingSection: { marginBottom: Spacing.md },
    ratingLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ratingEdge: { fontSize: 9, fontWeight: '600', width: 36 },
    ratingDot: { justifyContent: 'center', alignItems: 'center' },
    ratingNum: { fontSize: 13, fontWeight: 'bold' },
    // Symptoms
    symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    symptomChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.round, borderWidth: 1 },
    symptomText: { fontSize: 11, fontWeight: '600' },
    // Glucose tag
    glucoseTag: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: BorderRadius.xl, marginTop: Spacing.lg },
    glucoseTagText: { fontSize: 12 },
    // Notes
    notesInput: { height: 70, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, fontSize: 14, borderWidth: 1, marginTop: Spacing.lg, textAlignVertical: 'top' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: BorderRadius.xl, marginTop: Spacing.xl },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    // Entries
    entryCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 8 },
    entryTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    entryEmoji: { fontSize: 28 },
    entryMood: { fontSize: 14, fontWeight: 'bold' },
    entryTime: { fontSize: 11, marginTop: 1 },
    entryGlucose: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round },
    entryGlucoseText: { fontSize: 13, fontWeight: 'bold' },
    entryMetrics: { flexDirection: 'row', gap: 12, marginTop: 8 },
    entryMetric: { fontSize: 11, fontWeight: '600' },
    entrySymptoms: { fontSize: 10, marginTop: 6, lineHeight: 16 },
    entryNotes: { fontSize: 12, marginTop: 6, fontStyle: 'italic', lineHeight: 18 },
});
