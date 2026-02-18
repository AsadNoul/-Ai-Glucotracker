import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
    Alert, Modal, TextInput, Linking, Vibration, Share, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore, EmergencyContact } from '../store';

// ─── Step-by-step Protocols ─────────────────────────────────────────
const LOW_STEPS = [
    { step: 1, emoji: '🍬', title: 'Eat 15g fast-acting carbs', detail: '4 glucose tablets, 4 oz juice/regular soda, 1 tbsp sugar/honey, or 5 hard candies.' },
    { step: 2, emoji: '⏱️', title: 'Wait 15 minutes', detail: 'Sit down and rest. Do NOT drive, operate machinery, or exercise.' },
    { step: 3, emoji: '🩸', title: 'Re-check blood sugar', detail: 'Test your blood sugar again after 15 minutes.' },
    { step: 4, emoji: '🔁', title: 'Repeat if still below 70', detail: 'If glucose is still low, eat another 15g of carbs and wait 15 more minutes.' },
    { step: 5, emoji: '🥪', title: 'Eat a balanced snack', detail: 'Once above 70 mg/dL, eat a meal or snack with protein + complex carbs (e.g., peanut butter crackers, cheese & crackers).' },
];

const HIGH_STEPS = [
    { step: 1, emoji: '💧', title: 'Drink water immediately', detail: 'Stay hydrated. Drink 8-16 oz of water right away. Avoid sugary drinks.' },
    { step: 2, emoji: '🚶', title: 'Light physical activity', detail: 'A gentle 10-15 minute walk can help lower blood sugar. Stop if you feel unwell.' },
    { step: 3, emoji: '💊', title: 'Check your medication', detail: 'Ensure you haven\'t missed any insulin or medication doses. Take correction insulin if prescribed.' },
    { step: 4, emoji: '🧪', title: 'Check for ketones', detail: 'If above 240 mg/dL, test for ketones if you can. Positive ketones = call your doctor.' },
    { step: 5, emoji: '⏱️', title: 'Re-check in 30-60 min', detail: 'Test blood sugar again. If still above 300 mg/dL after 2 hours, call your doctor.' },
    { step: 6, emoji: '🆘', title: 'Seek emergency help', detail: 'Call 911 if: nausea/vomiting, confusion, difficulty breathing, fruity breath odor, rapid heartbeat.' },
];

const SEVERE_LOW_STEPS = [
    { step: 1, emoji: '🚫', title: 'Do NOT give food or drink', detail: 'If the person is unconscious or cannot swallow safely, do not try to feed them.' },
    { step: 2, emoji: '💉', title: 'Use Glucagon if available', detail: 'Inject glucagon kit (1mg IM) or use nasal glucagon (Baqsimi). Follow kit instructions.' },
    { step: 3, emoji: '📞', title: 'Call 911 immediately', detail: 'If no glucagon is available, or the person doesn\'t respond within 15 minutes, call emergency services.' },
    { step: 4, emoji: '🛌', title: 'Place in recovery position', detail: 'Turn the person on their side to prevent choking. Stay with them until help arrives.' },
    { step: 5, emoji: '🍬', title: 'When conscious, give sugar', detail: 'Once alert and able to swallow, give glucose tablets, juice, or sugar.' },
];

const DKA_SIGNS = [
    { symptom: 'Nausea or vomiting', emoji: '🤢' },
    { symptom: 'Abdominal pain', emoji: '😣' },
    { symptom: 'Fruity breath odor', emoji: '🍎' },
    { symptom: 'Rapid or deep breathing', emoji: '😮‍💨' },
    { symptom: 'Confusion or drowsiness', emoji: '😵‍💫' },
    { symptom: 'Extreme thirst', emoji: '🥵' },
    { symptom: 'Frequent urination', emoji: '🚻' },
    { symptom: 'Blurred vision', emoji: '👁️' },
];

