import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useAuthStore, useLogsStore, useSubscriptionStore, useSettingsStore } from '../store';

type TabType = 'carbs' | 'glucose' | 'insulin';

export const AddLogScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { user } = useAuthStore();
    const { theme } = useSettingsStore();
    const { addGlucoseLog, addCarbLog, addInsulinLog } = useLogsStore();
    const { creditsRemaining, decrementCredit } = useSubscriptionStore();

    const t = getThemeColors(theme);

    const [activeTab, setActiveTab] = useState<TabType>(route.params?.tab || 'carbs');
    const [loading, setLoading] = useState(false);

    // Carbs state
    const [foodName, setFoodName] = useState('');
    const [carbs, setCarbs] = useState('');

    // Glucose state
    const [glucoseValue, setGlucoseValue] = useState('');
    const [glucoseContext, setGlucoseContext] = useState('Before Meal');

    // Insulin state
    const [insulinUnits, setInsulinUnits] = useState('');
    const [insulinType, setInsulinType] = useState<'rapid' | 'long-acting' | 'mixed'>('rapid');

    useEffect(() => {
        if (route.params?.scannedFood) {
            setFoodName(route.params.scannedFood);
        }
        if (route.params?.scannedCarbs) {
            setCarbs(route.params.scannedCarbs.toString());
        }
    }, [route.params]);

    const handleSave = async () => {
        if (loading) return;
        setLoading(true);

        try {
            if (activeTab === 'carbs') {
                if (!foodName || !carbs) throw new Error('Please fill all fields');
                if (creditsRemaining <= 0) {
                    Alert.alert('No Credits', 'Purchase more credits to log new meals.', [
                        { text: 'Store', onPress: () => navigation.navigate('CreditsStore') },
                        { text: 'Cancel', style: 'cancel' }
                    ]);
                    setLoading(false);
                    return;
                }
                addCarbLog({
                    id: Math.random().toString(),
                    user_id: user?.id || 'guest',
                    food_name: foodName,
                    estimated_carbs: parseInt(carbs),
                    created_at: new Date().toISOString()
                });
                decrementCredit();
            } else if (activeTab === 'glucose') {
                if (!glucoseValue) throw new Error('Please enter glucose value');
                addGlucoseLog({
                    id: Math.random().toString(),
                    user_id: user?.id || 'guest',
                    glucose_value: parseInt(glucoseValue),
                    reading_time: new Date().toISOString(),
                    created_at: new Date().toISOString()
                });
            } else {
                if (!insulinUnits) throw new Error('Please enter insulin units');
                addInsulinLog({
                    id: Math.random().toString(),
                    user_id: user?.id || 'guest',
                    units: parseFloat(insulinUnits),
                    type: insulinType,
                    timestamp: new Date().toISOString(),
                    created_at: new Date().toISOString()
                });
            }

            Alert.alert('Success', 'Log saved successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const ContextChip = ({ label }: { label: string }) => (
        <TouchableOpacity
            style={[
                styles.chip,
                { backgroundColor: glucoseContext === label ? t.primary : t.glass },
                glucoseContext === label && Shadow.blue
            ]}
            onPress={() => setGlucoseContext(label)}
        >
            <Text style={[styles.chipText, { color: glucoseContext === label ? '#FFF' : t.textSecondary }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: t.glass }]}>
                    <Ionicons name="close" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Add New Log</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.saveButton, { backgroundColor: t.primary }]}>
                    {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <View style={[styles.tabContainer, { backgroundColor: t.card, borderBottomColor: t.border }]}>
                {(['carbs', 'glucose', 'insulin'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && { borderBottomColor: t.primary }]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? t.primary : t.textTertiary }]}>
                            {tab.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'carbs' && (
                    <View style={styles.formContainer}>
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>FOOD NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.card, color: t.text, borderColor: t.border }]}
                            placeholder="What did you eat?"
                            placeholderTextColor={t.textTertiary}
                            value={foodName}
                            onChangeText={setFoodName}
                        />

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>ESTIMATED CARBS (G)</Text>
                        <View style={styles.carbsInputRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: t.card, color: t.text, borderColor: t.border }]}
                                placeholder="0"
                                placeholderTextColor={t.textTertiary}
                                keyboardType="numeric"
                                value={carbs}
                                onChangeText={setCarbs}
                            />
                            <TouchableOpacity
                                style={[styles.calcButton, { backgroundColor: t.primary + '20' }]}
                                onPress={() => navigation.navigate('ScanMeal')}
                            >
                                <Ionicons name="scan" size={20} color={t.primary} />
                                <Text style={[styles.calcButtonText, { color: t.primary }]}>AI Estimate</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>QUICK ADD</Text>
                        <View style={styles.chipRow}>
                            {['Apple (15g)', 'Banana (27g)', 'Bread (12g)', 'Egg (1g)'].map((food) => (
                                <TouchableOpacity
                                    key={food}
                                    style={[styles.chip, { backgroundColor: t.glass }]}
                                    onPress={() => {
                                        const name = food.split(' (')[0];
                                        const value = food.match(/\d+/)![0];
                                        setFoodName(name);
                                        setCarbs(value);
                                    }}
                                >
                                    <Text style={[styles.chipText, { color: t.textSecondary }]}>{food}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'glucose' && (
                    <View style={styles.formContainer}>
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>GLUCOSE READING (MG/DL)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.card, color: t.text, borderColor: t.border, fontSize: 32, height: 80, textAlign: 'center' }]}
                            placeholder="0"
                            placeholderTextColor={t.textTertiary}
                            keyboardType="numeric"
                            value={glucoseValue}
                            onChangeText={setGlucoseValue}
                            autoFocus
                        />

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>CONTEXT</Text>
                        <View style={styles.chipRow}>
                            {['Fasted', 'Before Meal', '1h Post-Meal', '2h Post-Meal', 'Bedtime'].map((ctx) => (
                                <ContextChip key={ctx} label={ctx} />
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'insulin' && (
                    <View style={styles.formContainer}>
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>INSULIN UNITS</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.card, color: t.text, borderColor: t.border, fontSize: 32, height: 80, textAlign: 'center' }]}
                            placeholder="0.0"
                            placeholderTextColor={t.textTertiary}
                            keyboardType="numeric"
                            value={insulinUnits}
                            onChangeText={setInsulinUnits}
                        />

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>INSULIN TYPE</Text>
                        <View style={styles.typeRow}>
                            {(['rapid', 'long-acting', 'mixed'] as const).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        { backgroundColor: insulinType === type ? t.primary : t.card, borderColor: t.border },
                                        insulinType === type && Shadow.blue
                                    ]}
                                    onPress={() => setInsulinType(type)}
                                >
                                    <Text style={[styles.typeButtonText, { color: insulinType === type ? '#FFF' : t.textSecondary }]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.lg,
        minWidth: 60,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    content: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxxl,
    },
    formContainer: {
        gap: Spacing.md,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginTop: Spacing.md,
        marginBottom: 4,
    },
    input: {
        height: 56,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        fontSize: Typography.sizes.md,
        borderWidth: 1,
    },
    carbsInputRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        alignItems: 'center',
    },
    calcButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 56,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.xl,
    },
    calcButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 4,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: BorderRadius.round,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        height: 44,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    typeButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
    }
});
