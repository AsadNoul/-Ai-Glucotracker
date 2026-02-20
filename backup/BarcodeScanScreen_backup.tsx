import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore } from '../store';

const { width } = Dimensions.get('window');

// Simulated barcode product database
const BARCODE_DB: Record<string, { name: string; brand: string; serving: string; carbs: number; calories: number; protein: number; fat: number; fiber: number; sugar: number; emoji: string }> = {
    '5000159407236': { name: 'Coca-Cola', brand: 'Coca-Cola', serving: '330ml can', carbs: 35, calories: 139, protein: 0, fat: 0, fiber: 0, sugar: 35, emoji: '🥤' },
    '0049000006582': { name: 'Coca-Cola', brand: 'Coca-Cola', serving: '12 fl oz', carbs: 39, calories: 140, protein: 0, fat: 0, fiber: 0, sugar: 39, emoji: '🥤' },
    '5060517883614': { name: 'Protein Bar', brand: 'Grenade', serving: '1 bar (60g)', carbs: 17, calories: 220, protein: 20, fat: 9, fiber: 2, sugar: 2, emoji: '🍫' },
    '5000462991736': { name: 'Digestive Biscuits', brand: "McVitie's", serving: '2 biscuits', carbs: 22, calories: 140, protein: 2, fat: 5, fiber: 1, sugar: 6, emoji: '🍪' },
    '4006381333627': { name: 'Haribo Goldbears', brand: 'Haribo', serving: '1 bag (100g)', carbs: 77, calories: 343, protein: 7, fat: 0, fiber: 0, sugar: 46, emoji: '🍬' },
    '3017620422003': { name: 'Nutella', brand: 'Ferrero', serving: '1 tbsp (15g)', carbs: 8, calories: 80, protein: 1, fat: 5, fiber: 0, sugar: 8, emoji: '🫙' },
    '0041570054208': { name: 'Greek Yogurt', brand: 'Chobani', serving: '1 cup (170g)', carbs: 6, calories: 100, protein: 17, fat: 0, fiber: 0, sugar: 4, emoji: '🥛' },
    '0070470003542': { name: 'Cheerios', brand: 'General Mills', serving: '1 cup (28g)', carbs: 20, calories: 100, protein: 3, fat: 2, fiber: 3, sugar: 1, emoji: '🥣' },
    '0038000138416': { name: 'Special K', brand: 'Kellogg\'s', serving: '1 cup (31g)', carbs: 23, calories: 120, protein: 5, fat: 0, fiber: 1, sugar: 4, emoji: '🥣' },
    '0021130126026': { name: 'White Bread', brand: 'Wonder', serving: '2 slices', carbs: 26, calories: 130, protein: 4, fat: 1, fiber: 1, sugar: 4, emoji: '🍞' },
};

// Manual search database
const PACKAGED_FOODS = [
    { name: 'Coca-Cola 330ml', carbs: 35, calories: 139, emoji: '🥤' },
    { name: 'Apple Juice', carbs: 28, calories: 114, emoji: '🧃' },
    { name: 'Whole Milk 1 cup', carbs: 12, calories: 149, emoji: '🥛' },
    { name: 'Granola Bar', carbs: 24, calories: 170, emoji: '🥜' },
    { name: 'Protein Shake', carbs: 8, calories: 160, emoji: '🥤' },
    { name: 'Rice Cake', carbs: 14, calories: 70, emoji: '🍘' },
    { name: 'Trail Mix', carbs: 18, calories: 175, emoji: '🥜' },
    { name: 'Chips (1 bag)', carbs: 15, calories: 160, emoji: '🍟' },
    { name: 'Crackers (4 pcs)', carbs: 10, calories: 70, emoji: '🍪' },
    { name: 'Energy Drink', carbs: 28, calories: 110, emoji: '⚡' },
    { name: 'Smoothie Bottle', carbs: 38, calories: 230, emoji: '🥤' },
    { name: 'Chocolate Milk', carbs: 26, calories: 190, emoji: '🍫' },
    { name: 'Sports Drink', carbs: 21, calories: 80, emoji: '🏃' },
    { name: 'Instant Noodles', carbs: 52, calories: 380, emoji: '🍜' },
    { name: 'Frozen Pizza Slice', carbs: 34, calories: 290, emoji: '🍕' },
];

