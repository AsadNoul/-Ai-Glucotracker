import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useAuthStore, useLogsStore, useSubscriptionStore, useSettingsStore } from '../store';

type TabType = 'carbs' | 'glucose' | 'insulin';

// ─── Comprehensive Food Database with GI + carbs ────────────────────────────
const FOOD_DATABASE = [
    // Fruits
    { name: 'Apple', carbs: 14, gi: 36, category: 'Fruits', emoji: '🍎', serving: '1 medium' },
    { name: 'Banana', carbs: 27, gi: 51, category: 'Fruits', emoji: '🍌', serving: '1 medium' },
    { name: 'Orange', carbs: 12, gi: 43, category: 'Fruits', emoji: '🍊', serving: '1 medium' },
    { name: 'Grapes', carbs: 16, gi: 59, category: 'Fruits', emoji: '🍇', serving: '1 cup' },
    { name: 'Mango', carbs: 25, gi: 51, category: 'Fruits', emoji: '🥭', serving: '1 cup' },
    { name: 'Watermelon', carbs: 11, gi: 76, category: 'Fruits', emoji: '🍉', serving: '1 cup' },
    { name: 'Strawberries', carbs: 8, gi: 41, category: 'Fruits', emoji: '🍓', serving: '1 cup' },
    { name: 'Blueberries', carbs: 14, gi: 53, category: 'Fruits', emoji: '🫐', serving: '1 cup' },
    { name: 'Pineapple', carbs: 13, gi: 59, category: 'Fruits', emoji: '🍍', serving: '1 cup' },

    // Grains & Bread
    { name: 'White Rice', carbs: 45, gi: 73, category: 'Grains', emoji: '🍚', serving: '1 cup cooked' },
    { name: 'Brown Rice', carbs: 42, gi: 50, category: 'Grains', emoji: '🍚', serving: '1 cup cooked' },
    { name: 'White Bread', carbs: 13, gi: 75, category: 'Grains', emoji: '🍞', serving: '1 slice' },
    { name: 'Whole Wheat Bread', carbs: 12, gi: 54, category: 'Grains', emoji: '🍞', serving: '1 slice' },
    { name: 'Oatmeal', carbs: 27, gi: 55, category: 'Grains', emoji: '🥣', serving: '1 cup cooked' },
    { name: 'Pasta', carbs: 43, gi: 49, category: 'Grains', emoji: '🍝', serving: '1 cup cooked' },
    { name: 'Quinoa', carbs: 34, gi: 53, category: 'Grains', emoji: '🥗', serving: '1 cup cooked' },
    { name: 'Cornbread', carbs: 28, gi: 69, category: 'Grains', emoji: '🌽', serving: '1 piece' },
    { name: 'Cereal', carbs: 24, gi: 70, category: 'Grains', emoji: '🥣', serving: '1 cup' },
    { name: 'Naan', carbs: 36, gi: 71, category: 'Grains', emoji: '🫓', serving: '1 piece' },
    { name: 'Tortilla (Flour)', carbs: 22, gi: 62, category: 'Grains', emoji: '🫓', serving: '1 large' },

    // Protein
    { name: 'Chicken Breast', carbs: 0, gi: 0, category: 'Protein', emoji: '🍗', serving: '100g' },
    { name: 'Salmon', carbs: 0, gi: 0, category: 'Protein', emoji: '🐟', serving: '100g' },
    { name: 'Eggs', carbs: 1, gi: 0, category: 'Protein', emoji: '🥚', serving: '2 large' },
    { name: 'Ground Beef', carbs: 0, gi: 0, category: 'Protein', emoji: '🥩', serving: '100g' },
    { name: 'Tuna', carbs: 0, gi: 0, category: 'Protein', emoji: '🐟', serving: '1 can' },
    { name: 'Turkey', carbs: 0, gi: 0, category: 'Protein', emoji: '🦃', serving: '100g' },
    { name: 'Tofu', carbs: 2, gi: 15, category: 'Protein', emoji: '🧈', serving: '100g' },

    // Dairy
    { name: 'Milk (Whole)', carbs: 12, gi: 27, category: 'Dairy', emoji: '🥛', serving: '1 cup' },
    { name: 'Greek Yogurt', carbs: 6, gi: 11, category: 'Dairy', emoji: '🥣', serving: '1 cup' },
    { name: 'Cheese', carbs: 1, gi: 0, category: 'Dairy', emoji: '🧀', serving: '1 oz' },
    { name: 'Ice Cream', carbs: 22, gi: 62, category: 'Dairy', emoji: '🍦', serving: '½ cup' },

    // Vegetables
    { name: 'Sweet Potato', carbs: 20, gi: 63, category: 'Vegetables', emoji: '🍠', serving: '1 medium' },
    { name: 'Potato', carbs: 26, gi: 78, category: 'Vegetables', emoji: '🥔', serving: '1 medium' },
    { name: 'Corn', carbs: 19, gi: 52, category: 'Vegetables', emoji: '🌽', serving: '1 ear' },
    { name: 'Carrots', carbs: 6, gi: 39, category: 'Vegetables', emoji: '🥕', serving: '1 cup' },
    { name: 'Broccoli', carbs: 6, gi: 10, category: 'Vegetables', emoji: '🥦', serving: '1 cup' },
    { name: 'Salad (Mixed)', carbs: 3, gi: 10, category: 'Vegetables', emoji: '🥗', serving: '1 bowl' },
    { name: 'Green Beans', carbs: 7, gi: 15, category: 'Vegetables', emoji: '🫘', serving: '1 cup' },
    { name: 'Avocado', carbs: 3, gi: 15, category: 'Vegetables', emoji: '🥑', serving: '½ fruit' },

    // Snacks & Sweets
    { name: 'Chocolate Bar', carbs: 26, gi: 49, category: 'Snacks', emoji: '🍫', serving: '1 bar' },
    { name: 'Cookies', carbs: 19, gi: 62, category: 'Snacks', emoji: '🍪', serving: '2 pieces' },
    { name: 'Chips', carbs: 15, gi: 56, category: 'Snacks', emoji: '🥨', serving: '1 oz' },
    { name: 'Popcorn', carbs: 6, gi: 65, category: 'Snacks', emoji: '🍿', serving: '1 cup' },
    { name: 'Granola Bar', carbs: 18, gi: 61, category: 'Snacks', emoji: '🥜', serving: '1 bar' },
    { name: 'Dates', carbs: 18, gi: 42, category: 'Snacks', emoji: '🌴', serving: '2 pieces' },
    { name: 'Trail Mix', carbs: 13, gi: 35, category: 'Snacks', emoji: '🥜', serving: '¼ cup' },

    // Drinks
    { name: 'Orange Juice', carbs: 26, gi: 50, category: 'Drinks', emoji: '🧃', serving: '1 cup' },
    { name: 'Soda (Cola)', carbs: 39, gi: 63, category: 'Drinks', emoji: '🥤', serving: '12 oz' },
    { name: 'Smoothie', carbs: 30, gi: 45, category: 'Drinks', emoji: '🥤', serving: '1 cup' },
    { name: 'Coffee (Latte)', carbs: 15, gi: 20, category: 'Drinks', emoji: '☕', serving: '12 oz' },
    { name: 'Energy Drink', carbs: 27, gi: 70, category: 'Drinks', emoji: '⚡', serving: '1 can' },

    // Meals (Combined)
    { name: 'Chicken Sandwich', carbs: 34, gi: 55, category: 'Meals', emoji: '🥪', serving: '1 sandwich' },
    { name: 'Pizza (1 slice)', carbs: 36, gi: 60, category: 'Meals', emoji: '🍕', serving: '1 slice' },
    { name: 'Burger', carbs: 28, gi: 66, category: 'Meals', emoji: '🍔', serving: '1 burger' },
    { name: 'Sushi Roll', carbs: 20, gi: 52, category: 'Meals', emoji: '🍣', serving: '6 pieces' },
    { name: 'Burrito', carbs: 45, gi: 58, category: 'Meals', emoji: '🌯', serving: '1 burrito' },
    { name: 'Soup (Lentil)', carbs: 20, gi: 32, category: 'Meals', emoji: '🍲', serving: '1 bowl' },
    { name: 'Fried Rice', carbs: 52, gi: 68, category: 'Meals', emoji: '🍛', serving: '1 plate' },
    { name: 'Shawarma', carbs: 30, gi: 55, category: 'Meals', emoji: '🥙', serving: '1 wrap' },
    { name: 'Biryani', carbs: 55, gi: 65, category: 'Meals', emoji: '🍛', serving: '1 plate' },
    { name: 'Falafel Wrap', carbs: 35, gi: 50, category: 'Meals', emoji: '🧆', serving: '1 wrap' },
];