// Emergency numbers by region
const EMERGENCY_NUMBERS: { region: string; flag: string; numbers: { service: string; number: string }[] }[] = [
    { region: 'UAE', flag: '🇦🇪', numbers: [{ service: 'Emergency', number: '999' }, { service: 'Ambulance', number: '998' }, { service: 'Police', number: '999' }] },
    { region: 'Saudi Arabia', flag: '🇸🇦', numbers: [{ service: 'Emergency', number: '911' }, { service: 'Ambulance', number: '997' }] },
    { region: 'Pakistan', flag: '🇵🇰', numbers: [{ service: 'Emergency', number: '1122' }, { service: 'Ambulance', number: '115' }] },
    { region: 'India', flag: '🇮🇳', numbers: [{ service: 'Emergency', number: '112' }, { service: 'Ambulance', number: '108' }] },
    { region: 'Kuwait', flag: '🇰🇼', numbers: [{ service: 'Emergency', number: '112' }] },
    { region: 'Qatar', flag: '🇶🇦', numbers: [{ service: 'Emergency', number: '999' }, { service: 'Ambulance', number: '999' }] },
    { region: 'Bahrain', flag: '🇧🇭', numbers: [{ service: 'Emergency', number: '999' }] },
    { region: 'Oman', flag: '🇴🇲', numbers: [{ service: 'Emergency', number: '9999' }] },
    { region: 'Egypt', flag: '🇪🇬', numbers: [{ service: 'Ambulance', number: '123' }] },
    { region: 'Jordan', flag: '🇯🇴', numbers: [{ service: 'Emergency', number: '911' }] },
    { region: 'USA / Canada', flag: '🇺🇸', numbers: [{ service: 'Emergency', number: '911' }] },
    { region: 'UK', flag: '🇬🇧', numbers: [{ service: 'Emergency', number: '999' }, { service: 'NHS Non-emergency', number: '111' }] },
    { region: 'Europe (General)', flag: '🇪🇺', numbers: [{ service: 'Emergency', number: '112' }] },
    { region: 'Australia', flag: '🇦🇺', numbers: [{ service: 'Emergency', number: '000' }] },
    { region: 'Bangladesh', flag: '🇧🇩', numbers: [{ service: 'Emergency', number: '999' }] },
    { region: 'Malaysia', flag: '🇲🇾', numbers: [{ service: 'Emergency', number: '999' }] },
    { region: 'Turkey', flag: '🇹🇷', numbers: [{ service: 'Emergency', number: '112' }] },
];

// Hypo symptoms checklist
const HYPO_SYMPTOMS = [
    { symptom: 'Shaking or trembling', emoji: '🫨' },
    { symptom: 'Fast heartbeat', emoji: '💓' },
    { symptom: 'Sweating', emoji: '💦' },
    { symptom: 'Dizziness or lightheadedness', emoji: '😵' },
    { symptom: 'Hunger', emoji: '😋' },
    { symptom: 'Irritability or anxiety', emoji: '😤' },
    { symptom: 'Pale skin', emoji: '😶' },
    { symptom: 'Tingling lips or tongue', emoji: '👄' },
    { symptom: 'Blurred vision', emoji: '👁️' },
    { symptom: 'Difficulty concentrating', emoji: '🧠' },
    { symptom: 'Headache', emoji: '🤕' },
    { symptom: 'Nightmares (nocturnal hypo)', emoji: '😱' },
];