export const BarcodeScanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useSettingsStore();
    const { addCarbLog } = useLogsStore();
    const t = getThemeColors(theme);

    const [mode, setMode] = useState<'scan' | 'search' | 'result'>('scan');
    const [searchQuery, setSearchQuery] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scannedProduct, setScannedProduct] = useState<(typeof BARCODE_DB)[string] | null>(null);
    const [servings, setServings] = useState(1);

    // Search results
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return PACKAGED_FOODS;
        return PACKAGED_FOODS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const handleBarcodeLookup = () => {
        const code = barcodeInput.trim();
        if (!code) return;
        const product = BARCODE_DB[code];
        if (product) {
            setScannedProduct(product);
            setMode('result');
        } else {
            Alert.alert('Not Found', 'Product not in database. Try manual search.', [
                { text: 'Search', onPress: () => setMode('search') },
                { text: 'OK' },
            ]);
        }
    };

    const handleSelectFood = (food: typeof PACKAGED_FOODS[0]) => {
        setScannedProduct({
            name: food.name, brand: '', serving: '1 serving', carbs: food.carbs,
            calories: food.calories, protein: 0, fat: 0, fiber: 0, sugar: 0, emoji: food.emoji,
        });
        setMode('result');
    };

    const handleConfirm = () => {
        if (!scannedProduct) return;
        const totalCarbs = Math.round(scannedProduct.carbs * servings);
        addCarbLog({
            id: Date.now().toString(),
            user_id: 'local',
            food_name: scannedProduct.name + (scannedProduct.brand ? ` (${scannedProduct.brand})` : ''),
            estimated_carbs: totalCarbs,
            image_url: null,
            created_at: new Date().toISOString(),
        });
        Alert.alert('✅ Logged!', `${scannedProduct.name} — ${totalCarbs}g carbs`, [
            { text: 'OK', onPress: () => { setMode('scan'); setScannedProduct(null); setServings(1); setBarcodeInput(''); } },
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Barcode Scanner</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Mode Tabs */}
            <View style={styles.modeRow}>
                <TouchableOpacity style={[styles.modeTab, { backgroundColor: mode === 'scan' ? t.primary : t.card, borderColor: mode === 'scan' ? t.primary : t.border }]} onPress={() => { setMode('scan'); setScannedProduct(null); }}>
                    <Ionicons name="barcode" size={18} color={mode === 'scan' ? '#FFF' : t.textSecondary} />
                    <Text style={[styles.modeText, { color: mode === 'scan' ? '#FFF' : t.textSecondary }]}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeTab, { backgroundColor: mode === 'search' ? t.primary : t.card, borderColor: mode === 'search' ? t.primary : t.border }]} onPress={() => { setMode('search'); setScannedProduct(null); }}>
                    <Ionicons name="search" size={18} color={mode === 'search' ? '#FFF' : t.textSecondary} />
                    <Text style={[styles.modeText, { color: mode === 'search' ? '#FFF' : t.textSecondary }]}>Search</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Scan Mode */}
                {mode === 'scan' && (
                    <>
                        <View style={[styles.scanArea, { backgroundColor: t.card, borderColor: t.border }]}>
                            <MaterialCommunityIcons name="barcode-scan" size={64} color={t.primary} />
                            <Text style={[styles.scanTitle, { color: t.text }]}>Scan a Barcode</Text>
                            <Text style={[styles.scanHint, { color: t.textTertiary }]}>
                                Point your camera at a product barcode, or enter the number manually below.
                            </Text>

                            {/* Manual Entry */}
                            <View style={styles.manualRow}>
                                <TextInput
                                    style={[styles.barcodeInput, { color: t.text, borderColor: t.border, backgroundColor: t.background }]}
                                    value={barcodeInput}
                                    onChangeText={setBarcodeInput}
                                    placeholder="Enter barcode number"
                                    placeholderTextColor={t.textTertiary}
                                    keyboardType="number-pad"
                                />
                                <TouchableOpacity style={[styles.lookupBtn, { backgroundColor: t.primary }]} onPress={handleBarcodeLookup}>
                                    <Ionicons name="search" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Test Barcodes */}
                            <Text style={[styles.testLabel, { color: t.textTertiary }]}>Try these sample barcodes:</Text>
                            <View style={styles.testRow}>
                                {Object.entries(BARCODE_DB).slice(0, 4).map(([code, product]) => (
                                    <TouchableOpacity key={code} style={[styles.testChip, { backgroundColor: t.glass, borderColor: t.border }]} onPress={() => { setBarcodeInput(code); }}>
                                        <Text style={styles.testEmoji}>{product.emoji}</Text>
                                        <Text style={[styles.testName, { color: t.textSecondary }]}>{product.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* Search Mode */}
                {mode === 'search' && (
                    <>
                        <TextInput
                            style={[styles.searchInput, { color: t.text, borderColor: t.border, backgroundColor: t.card }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="🔍 Search packaged foods..."
                            placeholderTextColor={t.textTertiary}
                            autoFocus
                        />
                        {searchResults.map((food, i) => (
                            <TouchableOpacity key={i} style={[styles.foodRow, { backgroundColor: t.card, borderColor: t.border }]} onPress={() => handleSelectFood(food)}>
                                <Text style={styles.foodEmoji}>{food.emoji}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.foodName, { color: t.text }]}>{food.name}</Text>
                                    <Text style={[styles.foodMeta, { color: t.textTertiary }]}>{food.calories} cal</Text>
                                </View>
                                <View style={styles.foodCarbs}>
                                    <Text style={[styles.foodCarbsVal, { color: t.primary }]}>{food.carbs}g</Text>
                                    <Text style={[styles.foodCarbsLabel, { color: t.textTertiary }]}>carbs</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* Result Mode */}
                {mode === 'result' && scannedProduct && (
                    <View style={[styles.resultCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Text style={styles.resultEmoji}>{scannedProduct.emoji}</Text>
                        <Text style={[styles.resultName, { color: t.text }]}>{scannedProduct.name}</Text>
                        {scannedProduct.brand ? <Text style={[styles.resultBrand, { color: t.textTertiary }]}>{scannedProduct.brand}</Text> : null}
                        <Text style={[styles.resultServing, { color: t.textSecondary }]}>{scannedProduct.serving}</Text>

                        {/* Nutrition Grid */}
                        <View style={styles.nutritionGrid}>
                            <NutrientBox label="Carbs" value={`${Math.round(scannedProduct.carbs * servings)}g`} color="#0A85FF" highlight theme={t} />
                            <NutrientBox label="Calories" value={`${Math.round(scannedProduct.calories * servings)}`} color="#FF9800" theme={t} />
                            <NutrientBox label="Protein" value={`${Math.round(scannedProduct.protein * servings)}g`} color="#4CAF50" theme={t} />
                            <NutrientBox label="Fat" value={`${Math.round(scannedProduct.fat * servings)}g`} color="#FF5252" theme={t} />
                        </View>
                        {scannedProduct.sugar > 0 && (
                            <View style={styles.extraNutrients}>
                                <Text style={[styles.extraLabel, { color: t.textTertiary }]}>Sugar: {Math.round(scannedProduct.sugar * servings)}g</Text>
                                <Text style={[styles.extraLabel, { color: t.textTertiary }]}>Fiber: {Math.round(scannedProduct.fiber * servings)}g</Text>
                            </View>
                        )}

                        {/* Servings */}
                        <View style={styles.servingsRow}>
                            <Text style={[styles.servingsLabel, { color: t.textSecondary }]}>Servings:</Text>
                            <TouchableOpacity style={[styles.servBtn, { backgroundColor: t.glass }]} onPress={() => setServings(Math.max(0.5, servings - 0.5))}>
                                <Ionicons name="remove" size={20} color={t.text} />
                            </TouchableOpacity>
                            <Text style={[styles.servingsValue, { color: t.text }]}>{servings}</Text>
                            <TouchableOpacity style={[styles.servBtn, { backgroundColor: t.glass }]} onPress={() => setServings(servings + 0.5)}>
                                <Ionicons name="add" size={20} color={t.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm */}
                        <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: t.primary }]} onPress={handleConfirm}>
                            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                            <Text style={styles.confirmText}>Confirm Log</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const NutrientBox = ({ label, value, color, highlight, theme }: any) => (
    <View style={[nb.box, { backgroundColor: highlight ? color + '10' : theme.glass, borderColor: highlight ? color + '30' : 'transparent' }]}>
        <Text style={[nb.value, { color: highlight ? color : theme.text }]}>{value}</Text>
        <Text style={[nb.label, { color: theme.textTertiary }]}>{label}</Text>
    </View>
);
const nb = StyleSheet.create({
    box: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: BorderRadius.md, borderWidth: 1 },
    value: { fontSize: 20, fontWeight: '800' },
    label: { fontSize: 11, marginTop: 2 },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    modeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
    modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.lg, borderWidth: 1 },
    modeText: { fontSize: 14, fontWeight: '600' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
    // Scan
    scanArea: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', ...Shadow.light },
    scanTitle: { fontSize: 20, fontWeight: '700', marginTop: Spacing.md },
    scanHint: { fontSize: 14, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
    manualRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.lg, width: '100%' },
    barcodeInput: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600' },
    lookupBtn: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    testLabel: { fontSize: 12, marginTop: Spacing.lg, marginBottom: 8 },
    testRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
    testChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
    testEmoji: { fontSize: 16 },
    testName: { fontSize: 12 },
    // Search
    searchInput: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: Spacing.md },
    foodRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: 8, gap: 12 },
    foodEmoji: { fontSize: 28 },
    foodName: { fontSize: 15, fontWeight: '600' },
    foodMeta: { fontSize: 12, marginTop: 2 },
    foodCarbs: { alignItems: 'flex-end' },
    foodCarbsVal: { fontSize: 16, fontWeight: '800' },
    foodCarbsLabel: { fontSize: 10 },
    // Result
    resultCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', ...Shadow.light },
    resultEmoji: { fontSize: 56 },
    resultName: { fontSize: 22, fontWeight: '800', marginTop: Spacing.sm, textAlign: 'center' },
    resultBrand: { fontSize: 14, marginTop: 4 },
    resultServing: { fontSize: 13, marginTop: 4, marginBottom: Spacing.lg },
    nutritionGrid: { flexDirection: 'row', gap: 8, width: '100%' },
    extraNutrients: { flexDirection: 'row', gap: 16, marginTop: 8 },
    extraLabel: { fontSize: 12 },
    servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Spacing.lg },
    servingsLabel: { fontSize: 14, fontWeight: '600' },
    servBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    servingsValue: { fontSize: 20, fontWeight: '800', minWidth: 30, textAlign: 'center' },
    confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: BorderRadius.xl, paddingVertical: 16, width: '100%', marginTop: Spacing.lg },
    confirmText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
