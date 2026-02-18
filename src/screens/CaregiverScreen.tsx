import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert, FlatList, Modal, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore } from '../store';

interface Caregiver {
    id: string;
    name: string;
    phone: string;
    email: string;
    relationship: string;
    shareGlucose: boolean;
    shareMeals: boolean;
    shareActivity: boolean;
    alertOnLow: boolean;
    alertOnHigh: boolean;
}

export const CaregiverScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, targetGlucoseMin, targetGlucoseMax, glucoseUnit } = useSettingsStore();
    const { glucoseLogs, carbLogs } = useLogsStore();
    const t = getThemeColors(theme);

    const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [editCg, setEditCg] = useState<Caregiver | null>(null);

    // Add form
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [relationship, setRelationship] = useState('');

    const relationships = ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Doctor', 'Nurse', 'Other'];

    // Latest glucose for sharing
    const latestGlucose = useMemo(() => {
        if (glucoseLogs.length === 0) return null;
        return glucoseLogs[0];
    }, [glucoseLogs]);

    const handleAdd = () => {
        if (!name.trim() || (!phone.trim() && !email.trim())) {
            Alert.alert('Error', 'Please add a name and either phone or email.');
            return;
        }
        const cg: Caregiver = {
            id: Date.now().toString(),
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            relationship: relationship || 'Other',
            shareGlucose: true,
            shareMeals: true,
            shareActivity: true,
            alertOnLow: true,
            alertOnHigh: true,
        };
        setCaregivers(prev => [...prev, cg]);
        setName(''); setPhone(''); setEmail(''); setRelationship('');
        setShowAdd(false);
        Alert.alert('✅ Added', `${cg.name} has been added as a caregiver.`);
    };

    const handleRemove = (id: string) => {
        Alert.alert('Remove Caregiver', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setCaregivers(prev => prev.filter(c => c.id !== id)) },
        ]);
    };

    const toggleSetting = (id: string, key: keyof Caregiver) => {
        setCaregivers(prev => prev.map(c => c.id === id ? { ...c, [key]: !c[key] } : c));
    };

    // Share data via message
    const shareDataWith = async (cg: Caregiver) => {
        let message = `📊 GlucoTrack AI — Health Update\n\n`;
        if (latestGlucose) {
            message += `🩸 Latest Glucose: ${latestGlucose.glucose_value} ${glucoseUnit}\n`;
            message += `🕑 At: ${new Date(latestGlucose.reading_time).toLocaleString()}\n`;
            message += `📏 Target: ${targetGlucoseMin}–${targetGlucoseMax} ${glucoseUnit}\n`;
            const status = latestGlucose.glucose_value >= targetGlucoseMin && latestGlucose.glucose_value <= targetGlucoseMax ? '✅ In Range' : latestGlucose.glucose_value > targetGlucoseMax ? '⚠️ Above Range' : '🔴 Below Range';
            message += `Status: ${status}\n`;
        }
        const last24h = glucoseLogs.filter(l => new Date(l.reading_time) > new Date(Date.now() - 24 * 60 * 60 * 1000));
        if (last24h.length > 0) {
            const avg = Math.round(last24h.reduce((s, l) => s + l.glucose_value, 0) / last24h.length);
            const inRange = last24h.filter(l => l.glucose_value >= targetGlucoseMin && l.glucose_value <= targetGlucoseMax).length;
            const tir = Math.round((inRange / last24h.length) * 100);
            message += `\n📈 Last 24h: Avg ${avg} ${glucoseUnit}, TIR ${tir}%, ${last24h.length} readings\n`;
        }
        message += `\n— Sent from GlucoTrack AI`;

        if (cg.phone) {
            const smsUrl = `sms:${cg.phone}?body=${encodeURIComponent(message)}`;
            try {
                await Linking.openURL(smsUrl);
            } catch {
                Alert.alert('Error', 'Could not open messaging app.');
            }
        } else if (cg.email) {
            const emailUrl = `mailto:${cg.email}?subject=Health Update&body=${encodeURIComponent(message)}`;
            try {
                await Linking.openURL(emailUrl);
            } catch {
                Alert.alert('Error', 'Could not open email app.');
            }
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Caregiver Sharing</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={[styles.heroCard, { backgroundColor: t.primary + '08', borderColor: t.primary + '20' }]}>
                    <MaterialCommunityIcons name="account-group" size={48} color={t.primary} />
                    <Text style={[styles.heroTitle, { color: t.text }]}>Share with your care team</Text>
                    <Text style={[styles.heroSubtitle, { color: t.textSecondary }]}>
                        Let family members, caregivers, or healthcare providers stay updated on your glucose data.
                    </Text>
                </View>

                {/* Current Status */}
                {latestGlucose && (
                    <View style={[styles.statusCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Text style={[styles.statusLabel, { color: t.textTertiary }]}>SHARING STATUS</Text>
                        <View style={styles.statusRow}>
                            <View>
                                <Text style={[styles.statusValue, { color: t.text }]}>{latestGlucose.glucose_value} {glucoseUnit}</Text>
                                <Text style={[styles.statusTime, { color: t.textTertiary }]}>Last reading — {new Date(latestGlucose.reading_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: latestGlucose.glucose_value >= targetGlucoseMin && latestGlucose.glucose_value <= targetGlucoseMax ? '#E8F5E9' : '#FFF3E0'
                            }]}>
                                <Text style={{
                                    color: latestGlucose.glucose_value >= targetGlucoseMin && latestGlucose.glucose_value <= targetGlucoseMax ? '#2E7D32' : '#E65100',
                                    fontSize: 12, fontWeight: '700'
                                }}>
                                    {latestGlucose.glucose_value >= targetGlucoseMin && latestGlucose.glucose_value <= targetGlucoseMax ? 'In Range ✅' : 'Out of Range ⚠️'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Caregivers List */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>👥 CAREGIVERS ({caregivers.length})</Text>

                {caregivers.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <MaterialCommunityIcons name="account-plus" size={48} color={t.textTertiary} />
                        <Text style={[styles.emptyText, { color: t.textSecondary }]}>No caregivers added yet</Text>
                        <Text style={[styles.emptyHint, { color: t.textTertiary }]}>Add family members or doctors to share your data</Text>
                    </View>
                ) : (
                    caregivers.map(cg => (
                        <View key={cg.id} style={[styles.caregiverCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            <View style={styles.cgHeader}>
                                <View style={[styles.avatar, { backgroundColor: t.primary + '15' }]}>
                                    <Text style={styles.avatarText}>{cg.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cgName, { color: t.text }]}>{cg.name}</Text>
                                    <Text style={[styles.cgRelation, { color: t.textTertiary }]}>{cg.relationship} • {cg.phone || cg.email}</Text>
                                </View>
                            </View>

                            {/* Share Settings */}
                            <View style={styles.settingsGrid}>
                                <ToggleRow label="Share Glucose" value={cg.shareGlucose} onToggle={() => toggleSetting(cg.id, 'shareGlucose')} theme={t} />
                                <ToggleRow label="Share Meals" value={cg.shareMeals} onToggle={() => toggleSetting(cg.id, 'shareMeals')} theme={t} />
                                <ToggleRow label="Low Alert" value={cg.alertOnLow} onToggle={() => toggleSetting(cg.id, 'alertOnLow')} theme={t} icon="🔴" />
                                <ToggleRow label="High Alert" value={cg.alertOnHigh} onToggle={() => toggleSetting(cg.id, 'alertOnHigh')} theme={t} icon="🟠" />
                            </View>

                            {/* Actions */}
                            <View style={styles.cgActions}>
                                <TouchableOpacity style={[styles.shareNowBtn, { backgroundColor: t.primary }]} onPress={() => shareDataWith(cg)}>
                                    <Ionicons name="share-outline" size={16} color="#FFF" />
                                    <Text style={styles.shareNowText}>Send Update</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.removeBtn, { backgroundColor: '#FF5252' + '10' }]} onPress={() => handleRemove(cg.id)}>
                                    <Ionicons name="trash-outline" size={16} color="#FF5252" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                {/* Add Button */}
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: t.primary }]} onPress={() => setShowAdd(true)}>
                    <Ionicons name="person-add" size={20} color="#FFF" />
                    <Text style={styles.addBtnText}>Add Caregiver</Text>
                </TouchableOpacity>

                {/* Privacy Note */}
                <View style={[styles.privacyBox, { backgroundColor: t.glass }]}>
                    <Ionicons name="shield-checkmark" size={16} color={t.textTertiary} />
                    <Text style={[styles.privacyText, { color: t.textTertiary }]}>
                        Data is shared only when you explicitly tap "Send Update". No automatic data sharing happens without your consent.
                    </Text>
                </View>
            </ScrollView>

            {/* Add Modal */}
            <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: t.text }]}>Add Caregiver</Text>
                        <TouchableOpacity onPress={() => setShowAdd(false)}>
                            <Ionicons name="close-circle" size={28} color={t.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
                        <Text style={[styles.formLabel, { color: t.textSecondary }]}>Name *</Text>
                        <TextInput style={[styles.formInput, { color: t.text, borderColor: t.border, backgroundColor: t.card }]} value={name} onChangeText={setName} placeholder="Enter name" placeholderTextColor={t.textTertiary} />

                        <Text style={[styles.formLabel, { color: t.textSecondary }]}>Phone</Text>
                        <TextInput style={[styles.formInput, { color: t.text, borderColor: t.border, backgroundColor: t.card }]} value={phone} onChangeText={setPhone} placeholder="+1234567890" placeholderTextColor={t.textTertiary} keyboardType="phone-pad" />

                        <Text style={[styles.formLabel, { color: t.textSecondary }]}>Email</Text>
                        <TextInput style={[styles.formInput, { color: t.text, borderColor: t.border, backgroundColor: t.card }]} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={t.textTertiary} keyboardType="email-address" />

                        <Text style={[styles.formLabel, { color: t.textSecondary }]}>Relationship</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: Spacing.lg }}>
                            {relationships.map(r => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.relChip, { backgroundColor: relationship === r ? t.primary : t.card, borderColor: relationship === r ? t.primary : t.border }]}
                                    onPress={() => setRelationship(r)}
                                >
                                    <Text style={{ color: relationship === r ? '#FFF' : t.textSecondary, fontSize: 13, fontWeight: '600' }}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={[styles.addCgBtn, { backgroundColor: t.primary }]} onPress={handleAdd}>
                            <Text style={styles.addCgBtnText}>Add Caregiver</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const ToggleRow = ({ label, value, onToggle, theme, icon }: any) => (
    <TouchableOpacity style={tr.row} onPress={onToggle}>
        {icon && <Text style={{ fontSize: 12, marginRight: 4 }}>{icon}</Text>}
        <Text style={[tr.label, { color: theme.textSecondary }]}>{label}</Text>
        <View style={[tr.toggle, { backgroundColor: value ? '#4CAF50' : theme.glass }]}>
            <View style={[tr.dot, { backgroundColor: '#FFF', transform: [{ translateX: value ? 16 : 0 }] }]} />
        </View>
    </TouchableOpacity>
);
const tr = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    label: { flex: 1, fontSize: 13 },
    toggle: { width: 36, height: 20, borderRadius: 10, padding: 2, justifyContent: 'center' },
    dot: { width: 16, height: 16, borderRadius: 8 },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xl, marginBottom: Spacing.sm },
    // Hero
    heroCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center' },
    heroTitle: { fontSize: 20, fontWeight: '800', marginTop: Spacing.md, textAlign: 'center' },
    heroSubtitle: { fontSize: 14, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
    // Status
    statusCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, marginTop: Spacing.md, ...Shadow.light },
    statusLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusValue: { fontSize: 24, fontWeight: '800' },
    statusTime: { fontSize: 12, marginTop: 2 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    // Empty
    emptyCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', gap: 8 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    emptyHint: { fontSize: 13 },
    // Caregiver
    caregiverCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.light },
    cgHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#0A85FF' },
    cgName: { fontSize: 16, fontWeight: '700' },
    cgRelation: { fontSize: 12, marginTop: 2 },
    settingsGrid: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 8, marginTop: 4 },
    cgActions: { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
    shareNowBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: BorderRadius.lg, paddingVertical: 10 },
    shareNowText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    removeBtn: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    // Add btn
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: BorderRadius.xl, paddingVertical: 16, marginTop: Spacing.md },
    addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    // Privacy
    privacyBox: { flexDirection: 'row', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.lg, gap: 8, alignItems: 'flex-start' },
    privacyText: { flex: 1, fontSize: 11, lineHeight: 16 },
    // Modal
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    formLabel: { fontSize: 13, fontWeight: '600', marginTop: Spacing.md, marginBottom: 6 },
    formInput: { borderRadius: BorderRadius.lg, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    relChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    addCgBtn: { borderRadius: BorderRadius.xl, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.md },
    addCgBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