export const EmergencyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, targetGlucoseMax, emergencyContacts, addEmergencyContact, removeEmergencyContact } = useSettingsStore();
    const { glucoseLogs } = useLogsStore();
    const t = getThemeColors(theme);

    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactRelation, setContactRelation] = useState('');
    const [activeProtocol, setActiveProtocol] = useState<'low' | 'high' | 'severe' | 'dka' | null>(null);
    const [emergencyNumbersShown, setEmergencyNumbersShown] = useState(false);
    const [symptomChecklist, setSymptomChecklist] = useState<Set<number>>(new Set());

    // Pulse animation for panic button
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const latestGlucose = useMemo(() => {
        if (glucoseLogs.length === 0) return null;
        return glucoseLogs[0];
    }, [glucoseLogs]);

    const glucoseStatus = useMemo(() => {
        if (!latestGlucose) return 'unknown';
        const v = latestGlucose.glucose_value;
        if (v < 54) return 'critical-low';
        if (v < 70) return 'low';
        if (v <= targetGlucoseMax) return 'normal';
        if (v <= 300) return 'high';
        return 'critical-high';
    }, [latestGlucose, targetGlucoseMax]);

    const latestGlucoseAge = useMemo(() => {
        if (!latestGlucose) return '';
        const mins = Math.round((Date.now() - new Date(latestGlucose.reading_time).getTime()) / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
        return `${Math.floor(mins / 1440)}d ago`;
    }, [latestGlucose]);

    // Count symptoms checked
    const symptomsChecked = symptomChecklist.size;
    const symptomSeverity = symptomsChecked >= 6 ? 'severe' : symptomsChecked >= 3 ? 'moderate' : symptomsChecked >= 1 ? 'mild' : 'none';

    const handleEmergencyCall = (number: string = '911') => {
        Alert.alert(`📞 Call ${number}`, `This will dial ${number}.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: `Call ${number}`, style: 'destructive', onPress: () => Linking.openURL(`tel:${number}`) },
        ]);
    };

    const handleCallContact = (contact: EmergencyContact) => {
        Alert.alert(`📞 Call ${contact.name}`, `Dial ${contact.phone}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => Linking.openURL(`tel:${contact.phone}`) },
        ]);
    };

    const handlePanicAlert = () => {
        Vibration.vibrate([0, 200, 100, 200, 100, 200, 100, 200]);
        if (emergencyContacts.length > 0) {
            const glucoseInfo = latestGlucose
                ? `Current glucose: ${latestGlucose.glucose_value} mg/dL (${latestGlucoseAge})`
                : 'No recent glucose reading';

            const message = `🆘 EMERGENCY ALERT from GlucoTrack AI\n\n${glucoseInfo}\nStatus: ${glucoseStatus.replace('-', ' ').toUpperCase()}\n${symptomsChecked > 0 ? `Symptoms: ${symptomsChecked} checked (${symptomSeverity})` : ''}\n\nPlease check on the user immediately.`;

            emergencyContacts.forEach(contact => {
                // In production: send SMS via API, send push notification
                Linking.openURL(`sms:${contact.phone}?body=${encodeURIComponent(message)}`).catch(() => { });
            });

            Alert.alert(
                '🆘 Alerts Sending',
                `Emergency SMS being sent to ${emergencyContacts.length} contact(s):\n${emergencyContacts.map(c => c.name).join(', ')}`,
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert('⚠️ No Contacts', 'Add emergency contacts to send alerts.', [
                { text: 'Cancel' },
                { text: 'Add Contact', onPress: () => setContactModalVisible(true) },
            ]);
        }
    };

    const handleShareMedicalInfo = async () => {
        const glucoseInfo = latestGlucose
            ? `Last Glucose: ${latestGlucose.glucose_value} mg/dL (${latestGlucoseAge})`
            : 'No glucose data';

        const recentReadings = glucoseLogs.slice(0, 5).map(l =>
            `  • ${l.glucose_value} mg/dL — ${new Date(l.reading_time).toLocaleString()}`
        ).join('\n');

        const message = `📋 MEDICAL INFORMATION — GlucoTrack AI\n\n${glucoseInfo}\n\nRecent Readings:\n${recentReadings || '  No readings available'}\n\nEmergency Contacts:\n${emergencyContacts.map(c => `  • ${c.name} (${c.relationship}): ${c.phone}`).join('\n') || '  None set'}\n\n⚠️ Generated by GlucoTrack AI. Please consult medical professionals for treatment decisions.`;

        try {
            await Share.share({ message, title: '📋 Medical Info — GlucoTrack AI' });
        } catch { }
    };

    const toggleSymptom = (idx: number) => {
        setSymptomChecklist(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const handleAddContact = () => {
        if (!contactName.trim() || !contactPhone.trim()) {
            Alert.alert('Required', 'Please enter name and phone number.');
            return;
        }
        addEmergencyContact({
            id: Date.now().toString(),
            name: contactName.trim(),
            phone: contactPhone.trim(),
            relationship: contactRelation.trim() || 'Other',
        });
        setContactName('');
        setContactPhone('');
        setContactRelation('');
        setContactModalVisible(false);
    };

    const handleRemoveContact = (contact: EmergencyContact) => {
        Alert.alert('Remove Contact', `Remove ${contact.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeEmergencyContact(contact.id) },
        ]);
    };

    const statusColor = glucoseStatus === 'critical-low' || glucoseStatus === 'critical-high' ? '#FF1744'
        : glucoseStatus === 'low' || glucoseStatus === 'high' ? '#FF9800'
            : glucoseStatus === 'normal' ? '#4CAF50' : t.textTertiary;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: t.glass }]}>
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Emergency</Text>
                <TouchableOpacity onPress={handleShareMedicalInfo} style={[styles.backBtn, { backgroundColor: t.glass }]}>
                    <Ionicons name="share-outline" size={22} color={t.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Current Status */}
                <View style={[styles.statusCard, { backgroundColor: statusColor + '10', borderColor: statusColor + '30' }]}>
                    <View style={styles.statusLeft}>
                        <MaterialCommunityIcons
                            name={glucoseStatus === 'normal' ? 'check-circle' : 'alert-circle'}
                            size={32}
                            color={statusColor}
                        />
                        <View>
                            <Text style={[styles.statusLabel, { color: t.textTertiary }]}>CURRENT STATUS</Text>
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {glucoseStatus === 'critical-low' ? '⚠️ CRITICALLY LOW' :
                                    glucoseStatus === 'low' ? '⚡ LOW BLOOD SUGAR' :
                                        glucoseStatus === 'high' ? '📈 HIGH BLOOD SUGAR' :
                                            glucoseStatus === 'critical-high' ? '🚨 CRITICALLY HIGH' :
                                                glucoseStatus === 'normal' ? '✅ In Range' : '-- No Reading --'}
                            </Text>
                            {latestGlucose && <Text style={[styles.statusAge, { color: t.textTertiary }]}>{latestGlucoseAge}</Text>}
                        </View>
                    </View>
                    {latestGlucose && (
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.statusValue, { color: statusColor }]}>{latestGlucose.glucose_value}</Text>
                            <Text style={[styles.statusUnit, { color: t.textTertiary }]}>mg/dL</Text>
                        </View>
                    )}
                </View>

                {/* Emergency Actions — 3 buttons */}
                <View style={styles.emergencyRow}>
                    <Animated.View style={[styles.panicWrap, { transform: [{ scale: pulseAnim }] }]}>
                        <TouchableOpacity style={[styles.panicBtn, { backgroundColor: '#FF1744' }]} onPress={handlePanicAlert}>
                            <Ionicons name="notifications" size={32} color="#FFF" />
                            <Text style={styles.panicBtnText}>PANIC{'\n'}ALERT</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <View style={styles.sideActions}>
                        <TouchableOpacity style={[styles.sideBtn, { backgroundColor: '#D50000' }]} onPress={() => setEmergencyNumbersShown(true)}>
                            <Ionicons name="call" size={22} color="#FFF" />
                            <Text style={styles.sideBtnText}>Emergency{'\n'}Numbers</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.sideBtn, { backgroundColor: '#FF6D00' }]} onPress={handleShareMedicalInfo}>
                            <Ionicons name="document-text" size={22} color="#FFF" />
                            <Text style={styles.sideBtnText}>Share{'\n'}Medical Info</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Symptom Checker ────────────────────────────────── */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>🩺 SYMPTOM CHECKER</Text>
                <View style={[styles.symptomCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[styles.symptomIntro, { color: t.textSecondary }]}>
                        Tap any symptoms you're experiencing right now:
                    </Text>
                    <View style={styles.symptomGrid}>
                        {HYPO_SYMPTOMS.map((s, i) => {
                            const isChecked = symptomChecklist.has(i);
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.symptomChip,
                                        { backgroundColor: isChecked ? '#FF174410' : t.glass, borderColor: isChecked ? '#FF1744' : t.border },
                                    ]}
                                    onPress={() => toggleSymptom(i)}
                                >
                                    <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
                                    <Text style={[styles.symptomChipText, { color: isChecked ? '#FF1744' : t.textSecondary }]}>{s.symptom}</Text>
                                    {isChecked && <Ionicons name="checkmark-circle" size={16} color="#FF1744" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {symptomsChecked > 0 && (
                        <View style={[styles.symptomResult, {
                            backgroundColor: symptomSeverity === 'severe' ? '#FF174415' : symptomSeverity === 'moderate' ? '#FF980015' : '#FFC10715',
                            borderColor: symptomSeverity === 'severe' ? '#FF174440' : symptomSeverity === 'moderate' ? '#FF980040' : '#FFC10740',
                        }]}>
                            <Text style={[styles.symptomResultTitle, {
                                color: symptomSeverity === 'severe' ? '#FF1744' : symptomSeverity === 'moderate' ? '#FF9800' : '#FFC107'
                            }]}>
                                {symptomSeverity === 'severe' ? '🚨 SEVERE — Seek immediate help!' :
                                    symptomSeverity === 'moderate' ? '⚠️ MODERATE — Follow emergency protocol now' :
                                        '💡 MILD — Monitor closely, follow 15-15 rule'}
                            </Text>
                            <Text style={[styles.symptomResultSub, { color: t.textTertiary }]}>
                                {symptomsChecked} of {HYPO_SYMPTOMS.length} symptoms checked.
                                {symptomSeverity === 'severe' && ' Call emergency services or use glucagon if unconscious.'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ─── Emergency Protocols ────────────────────────────── */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>📋 EMERGENCY PROTOCOLS</Text>

                {/* Low Blood Sugar */}
                <TouchableOpacity
                    style={[styles.protocolCard, { backgroundColor: '#FFC10710', borderColor: '#FFC10740' }]}
                    onPress={() => setActiveProtocol(activeProtocol === 'low' ? null : 'low')}
                >
                    <View style={styles.protocolHeader}>
                        <Text style={styles.protocolEmoji}>⬇️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.protocolTitle, { color: t.text }]}>Low Blood Sugar (Hypoglycemia)</Text>
                            <Text style={[styles.protocolSub, { color: t.textTertiary }]}>Below 70 mg/dL — The 15-15 Rule</Text>
                        </View>
                        <Ionicons name={activeProtocol === 'low' ? 'chevron-up' : 'chevron-down'} size={20} color={t.textTertiary} />
                    </View>
                    {activeProtocol === 'low' && (
                        <View style={styles.stepsContainer}>
                            {LOW_STEPS.map(s => (
                                <View key={s.step} style={[styles.stepRow, { borderBottomColor: t.border }]}>
                                    <View style={[styles.stepNum, { backgroundColor: '#FFC10720' }]}>
                                        <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.stepTitle, { color: t.text }]}>Step {s.step}: {s.title}</Text>
                                        <Text style={[styles.stepDetail, { color: t.textSecondary }]}>{s.detail}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>

                {/* High Blood Sugar */}
                <TouchableOpacity
                    style={[styles.protocolCard, { backgroundColor: '#FF525210', borderColor: '#FF525240' }]}
                    onPress={() => setActiveProtocol(activeProtocol === 'high' ? null : 'high')}
                >
                    <View style={styles.protocolHeader}>
                        <Text style={styles.protocolEmoji}>⬆️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.protocolTitle, { color: t.text }]}>High Blood Sugar (Hyperglycemia)</Text>
                            <Text style={[styles.protocolSub, { color: t.textTertiary }]}>Above 250 mg/dL — Take action</Text>
                        </View>
                        <Ionicons name={activeProtocol === 'high' ? 'chevron-up' : 'chevron-down'} size={20} color={t.textTertiary} />
                    </View>
                    {activeProtocol === 'high' && (
                        <View style={styles.stepsContainer}>
                            {HIGH_STEPS.map(s => (
                                <View key={s.step} style={[styles.stepRow, { borderBottomColor: t.border }]}>
                                    <View style={[styles.stepNum, { backgroundColor: '#FF525220' }]}>
                                        <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.stepTitle, { color: t.text }]}>Step {s.step}: {s.title}</Text>
                                        <Text style={[styles.stepDetail, { color: t.textSecondary }]}>{s.detail}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>

                {/* Severe Hypoglycemia — Unconscious Person */}
                <TouchableOpacity
                    style={[styles.protocolCard, { backgroundColor: '#D5000010', borderColor: '#D5000040' }]}
                    onPress={() => setActiveProtocol(activeProtocol === 'severe' ? null : 'severe')}
                >
                    <View style={styles.protocolHeader}>
                        <Text style={styles.protocolEmoji}>🚨</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.protocolTitle, { color: t.text }]}>Severe Low — Unconscious Person</Text>
                            <Text style={[styles.protocolSub, { color: '#D50000' }]}>CRITICAL — Glucagon / 911 Protocol</Text>
                        </View>
                        <Ionicons name={activeProtocol === 'severe' ? 'chevron-up' : 'chevron-down'} size={20} color={t.textTertiary} />
                    </View>
                    {activeProtocol === 'severe' && (
                        <View style={styles.stepsContainer}>
                            {SEVERE_LOW_STEPS.map(s => (
                                <View key={s.step} style={[styles.stepRow, { borderBottomColor: t.border }]}>
                                    <View style={[styles.stepNum, { backgroundColor: '#D5000020' }]}>
                                        <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.stepTitle, { color: t.text }]}>Step {s.step}: {s.title}</Text>
                                        <Text style={[styles.stepDetail, { color: t.textSecondary }]}>{s.detail}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>

                {/* DKA Signs */}
                <TouchableOpacity
                    style={[styles.protocolCard, { backgroundColor: '#9C27B010', borderColor: '#9C27B040' }]}
                    onPress={() => setActiveProtocol(activeProtocol === 'dka' ? null : 'dka')}
                >
                    <View style={styles.protocolHeader}>
                        <Text style={styles.protocolEmoji}>⚗️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.protocolTitle, { color: t.text }]}>DKA Warning Signs</Text>
                            <Text style={[styles.protocolSub, { color: t.textTertiary }]}>Diabetic Ketoacidosis — Know the signs</Text>
                        </View>
                        <Ionicons name={activeProtocol === 'dka' ? 'chevron-up' : 'chevron-down'} size={20} color={t.textTertiary} />
                    </View>
                    {activeProtocol === 'dka' && (
                        <View style={styles.stepsContainer}>
                            <Text style={[styles.dkaIntro, { color: t.textSecondary }]}>
                                DKA is a life-threatening condition. If you have 2+ of these symptoms AND blood sugar above 250 mg/dL, call emergency services:
                            </Text>
                            {DKA_SIGNS.map((s, i) => (
                                <View key={i} style={[styles.stepRow, { borderBottomColor: t.border }]}>
                                    <View style={[styles.stepNum, { backgroundColor: '#9C27B020' }]}>
                                        <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                                    </View>
                                    <Text style={[styles.stepTitle, { color: t.text, flex: 1 }]}>{s.symptom}</Text>
                                </View>
                            ))}
                            <TouchableOpacity style={[styles.dkaCallBtn, { backgroundColor: '#D50000' }]} onPress={() => handleEmergencyCall('911')}>
                                <Ionicons name="call" size={20} color="#FFF" />
                                <Text style={styles.dkaCallText}>Call Emergency Services</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </TouchableOpacity>

                {/* ─── Emergency Contacts ─────────────────────────────── */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>👥 EMERGENCY CONTACTS</Text>

                {emergencyContacts.length === 0 ? (
                    <View style={[styles.emptyContacts, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Ionicons name="people" size={40} color={t.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: t.text }]}>No Emergency Contacts</Text>
                        <Text style={[styles.emptySub, { color: t.textTertiary }]}>
                            Add trusted contacts who can help during a glucose emergency. They'll receive alerts with your glucose reading and location.
                        </Text>
                    </View>
                ) : (
                    emergencyContacts.map(contact => (
                        <View key={contact.id} style={[styles.contactCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            <View style={[styles.contactAvatar, { backgroundColor: t.primary + '15' }]}>
                                <Ionicons name="person" size={20} color={t.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.contactName, { color: t.text }]}>{contact.name}</Text>
                                <Text style={[styles.contactInfo, { color: t.textTertiary }]}>{contact.relationship} · {contact.phone}</Text>
                            </View>
                            <TouchableOpacity style={[styles.callBtn, { backgroundColor: '#4CAF5015' }]} onPress={() => handleCallContact(contact)}>
                                <Ionicons name="call" size={18} color="#4CAF50" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveContact(contact)}>
                                <Ionicons name="close" size={20} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                <TouchableOpacity style={[styles.addContactBtn, { borderColor: t.primary }]} onPress={() => setContactModalVisible(true)}>
                    <Ionicons name="add" size={20} color={t.primary} />
                    <Text style={[styles.addContactText, { color: t.primary }]}>Add Emergency Contact</Text>
                </TouchableOpacity>

                {/* ─── Emergency Kit Checklist ────────────────────────── */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>🎒 EMERGENCY KIT CHECKLIST</Text>
                <View style={[styles.checklistCard, { backgroundColor: t.card, borderColor: t.border }]}>
                    {[
                        { item: 'Glucose tablets or gel', emoji: '🍬' },
                        { item: 'Juice box (4 oz) or candy', emoji: '🧃' },
                        { item: 'Glucagon kit / Baqsimi nasal', emoji: '💉' },
                        { item: 'Blood glucose meter + test strips', emoji: '🩸' },
                        { item: 'Ketone test strips', emoji: '🧪' },
                        { item: 'Medical ID card / bracelet', emoji: '🪪' },
                        { item: 'Emergency contact list (printed)', emoji: '📋' },
                        { item: 'Insulin (if applicable)', emoji: '💊' },
                        { item: 'Snack (crackers + peanut butter)', emoji: '🥜' },
                        { item: 'Water bottle', emoji: '💧' },
                        { item: 'Phone charger / power bank', emoji: '🔋' },
                    ].map((item, i) => (
                        <View key={i} style={[styles.checkItem, i < 10 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
                            <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                            <Text style={[styles.checkText, { color: t.text }]}>{item.item}</Text>
                        </View>
                    ))}
                </View>

                {/* ─── Medical ID Card ────────────────────────────────── */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>🪪 MEDICAL ID</Text>
                <View style={[styles.medIdCard, { backgroundColor: '#D5000015', borderColor: '#D5000040' }]}>
                    <View style={styles.medIdHeader}>
                        <MaterialCommunityIcons name="medical-bag" size={24} color="#D50000" />
                        <Text style={[styles.medIdTitle, { color: '#D50000' }]}>MEDICAL ALERT</Text>
                    </View>
                    <View style={styles.medIdContent}>
                        <Text style={[styles.medIdLabel, { color: t.textTertiary }]}>CONDITION</Text>
                        <Text style={[styles.medIdValue, { color: t.text }]}>Diabetes</Text>
                        <Text style={[styles.medIdLabel, { color: t.textTertiary, marginTop: 8 }]}>LATEST GLUCOSE</Text>
                        <Text style={[styles.medIdValue, { color: t.text }]}>
                            {latestGlucose ? `${latestGlucose.glucose_value} mg/dL (${latestGlucoseAge})` : 'No data'}
                        </Text>
                        <Text style={[styles.medIdLabel, { color: t.textTertiary, marginTop: 8 }]}>EMERGENCY CONTACTS</Text>
                        {emergencyContacts.length > 0 ? emergencyContacts.map(c => (
                            <Text key={c.id} style={[styles.medIdValue, { color: t.text }]}>{c.name}: {c.phone}</Text>
                        )) : (
                            <Text style={[styles.medIdValue, { color: t.textTertiary }]}>None set</Text>
                        )}
                    </View>
                    <TouchableOpacity style={[styles.shareIdBtn, { backgroundColor: '#D50000' }]} onPress={handleShareMedicalInfo}>
                        <Ionicons name="share" size={16} color="#FFF" />
                        <Text style={styles.shareIdText}>Share Medical Info</Text>
                    </TouchableOpacity>
                </View>

                {/* Disclaimer */}
                <View style={[styles.disclaimer, { backgroundColor: t.glass }]}>
                    <Ionicons name="warning" size={18} color="#FF9800" />
                    <Text style={[styles.disclaimerText, { color: t.textTertiary }]}>
                        This app is NOT a substitute for professional medical advice. In a real emergency, ALWAYS call your local emergency number immediately. These protocols are for guidance only.
                    </Text>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* ═══ Emergency Numbers Modal ════════════════════════════ */}
            <Modal animationType="slide" transparent visible={emergencyNumbersShown} onRequestClose={() => setEmergencyNumbersShown(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>📞 Emergency Numbers</Text>
                            <TouchableOpacity onPress={() => setEmergencyNumbersShown(false)}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.modalSub, { color: t.textTertiary }]}>
                            Tap any number to dial. Select your country:
                        </Text>
                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {EMERGENCY_NUMBERS.map((region, ri) => (
                                <View key={ri} style={[styles.emergencyRegion, { borderColor: t.border }]}>
                                    <Text style={[styles.emergencyRegionTitle, { color: t.text }]}>{region.flag} {region.region}</Text>
                                    {region.numbers.map((num, ni) => (
                                        <TouchableOpacity
                                            key={ni}
                                            style={[styles.emergencyNumRow, { backgroundColor: t.glass }]}
                                            onPress={() => handleEmergencyCall(num.number)}
                                        >
                                            <Ionicons name="call" size={18} color="#FF1744" />
                                            <Text style={[styles.emergencyNumService, { color: t.textSecondary }]}>{num.service}</Text>
                                            <Text style={[styles.emergencyNumValue, { color: '#FF1744' }]}>{num.number}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ═══ Add Contact Modal ══════════════════════════════════ */}
            <Modal animationType="slide" transparent visible={contactModalVisible} onRequestClose={() => setContactModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>Add Emergency Contact</Text>
                            <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="Contact name"
                            placeholderTextColor={t.textTertiary}
                            value={contactName}
                            onChangeText={setContactName}
                        />

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>PHONE NUMBER</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="Phone number"
                            placeholderTextColor={t.textTertiary}
                            value={contactPhone}
                            onChangeText={setContactPhone}
                            keyboardType="phone-pad"
                        />

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>RELATIONSHIP</Text>
                        <View style={styles.relationRow}>
                            {['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Doctor', 'Nurse', 'Other'].map(rel => (
                                <TouchableOpacity key={rel}
                                    style={[styles.relChip, contactRelation === rel && { backgroundColor: t.primary + '15', borderColor: t.primary }]}
                                    onPress={() => setContactRelation(rel)}>
                                    <Text style={[styles.relText, { color: contactRelation === rel ? t.primary : t.textSecondary }]}>{rel}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.primary }]} onPress={handleAddContact}>
                            <Ionicons name="person-add" size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>Save Contact</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    backBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
    // Status
    statusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1.5, marginBottom: Spacing.lg },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    statusLabel: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
    statusText: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
    statusAge: { fontSize: 10, marginTop: 2 },
    statusValue: { fontSize: 36, fontWeight: 'bold' },
    statusUnit: { fontSize: 10, fontWeight: '600' },
    // Emergency Actions
    emergencyRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
    panicWrap: { flex: 1 },
    panicBtn: { flex: 1, height: 100, borderRadius: BorderRadius.xxl, justifyContent: 'center', alignItems: 'center', gap: 4, ...Shadow.dark },
    panicBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, textAlign: 'center', lineHeight: 16 },
    sideActions: { flex: 1, gap: 8 },
    sideBtn: { flex: 1, borderRadius: BorderRadius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
    sideBtnText: { color: '#FFF', fontWeight: '700', fontSize: 11, lineHeight: 14 },
    // Section
    sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: Spacing.md },
    // Symptom Checker
    symptomCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md },
    symptomIntro: { fontSize: 13, marginBottom: Spacing.md, lineHeight: 19 },
    symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    symptomChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
    symptomChipText: { fontSize: 12, fontWeight: '600' },
    symptomResult: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, marginTop: Spacing.md },
    symptomResultTitle: { fontSize: 13, fontWeight: '700' },
    symptomResultSub: { fontSize: 11, marginTop: 4, lineHeight: 16 },
    // Protocol
    protocolCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.md, overflow: 'hidden' },
    protocolHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
    protocolEmoji: { fontSize: 28 },
    protocolTitle: { fontSize: Typography.sizes.md, fontWeight: 'bold' },
    protocolSub: { fontSize: 11, marginTop: 2 },
    stepsContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.md, borderBottomWidth: 1, gap: Spacing.md },
    stepNum: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    stepTitle: { fontSize: 14, fontWeight: '600' },
    stepDetail: { fontSize: 12, lineHeight: 18, marginTop: 2 },
    dkaIntro: { fontSize: 12, lineHeight: 18, marginBottom: Spacing.md },
    dkaCallBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: BorderRadius.xl, paddingVertical: 14, marginTop: Spacing.md },
    dkaCallText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    // Contacts
    emptyContacts: { padding: Spacing.xxl, borderRadius: BorderRadius.xxl, borderWidth: 1, alignItems: 'center', gap: 8 },
    emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: 'bold' },
    emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
    contactCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 8, gap: Spacing.md },
    contactAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    contactName: { fontSize: 14, fontWeight: '600' },
    contactInfo: { fontSize: 11, marginTop: 2 },
    callBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    addContactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 4 },
    addContactText: { fontWeight: 'bold', fontSize: 14 },
    // Checklist
    checklistCard: { padding: Spacing.lg, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
    checkText: { fontSize: 14, fontWeight: '500' },
    // Medical ID
    medIdCard: { borderRadius: BorderRadius.xxl, borderWidth: 1.5, padding: Spacing.lg, marginBottom: Spacing.xl },
    medIdHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
    medIdTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    medIdContent: { marginBottom: Spacing.md },
    medIdLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    medIdValue: { fontSize: 14, fontWeight: '600' },
    shareIdBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: BorderRadius.xl, paddingVertical: 12 },
    shareIdText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    // Disclaimer
    disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: Spacing.lg, borderRadius: BorderRadius.xl },
    disclaimerText: { flex: 1, fontSize: 11, lineHeight: 17 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    modalTitle: { fontSize: Typography.sizes.xl, fontWeight: 'bold' },
    modalSub: { fontSize: 12, marginBottom: Spacing.md },
    // Emergency Numbers Modal
    emergencyRegion: { borderBottomWidth: 1, paddingVertical: Spacing.sm, marginBottom: 4 },
    emergencyRegionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
    emergencyNumRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: BorderRadius.md, marginBottom: 4 },
    emergencyNumService: { flex: 1, fontSize: 13, fontWeight: '500' },
    emergencyNumValue: { fontSize: 18, fontWeight: '800' },
    // Add Contact
    inputLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6, marginTop: Spacing.md },
    input: { height: 48, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, fontSize: 14, borderWidth: 1 },
    relationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    relChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.round, borderWidth: 1, borderColor: 'transparent' },
    relText: { fontSize: 12, fontWeight: '600' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: BorderRadius.xl, marginTop: Spacing.xl },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