// ─── GI Level Classification ────────────────────────────────────────────────
const getGILevel = (gi: number) => {
    if (gi === 0) return { label: 'N/A', color: '#607D8B', bg: '#607D8B15' };
    if (gi <= 35) return { label: 'LOW', color: '#4CAF50', bg: '#4CAF5015' };
    if (gi <= 55) return { label: 'MED', color: '#FF9800', bg: '#FF980015' };
    return { label: 'HIGH', color: '#FF5252', bg: '#FF525215' };
};

export const AddLogScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { user } = useAuthStore();
    const { theme, targetGlucoseMin, targetGlucoseMax, glucoseUnit } = useSettingsStore();
    const { addGlucoseLog, addCarbLog, addInsulinLog, glucoseLogs, carbLogs } = useLogsStore();
    const { creditsRemaining, decrementCredit } = useSubscriptionStore();

    const t = getThemeColors(theme);

    const [activeTab, setActiveTab] = useState<TabType>(route.params?.tab || 'carbs');
    const [loading, setLoading] = useState(false);

    // Carbs state
    const [foodName, setFoodName] = useState('');
    const [carbs, setCarbs] = useState('');
    const [servings, setServings] = useState('1');
    const [mealTime, setMealTime] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
    const [notes, setNotes] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGI, setSelectedGI] = useState<number | null>(null);

    // Glucose state
    const [glucoseValue, setGlucoseValue] = useState('');
    const [glucoseContext, setGlucoseContext] = useState('Before Meal');

    // Insulin state
    const [insulinUnits, setInsulinUnits] = useState('');
    const [insulinType, setInsulinType] = useState<'rapid' | 'long-acting' | 'mixed'>('rapid');

    // ─── Food Search with fuzzy matching ────────────────────────────────────
    const searchResults = useMemo(() => {
        if (searchQuery.length < 1) return [];
        const q = searchQuery.toLowerCase();
        return FOOD_DATABASE
            .filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q))
            .slice(0, 15);
    }, [searchQuery]);

    // ─── Dynamic Quick Adds (user favorites + defaults) ─────────────────────
    const quickFoods = useMemo(() => {
        const seen = new Set<string>();
        const favorites: typeof FOOD_DATABASE = [];

        // User's frequent foods
        for (const log of carbLogs) {
            const key = log.food_name.toLowerCase();
            if (!seen.has(key) && favorites.length < 4) {
                seen.add(key);
                const dbMatch = FOOD_DATABASE.find(f => f.name.toLowerCase() === key);
                favorites.push(dbMatch || {
                    name: log.food_name,
                    carbs: log.estimated_carbs,
                    gi: 50,
                    category: 'Recent',
                    emoji: '🍽️',
                    serving: '1 serving'
                });
            }
        }

        // Fill remaining with popular defaults
        if (favorites.length < 6) {
            const defaults = FOOD_DATABASE.filter(f =>
                ['Apple', 'Banana', 'White Rice', 'Chicken Breast', 'Oatmeal', 'Greek Yogurt'].includes(f.name)
            );
            for (const d of defaults) {
                if (!seen.has(d.name.toLowerCase()) && favorites.length < 6) {
                    seen.add(d.name.toLowerCase());
                    favorites.push(d);
                }
            }
        }
        return favorites;
    }, [carbLogs]);

    // ─── GI Impact Prediction ──────────────────────────────────────────────
    const getGlycemicImpact = useCallback((_food: string, carbGrams: number, gi: number | null) => {
        const effectiveGI = gi ?? 50;
        const glycemicLoad = (effectiveGI * carbGrams) / 100;
        const spikeMinutes = effectiveGI > 55 ? 30 : effectiveGI > 35 ? 45 : 60;
        const peakIncrease = Math.round(glycemicLoad * 3.5);

        let suggestion: string;
        if (glycemicLoad > 20) suggestion = '🚶 A 10-min walk now can reduce the spike by ~25%';
        else if (glycemicLoad > 10) suggestion = '💧 Drink water & add fiber to slow absorption';
        else suggestion = '✅ Low glycemic load — minimal impact expected';

        return {
            spikeMinutes,
            peakIncrease,
            glycemicLoad: Math.round(glycemicLoad),
            risk: glycemicLoad > 20 ? 'high' : glycemicLoad > 10 ? 'moderate' : 'low',
            suggestion,
        };
    }, []);

    // ─── Live GI Indicator ──────────────────────────────────────────────────
    const liveGI = useMemo(() => {
        if (!foodName) return null;
        const match = FOOD_DATABASE.find(f => f.name.toLowerCase() === foodName.toLowerCase());
        if (match) return getGILevel(match.gi);
        if (selectedGI !== null) return getGILevel(selectedGI);
        return null;
    }, [foodName, selectedGI]);

    // ─── Glucose Context Feedback ───────────────────────────────────────────
    const glucoseFeedback = useMemo(() => {
        const val = parseInt(glucoseValue);
        if (isNaN(val)) return null;
        if (val < targetGlucoseMin) return { label: 'Low', color: '#FFC107', icon: 'arrow-down-circle' as const, text: 'Below target range. Consider a small snack.' };
        if (val > targetGlucoseMax) return { label: 'High', color: '#FF5252', icon: 'arrow-up-circle' as const, text: 'Above target range. Log activity or insulin if applicable.' };
        return { label: 'In Range', color: '#4CAF50', icon: 'checkmark-circle' as const, text: 'Great! Your reading is within your target range.' };
    }, [glucoseValue, targetGlucoseMin, targetGlucoseMax]);

    // ─── Route Params ───────────────────────────────────────────────────────
    useEffect(() => {
        if (route.params?.scannedFood) setFoodName(route.params.scannedFood);
        if (route.params?.scannedCarbs) setCarbs(route.params.scannedCarbs.toString());
    }, [route.params]);

    // ─── Save Handler ───────────────────────────────────────────────────────
    const handleSave = async () => {
        if (loading) return;
        setLoading(true);

        try {
            if (activeTab === 'carbs') {
                if (!foodName || !carbs) throw new Error('Please fill food name and carbs');
                if (creditsRemaining <= 0) {
                    Alert.alert('No Credits', 'Purchase more credits to log new meals.', [
                        { text: 'Store', onPress: () => navigation.navigate('CreditsStore') },
                        { text: 'Cancel', style: 'cancel' }
                    ]);
                    setLoading(false);
                    return;
                }

                const totalCarbs = Math.round(parseInt(carbs) * parseFloat(servings || '1'));
                addCarbLog({
                    id: Math.random().toString(),
                    user_id: user?.id || 'guest',
                    food_name: foodName,
                    estimated_carbs: totalCarbs,
                    created_at: new Date().toISOString()
                });
                decrementCredit();

                // AI Glycemic Impact Alert for notable meals
                if (totalCarbs >= 15) {
                    const impact = getGlycemicImpact(foodName, totalCarbs, selectedGI);
                    setTimeout(() => {
                        Alert.alert(
                            '🧠 AI Glycemic Insight',
                            `📊 Glycemic Load: ${impact.glycemicLoad} (${impact.risk.toUpperCase()})\n\n` +
                            `⏱ Expected spike in ~${impact.spikeMinutes} min\n` +
                            `📈 Predicted rise: +${impact.peakIncrease} mg/dL\n\n` +
                            `${impact.suggestion}`,
                            [{ text: 'Got it!', style: 'default' }]
                        );
                    }, 500);
                }
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

    // ─── Select food from database ──────────────────────────────────────────
    const selectFood = (food: typeof FOOD_DATABASE[0]) => {
        setFoodName(food.name);
        setCarbs(food.carbs.toString());
        setSelectedGI(food.gi);
        setShowSearch(false);
        setSearchQuery('');
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
                        <Ionicons
                            name={tab === 'carbs' ? 'restaurant' : tab === 'glucose' ? 'water' : 'medkit'}
                            size={16}
                            color={activeTab === tab ? t.primary : t.textTertiary}
                            style={{ marginBottom: 2 }}
                        />
                        <Text style={[styles.tabText, { color: activeTab === tab ? t.primary : t.textTertiary }]}>
                            {tab.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* ═══════════ CARBS TAB ═══════════ */}
                {activeTab === 'carbs' && (
                    <View style={styles.formContainer}>
                        {/* Food Search Button */}
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>FOOD NAME</Text>
                        <TouchableOpacity
                            style={[styles.searchTrigger, { backgroundColor: t.card, borderColor: t.border }]}
                            onPress={() => setShowSearch(true)}
                        >
                            <Ionicons name="search" size={18} color={t.textTertiary} />
                            <Text style={[styles.searchTriggerText, { color: foodName ? t.text : t.textTertiary }]}>
                                {foodName || 'Search 80+ foods or type custom...'}
                            </Text>
                            {liveGI && (
                                <View style={[styles.giTag, { backgroundColor: liveGI.bg }]}>
                                    <Text style={[styles.giTagText, { color: liveGI.color }]}>GI: {liveGI.label}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Carbs + Serving Row */}
                        <View style={styles.carbsServingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>CARBS (G)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: t.card, color: t.text, borderColor: t.border, textAlign: 'center', fontSize: 24, fontWeight: 'bold' }]}
                                    placeholder="0"
                                    placeholderTextColor={t.textTertiary}
                                    keyboardType="numeric"
                                    value={carbs}
                                    onChangeText={setCarbs}
                                />
                            </View>
                            <View style={{ width: 10 }} />
                            <View style={{ flex: 0.6 }}>
                                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>SERVINGS</Text>
                                <View style={styles.servingControl}>
                                    <TouchableOpacity
                                        style={[styles.servingBtn, { backgroundColor: t.glass }]}
                                        onPress={() => setServings(String(Math.max(0.5, parseFloat(servings || '1') - 0.5)))}
                                    >
                                        <Ionicons name="remove" size={18} color={t.primary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.servingValue, { color: t.text }]}>{servings || '1'}</Text>
                                    <TouchableOpacity
                                        style={[styles.servingBtn, { backgroundColor: t.glass }]}
                                        onPress={() => setServings(String(parseFloat(servings || '1') + 0.5))}
                                    >
                                        <Ionicons name="add" size={18} color={t.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Total Carbs Preview */}
                        {parseFloat(servings) !== 1 && carbs && (
                            <View style={[styles.totalPreview, { backgroundColor: t.primary + '12' }]}>
                                <Text style={[styles.totalPreviewText, { color: t.primary }]}>
                                    Total: {Math.round(parseInt(carbs) * parseFloat(servings || '1'))}g carbs ({servings} × {carbs}g)
                                </Text>
                            </View>
                        )}

                        {/* Meal Timing */}
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>MEAL TIMING</Text>
                        <View style={styles.chipRow}>
                            {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.mealChip,
                                        { backgroundColor: mealTime === time ? t.primary : t.glass },
                                        mealTime === time && Shadow.blue
                                    ]}
                                    onPress={() => setMealTime(time)}
                                >
                                    <Text style={{ fontSize: 14 }}>
                                        {time === 'Breakfast' ? '🌅' : time === 'Lunch' ? '☀️' : time === 'Dinner' ? '🌙' : '🍿'}
                                    </Text>
                                    <Text style={[styles.mealChipText, { color: mealTime === time ? '#FFF' : t.textSecondary }]}>
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* AI Estimate + Scan Button */}
                        <View style={styles.aiRow}>
                            <TouchableOpacity
                                style={[styles.aiButton, { backgroundColor: t.primary + '12', borderColor: t.primary + '30' }]}
                                onPress={() => navigation.navigate('ScanMeal')}
                            >
                                <Ionicons name="camera" size={20} color={t.primary} />
                                <Text style={[styles.aiButtonText, { color: t.primary }]}>Scan Meal</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Notes */}
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>NOTES (OPTIONAL)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.card, color: t.text, borderColor: t.border, height: 70, textAlignVertical: 'top', paddingTop: 14 }]}
                            placeholder="How are you feeling? Activity level..."
                            placeholderTextColor={t.textTertiary}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        {/* Quick Add */}
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>
                            {carbLogs.length > 0 ? '⭐ YOUR FAVORITES' : '🔥 POPULAR FOODS'}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                            {quickFoods.map((food) => {
                                const giLevel = getGILevel(food.gi);
                                return (
                                    <TouchableOpacity
                                        key={food.name}
                                        style={[styles.quickCard, { backgroundColor: t.card, borderColor: t.border }]}
                                        onPress={() => selectFood(food)}
                                    >
                                        <Text style={styles.quickEmoji}>{food.emoji}</Text>
                                        <Text style={[styles.quickName, { color: t.text }]}>{food.name}</Text>
                                        <Text style={[styles.quickCarbs, { color: t.textSecondary }]}>{food.carbs}g carbs</Text>
                                        <View style={[styles.quickGI, { backgroundColor: giLevel.bg }]}>
                                            <Text style={[styles.quickGIText, { color: giLevel.color }]}>GI: {giLevel.label}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Recent Logs */}
                        {carbLogs.length > 0 && (
                            <>
                                <Text style={[styles.inputLabel, { color: t.textSecondary, marginTop: Spacing.xl }]}>📋 RECENT LOGS</Text>
                                {carbLogs.slice(0, 3).map((log, i) => (
                                    <View key={i} style={[styles.recentRow, { borderBottomColor: t.border }]}>
                                        <View style={[styles.recentIcon, { backgroundColor: t.glass }]}>
                                            <Ionicons name="restaurant" size={16} color={t.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.recentName, { color: t.text }]}>{log.food_name}</Text>
                                            <Text style={[styles.recentTime, { color: t.textTertiary }]}>
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <Text style={[styles.recentCarbs, { color: t.primary }]}>{log.estimated_carbs}g</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                )}

                {/* ═══════════ GLUCOSE TAB ═══════════ */}
                {activeTab === 'glucose' && (
                    <View style={styles.formContainer}>
                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>GLUCOSE READING ({glucoseUnit.toUpperCase()})</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.card, color: t.text, borderColor: t.border, fontSize: 32, height: 80, textAlign: 'center' }]}
                            placeholder="0"
                            placeholderTextColor={t.textTertiary}
                            keyboardType="numeric"
                            value={glucoseValue}
                            onChangeText={setGlucoseValue}
                            autoFocus
                        />

                        {/* Live Glucose Feedback */}
                        {glucoseFeedback && (
                            <View style={[styles.feedbackCard, { backgroundColor: glucoseFeedback.color + '12', borderColor: glucoseFeedback.color + '30' }]}>
                                <Ionicons name={glucoseFeedback.icon} size={24} color={glucoseFeedback.color} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.feedbackLabel, { color: glucoseFeedback.color }]}>{glucoseFeedback.label}</Text>
                                    <Text style={[styles.feedbackText, { color: t.textSecondary }]}>{glucoseFeedback.text}</Text>
                                </View>
                            </View>
                        )}

                        {/* Target Range Display */}
                        <View style={[styles.rangeDisplay, { backgroundColor: t.card, borderColor: t.border }]}>
                            <Text style={[styles.rangeLabel, { color: t.textTertiary }]}>Your Target Range</Text>
                            <View style={styles.rangeBar}>
                                <Text style={[styles.rangeBound, { color: '#FFC107' }]}>{targetGlucoseMin}</Text>
                                <View style={[styles.rangeTrack, { backgroundColor: t.glass }]}>
                                    <View style={[styles.rangeGreen, { left: '15%', right: '15%' }]} />
                                    {glucoseValue && !isNaN(parseInt(glucoseValue)) && (
                                        <View style={[styles.rangeDot, {
                                            left: `${Math.min(95, Math.max(5, ((parseInt(glucoseValue) - (targetGlucoseMin - 30)) / ((targetGlucoseMax + 60) - (targetGlucoseMin - 30))) * 100))}%`,
                                            backgroundColor: glucoseFeedback?.color || t.primary
                                        }]} />
                                    )}
                                </View>
                                <Text style={[styles.rangeBound, { color: '#FF5252' }]}>{targetGlucoseMax}</Text>
                            </View>
                        </View>

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>CONTEXT</Text>
                        <View style={styles.chipRow}>
                            {['Fasted', 'Before Meal', '1h Post-Meal', '2h Post-Meal', 'Bedtime'].map((ctx) => (
                                <ContextChip key={ctx} label={ctx} />
                            ))}
                        </View>

                        {/* Recent Glucose Readings */}
                        {glucoseLogs.length > 0 && (
                            <>
                                <Text style={[styles.inputLabel, { color: t.textSecondary, marginTop: Spacing.xl }]}>📊 LAST 3 READINGS</Text>
                                {glucoseLogs.slice(0, 3).map((log, i) => {
                                    const val = log.glucose_value;
                                    const inRange = val >= targetGlucoseMin && val <= targetGlucoseMax;
                                    return (
                                        <View key={i} style={[styles.recentRow, { borderBottomColor: t.border }]}>
                                            <View style={[styles.recentIcon, { backgroundColor: inRange ? '#4CAF5015' : '#FF525215' }]}>
                                                <Ionicons name={inRange ? 'checkmark-circle' : 'alert-circle'} size={16} color={inRange ? '#4CAF50' : '#FF5252'} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.recentName, { color: t.text }]}>{val} {glucoseUnit}</Text>
                                                <Text style={[styles.recentTime, { color: t.textTertiary }]}>
                                                    {new Date(log.reading_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            <Text style={[styles.recentCarbs, { color: inRange ? '#4CAF50' : '#FF5252' }]}>
                                                {inRange ? 'In Range' : val > targetGlucoseMax ? 'High' : 'Low'}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </>
                        )}
                    </View>
                )}

                {/* ═══════════ INSULIN TAB ═══════════ */}
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
                                    <Ionicons
                                        name={type === 'rapid' ? 'flash' : type === 'long-acting' ? 'time' : 'layers'}
                                        size={16}
                                        color={insulinType === type ? '#FFF' : t.textSecondary}
                                        style={{ marginBottom: 2 }}
                                    />
                                    <Text style={[styles.typeButtonText, { color: insulinType === type ? '#FFF' : t.textSecondary }]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Insulin Tip */}
                        <View style={[styles.feedbackCard, { backgroundColor: t.primary + '08', borderColor: t.primary + '20', marginTop: Spacing.xl }]}>
                            <Ionicons name="information-circle" size={20} color={t.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.feedbackLabel, { color: t.primary }]}>Dosing Tip</Text>
                                <Text style={[styles.feedbackText, { color: t.textSecondary }]}>
                                    {insulinType === 'rapid'
                                        ? 'Rapid insulin acts within 15 min. Take before meals for best results.'
                                        : insulinType === 'long-acting'
                                            ? 'Long-acting provides 24h basal coverage. Inject at the same time daily.'
                                            : 'Mixed insulin combines rapid and intermediate. Follow your schedule.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* ═══════════ FOOD SEARCH MODAL ═══════════ */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={showSearch}
                onRequestClose={() => setShowSearch(false)}
            >
                <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
                    {/* Search Header */}
                    <View style={[styles.searchHeader, { borderBottomColor: t.border }]}>
                        <TouchableOpacity onPress={() => setShowSearch(false)} style={{ padding: 8 }}>
                            <Ionicons name="arrow-back" size={24} color={t.text} />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.searchInput, { backgroundColor: t.card, color: t.text, borderColor: t.border }]}
                            placeholder="Search foods... (e.g. banana, rice, pizza)"
                            placeholderTextColor={t.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>

                    {/* Custom Entry Option */}
                    {searchQuery.length > 0 && searchResults.length === 0 && (
                        <TouchableOpacity
                            style={[styles.customEntry, { backgroundColor: t.primary + '12', borderColor: t.primary + '30' }]}
                            onPress={() => {
                                setFoodName(searchQuery);
                                setShowSearch(false);
                                setSearchQuery('');
                            }}
                        >
                            <Ionicons name="add-circle" size={20} color={t.primary} />
                            <Text style={[styles.customEntryText, { color: t.primary }]}>Add "{searchQuery}" as custom food</Text>
                        </TouchableOpacity>
                    )}

                    {/* Category Chips */}
                    {searchQuery.length === 0 && (
                        <View style={styles.categorySection}>
                            <Text style={[styles.inputLabel, { color: t.textSecondary, marginHorizontal: Spacing.xl }]}>BROWSE BY CATEGORY</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: Spacing.lg }}>
                                {['Fruits', 'Grains', 'Protein', 'Dairy', 'Vegetables', 'Snacks', 'Drinks', 'Meals'].map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.catChip, { backgroundColor: t.glass }]}
                                        onPress={() => setSearchQuery(cat)}
                                    >
                                        <Text style={[styles.catChipText, { color: t.text }]}>
                                            {cat === 'Fruits' ? '🍎' : cat === 'Grains' ? '🌾' : cat === 'Protein' ? '🥩' :
                                                cat === 'Dairy' ? '🥛' : cat === 'Vegetables' ? '🥬' : cat === 'Snacks' ? '🍿' :
                                                    cat === 'Drinks' ? '🥤' : '🍽️'} {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Search Results */}
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.name}
                        contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
                        renderItem={({ item }) => {
                            const giLevel = getGILevel(item.gi);
                            return (
                                <TouchableOpacity
                                    style={[styles.searchResultItem, { borderBottomColor: t.border }]}
                                    onPress={() => selectFood(item)}
                                >
                                    <Text style={styles.resultEmoji}>{item.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.resultName, { color: t.text }]}>{item.name}</Text>
                                        <Text style={[styles.resultServing, { color: t.textTertiary }]}>{item.serving} • {item.category}</Text>
                                    </View>
                                    <View style={styles.resultRight}>
                                        <Text style={[styles.resultCarbs, { color: t.text }]}>{item.carbs}g</Text>
                                        <View style={[styles.resultGI, { backgroundColor: giLevel.bg }]}>
                                            <Text style={[styles.resultGIText, { color: giLevel.color }]}>GI {giLevel.label}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </SafeAreaView>
            </Modal>
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
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    content: {
        padding: Spacing.xl,
        paddingBottom: 100,
    },
    formContainer: {
        gap: 6,
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
    // ─── Food Search ─────────────────────────────────────────────────
    searchTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1,
        gap: 10,
    },
    searchTriggerText: {
        flex: 1,
        fontSize: Typography.sizes.md,
    },
    giTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.round,
    },
    giTagText: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    // ─── Carbs + Serving ─────────────────────────────────────────────
    carbsServingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    servingControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: BorderRadius.xl,
        gap: 10,
    },
    servingBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    servingValue: {
        fontSize: 20,
        fontWeight: 'bold',
        minWidth: 30,
        textAlign: 'center',
    },
    totalPreview: {
        padding: 10,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    totalPreviewText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // ─── Meal Timing ─────────────────────────────────────────────────
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
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
    mealChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: BorderRadius.round,
    },
    mealChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // ─── AI Row ──────────────────────────────────────────────────────
    aiRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    aiButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    aiButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    // ─── Quick Food Cards ────────────────────────────────────────────
    quickCard: {
        width: 110,
        padding: 12,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginRight: 10,
        alignItems: 'center',
        gap: 4,
    },
    quickEmoji: {
        fontSize: 28,
    },
    quickName: {
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    quickCarbs: {
        fontSize: 10,
    },
    quickGI: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.round,
        marginTop: 2,
    },
    quickGIText: {
        fontSize: 8,
        fontWeight: 'bold',
    },
    // ─── Recent Logs ─────────────────────────────────────────────────
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    recentIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentName: {
        fontSize: Typography.sizes.md,
        fontWeight: '600',
    },
    recentTime: {
        fontSize: 11,
        marginTop: 1,
    },
    recentCarbs: {
        fontSize: Typography.sizes.md,
        fontWeight: 'bold',
    },
    // ─── Glucose Feedback ────────────────────────────────────────────
    feedbackCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginTop: 6,
    },
    feedbackLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    feedbackText: {
        fontSize: 12,
        lineHeight: 18,
    },
    // ─── Range Display ───────────────────────────────────────────────
    rangeDisplay: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginTop: 8,
    },
    rangeLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 10,
    },
    rangeBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rangeBound: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    rangeTrack: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        position: 'relative',
    },
    rangeGreen: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: '#4CAF5040',
        borderRadius: 4,
    },
    rangeDot: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        top: -3,
        marginLeft: -7,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    // ─── Insulin ─────────────────────────────────────────────────────
    typeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        height: 56,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    typeButtonText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    // ─── Search Modal ────────────────────────────────────────────────
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: 8,
        borderBottomWidth: 1,
    },
    searchInput: {
        flex: 1,
        height: 44,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        fontSize: Typography.sizes.md,
        borderWidth: 1,
    },
    customEntry: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        margin: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    customEntryText: {
        fontSize: Typography.sizes.md,
        fontWeight: '600',
    },
    categorySection: {
        paddingVertical: Spacing.lg,
    },
    catChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: BorderRadius.round,
        marginRight: 8,
    },
    catChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        gap: 12,
    },
    resultEmoji: {
        fontSize: 28,
    },
    resultName: {
        fontSize: Typography.sizes.md,
        fontWeight: 'bold',
    },
    resultServing: {
        fontSize: 11,
        marginTop: 1,
    },
    resultRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    resultCarbs: {
        fontSize: Typography.sizes.md,
        fontWeight: 'bold',
    },
    resultGI: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.round,
    },
    resultGIText: {
        fontSize: 9,
        fontWeight: 'bold',
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
});
