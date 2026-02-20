import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput,
    Alert, Dimensions, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore } from '../store';

const { width } = Dimensions.get('window');

// ─── Open Food Facts API ────────────────────────────────────────────
// Free, open-source, global food database with 3M+ products
// No API key required. Data contributed by volunteers worldwide.
// Docs: https://wiki.openfoodfacts.org/API

interface ProductData {
    name: string;
    brand: string;
    serving: string;
    carbs: number;
    calories: number;
    protein: number;
    fat: number;
    fiber: number;
    sugar: number;
    imageUrl: string | null;
    barcode: string;
    nutriScore: string | null;
    novaGroup: number | null;
    ingredients: string | null;
    allergens: string | null;
    categories: string | null;
}

// Fetch product data from Open Food Facts API
async function fetchProductByBarcode(barcode: string): Promise<ProductData | null> {
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
            {
                headers: {
                    'User-Agent': 'GlucoTrackAI/1.0 (contact@glucotrack.app)',
                },
            }
        );
        const data = await response.json();

        if (data.status !== 1 || !data.product) {
            return null;
        }

        const p = data.product;
        const n = p.nutriments || {};

        return {
            name: p.product_name || p.product_name_en || 'Unknown Product',
            brand: p.brands || '',
            serving: p.serving_size || p.quantity || '1 serving',
            carbs: Math.round(n.carbohydrates_serving || n.carbohydrates_100g || 0),
            calories: Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0),
            protein: Math.round((n.proteins_serving || n.proteins_100g || 0) * 10) / 10,
            fat: Math.round((n.fat_serving || n.fat_100g || 0) * 10) / 10,
            fiber: Math.round((n.fiber_serving || n.fiber_100g || 0) * 10) / 10,
            sugar: Math.round((n.sugars_serving || n.sugars_100g || 0) * 10) / 10,
            imageUrl: p.image_front_small_url || p.image_url || null,
            barcode: barcode,
            nutriScore: p.nutriscore_grade || null,
            novaGroup: p.nova_group || null,
            ingredients: p.ingredients_text || p.ingredients_text_en || null,
            allergens: p.allergens || null,
            categories: p.categories || null,
        };
    } catch (error) {
        console.error('Open Food Facts API error:', error);
        return null;
    }
}

// Search products by name from Open Food Facts API
async function searchProductsByName(query: string): Promise<ProductData[]> {
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,serving_size,quantity,nutriments,image_front_small_url,code,nutriscore_grade`,
            {
                headers: {
                    'User-Agent': 'GlucoTrackAI/1.0 (contact@glucotrack.app)',
                },
            }
        );
        const data = await response.json();

        if (!data.products || data.products.length === 0) {
            return [];
        }

        return data.products
            .filter((p: any) => p.product_name)
            .map((p: any) => {
                const n = p.nutriments || {};
                return {
                    name: p.product_name || 'Unknown',
                    brand: p.brands || '',
                    serving: p.serving_size || p.quantity || '100g',
                    carbs: Math.round(n.carbohydrates_serving || n.carbohydrates_100g || 0),
                    calories: Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0),
                    protein: Math.round((n.proteins_serving || n.proteins_100g || 0) * 10) / 10,
                    fat: Math.round((n.fat_serving || n.fat_100g || 0) * 10) / 10,
                    fiber: Math.round((n.fiber_serving || n.fiber_100g || 0) * 10) / 10,
                    sugar: Math.round((n.sugars_serving || n.sugars_100g || 0) * 10) / 10,
                    imageUrl: p.image_front_small_url || null,
                    barcode: p.code || '',
                    nutriScore: p.nutriscore_grade || null,
                    novaGroup: null,
                    ingredients: null,
                    allergens: null,
                    categories: null,
                };
            });
    } catch (error) {
        console.error('Open Food Facts search error:', error);
        return [];
    }
}

// Nutri-Score colors
const nutriScoreColors: Record<string, { bg: string; text: string; label: string }> = {
    'a': { bg: '#038141', text: '#FFF', label: 'A — Excellent' },
    'b': { bg: '#85BB2F', text: '#FFF', label: 'B — Good' },
    'c': { bg: '#FECB02', text: '#000', label: 'C — Average' },
    'd': { bg: '#EE8100', text: '#FFF', label: 'D — Poor' },
    'e': { bg: '#E63E11', text: '#FFF', label: 'E — Bad' },
};

// Get emoji based on category/name
function getProductEmoji(product: ProductData): string {
    const name = (product.name + ' ' + (product.categories || '')).toLowerCase();
    if (name.includes('cola') || name.includes('soda') || name.includes('drink')) return '🥤';
    if (name.includes('juice')) return '🧃';
    if (name.includes('milk') || name.includes('yogurt') || name.includes('dairy')) return '🥛';
    if (name.includes('chocolate') || name.includes('candy')) return '🍫';
    if (name.includes('bread') || name.includes('toast')) return '🍞';
    if (name.includes('cereal') || name.includes('granola') || name.includes('oat')) return '🥣';
    if (name.includes('cookie') || name.includes('biscuit')) return '🍪';
    if (name.includes('chip') || name.includes('crisp')) return '🍟';
    if (name.includes('noodle') || name.includes('pasta') || name.includes('ramen')) return '🍜';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('ice cream')) return '🍦';
    if (name.includes('cake') || name.includes('pastry')) return '🎂';
    if (name.includes('fruit') || name.includes('apple') || name.includes('banana')) return '🍎';
    if (name.includes('nut') || name.includes('almond') || name.includes('peanut')) return '🥜';
    if (name.includes('rice')) return '🍚';
    if (name.includes('bar') || name.includes('protein')) return '💪';
    if (name.includes('water')) return '💧';
    if (name.includes('tea') || name.includes('coffee')) return '☕';
    if (name.includes('sauce') || name.includes('ketchup')) return '🫙';
    if (name.includes('cheese')) return '🧀';
    if (name.includes('egg')) return '🥚';
    if (name.includes('meat') || name.includes('chicken') || name.includes('beef')) return '🍖';
    if (name.includes('fish') || name.includes('tuna') || name.includes('salmon')) return '🐟';
    return '🛒';
}

export const BarcodeScanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useSettingsStore();
    const { addCarbLog } = useLogsStore();
    const t = getThemeColors(theme);

    const [mode, setMode] = useState<'scan' | 'search' | 'result'>('scan');
    const [searchQuery, setSearchQuery] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
    const [searchResults, setSearchResults] = useState<ProductData[]>([]);
    const [servings, setServings] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchTimeout, setSearchTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [recentScans, setRecentScans] = useState<ProductData[]>([]);

    // ─── Barcode Lookup via Open Food Facts ─────────────────────────
    const handleBarcodeLookup = useCallback(async () => {
        const code = barcodeInput.trim();
        if (!code) return;
        if (code.length < 8) {
            Alert.alert('Invalid Barcode', 'Please enter a valid barcode (at least 8 digits).');
            return;
        }

        setLoading(true);
        try {
            const product = await fetchProductByBarcode(code);
            if (product) {
                setScannedProduct(product);
                setRecentScans(prev => {
                    const filtered = prev.filter(p => p.barcode !== product.barcode);
                    return [product, ...filtered].slice(0, 10); // Keep last 10
                });
                setMode('result');
            } else {
                Alert.alert(
                    '🔍 Product Not Found',
                    `Barcode "${code}" was not found in the Open Food Facts database (3M+ products).\n\nTry searching by product name instead.`,
                    [
                        { text: 'Search by Name', onPress: () => setMode('search') },
                        { text: 'OK' },
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Network Error', 'Could not connect to the food database. Check your internet connection.');
        }
        setLoading(false);
    }, [barcodeInput]);

    // ─── Search by Product Name via Open Food Facts ─────────────────
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);

        // Debounce: wait 500ms after user stops typing
        if (searchTimeout) clearTimeout(searchTimeout);

        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            const results = await searchProductsByName(query.trim());
            setSearchResults(results);
            setLoading(false);
        }, 500);

        setSearchTimeoutId(timeoutId);
    }, [searchTimeout]);

    const handleSelectProduct = (product: ProductData) => {
        setScannedProduct(product);
        setServings(1);
        setMode('result');
    };

    // ─── Confirm & Log Meal ─────────────────────────────────────────
    const handleConfirm = () => {
        if (!scannedProduct) return;
        const totalCarbs = Math.round(scannedProduct.carbs * servings);
        const displayName = scannedProduct.name + (scannedProduct.brand ? ` (${scannedProduct.brand})` : '');

        addCarbLog({
            id: Date.now().toString(),
            user_id: 'local',
            food_name: displayName,
            estimated_carbs: totalCarbs,
            image_url: scannedProduct.imageUrl,
            created_at: new Date().toISOString(),
        });

        Alert.alert('✅ Logged!', `${displayName}\n${totalCarbs}g carbs • ${Math.round(scannedProduct.calories * servings)} cal`, [
            { text: 'Scan Another', onPress: () => { setMode('scan'); setScannedProduct(null); setServings(1); setBarcodeInput(''); } },
            { text: 'Done', onPress: () => navigation.goBack() },
        ]);
    };

    // ─── Nutri-Score Badge ──────────────────────────────────────────
    const NutriScoreBadge = ({ grade }: { grade: string | null }) => {
        if (!grade || !nutriScoreColors[grade]) return null;
        const ns = nutriScoreColors[grade];
        return (
            <View style={[styles.nutriBadge, { backgroundColor: ns.bg }]}>
                <Text style={[styles.nutriBadgeText, { color: ns.text }]}>Nutri-Score {ns.label}</Text>
            </View>
        );
    };

    // ─── Glycemic Impact Indicator ──────────────────────────────────
    const GlycemicImpact = ({ product }: { product: ProductData }) => {
        const carbsPerServing = product.carbs;
        const sugarRatio = product.sugar / Math.max(1, product.carbs);
        const hasFiber = product.fiber >= 3;

        let impact: 'Low' | 'Medium' | 'High';
        let color: string;
        let emoji: string;

        if (carbsPerServing <= 10 || (hasFiber && sugarRatio < 0.3)) {
            impact = 'Low'; color = '#4CAF50'; emoji = '🟢';
        } else if (carbsPerServing <= 30 && sugarRatio < 0.6) {
            impact = 'Medium'; color = '#FF9800'; emoji = '🟡';
        } else {
            impact = 'High'; color = '#FF5252'; emoji = '🔴';
        }

        return (
            <View style={[styles.glycemicCard, { backgroundColor: color + '10', borderColor: color + '30' }]}>
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.glycemicTitle, { color }]}>Glycemic Impact: {impact}</Text>
                    <Text style={[styles.glycemicHint, { color: t.textTertiary }]}>
                        {impact === 'Low' ? 'Minimal effect on blood sugar.' :
                            impact === 'Medium' ? 'Moderate blood sugar rise expected.' :
                                'Significant blood sugar spike likely. Plan accordingly.'}
                    </Text>
                </View>
            </View>
        );
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
                <TouchableOpacity
                    style={[styles.modeTab, { backgroundColor: mode === 'scan' || mode === 'result' ? t.primary : t.card, borderColor: mode === 'scan' || mode === 'result' ? t.primary : t.border }]}
                    onPress={() => { setMode('scan'); setScannedProduct(null); }}
                >
                    <Ionicons name="barcode" size={18} color={mode === 'scan' || mode === 'result' ? '#FFF' : t.textSecondary} />
                    <Text style={[styles.modeText, { color: mode === 'scan' || mode === 'result' ? '#FFF' : t.textSecondary }]}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeTab, { backgroundColor: mode === 'search' ? t.primary : t.card, borderColor: mode === 'search' ? t.primary : t.border }]}
                    onPress={() => { setMode('search'); setScannedProduct(null); setSearchResults([]); setSearchQuery(''); }}
                >
                    <Ionicons name="search" size={18} color={mode === 'search' ? '#FFF' : t.textSecondary} />
                    <Text style={[styles.modeText, { color: mode === 'search' ? '#FFF' : t.textSecondary }]}>Search</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* ═══ SCAN MODE ═══════════════════════════════════════ */}
                {mode === 'scan' && (
                    <>
                        <View style={[styles.scanArea, { backgroundColor: t.card, borderColor: t.border }]}>
                            <MaterialCommunityIcons name="barcode-scan" size={64} color={t.primary} />
                            <Text style={[styles.scanTitle, { color: t.text }]}>Scan or Enter Barcode</Text>
                            <Text style={[styles.scanHint, { color: t.textTertiary }]}>
                                Enter any barcode number to look up nutrition data from the Open Food Facts database (3M+ products worldwide).
                            </Text>

                            {/* Manual Entry */}
                            <View style={styles.manualRow}>
                                <TextInput
                                    style={[styles.barcodeInput, { color: t.text, borderColor: t.border, backgroundColor: t.background }]}
                                    value={barcodeInput}
                                    onChangeText={setBarcodeInput}
                                    placeholder="Enter barcode (e.g. 3017620422003)"
                                    placeholderTextColor={t.textTertiary}
                                    keyboardType="number-pad"
                                    returnKeyType="search"
                                    onSubmitEditing={handleBarcodeLookup}
                                />
                                <TouchableOpacity
                                    style={[styles.lookupBtn, { backgroundColor: loading ? t.glass : t.primary }]}
                                    onPress={handleBarcodeLookup}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Ionicons name="search" size={20} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* API Info */}
                            <View style={[styles.apiInfo, { backgroundColor: t.glass }]}>
                                <MaterialCommunityIcons name="database" size={14} color={t.textTertiary} />
                                <Text style={[styles.apiInfoText, { color: t.textTertiary }]}>
                                    Powered by Open Food Facts — 3M+ products • Free & Open Source
                                </Text>
                            </View>
                        </View>

                        {/* Recent Scans */}
                        {recentScans.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>🕐 RECENT SCANS</Text>
                                {recentScans.map((product, i) => (
                                    <TouchableOpacity
                                        key={`${product.barcode}-${i}`}
                                        style={[styles.recentRow, { backgroundColor: t.card, borderColor: t.border }]}
                                        onPress={() => handleSelectProduct(product)}
                                    >
                                        {product.imageUrl ? (
                                            <Image source={{ uri: product.imageUrl }} style={styles.recentImage} />
                                        ) : (
                                            <Text style={styles.recentEmoji}>{getProductEmoji(product)}</Text>
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.recentName, { color: t.text }]} numberOfLines={1}>{product.name}</Text>
                                            <Text style={[styles.recentBrand, { color: t.textTertiary }]}>{product.brand || 'Unknown brand'}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.recentCarbs, { color: t.primary }]}>{product.carbs}g</Text>
                                            <Text style={[styles.recentCarbsLabel, { color: t.textTertiary }]}>carbs</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {/* Example Barcodes */}
                        <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>💡 TRY THESE REAL BARCODES</Text>
                        <View style={styles.exampleGrid}>
                            {[
                                { code: '3017620422003', name: 'Nutella', emoji: '🫙' },
                                { code: '5449000000996', name: 'Coca-Cola', emoji: '🥤' },
                                { code: '5000159407236', name: 'Coca-Cola UK', emoji: '🥤' },
                                { code: '7613034626844', name: 'Nescafe', emoji: '☕' },
                                { code: '3175680011480', name: 'Evian Water', emoji: '💧' },
                                { code: '80177646', name: 'Snickers', emoji: '🍫' },
                            ].map(ex => (
                                <TouchableOpacity
                                    key={ex.code}
                                    style={[styles.exampleChip, { backgroundColor: t.glass, borderColor: t.border }]}
                                    onPress={() => { setBarcodeInput(ex.code); }}
                                >
                                    <Text style={{ fontSize: 20 }}>{ex.emoji}</Text>
                                    <View>
                                        <Text style={[styles.exampleName, { color: t.text }]}>{ex.name}</Text>
                                        <Text style={[styles.exampleCode, { color: t.textTertiary }]}>{ex.code}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {/* ═══ SEARCH MODE ═════════════════════════════════════ */}
                {mode === 'search' && (
                    <>
                        <TextInput
                            style={[styles.searchInput, { color: t.text, borderColor: t.border, backgroundColor: t.card }]}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            placeholder="🔍 Search any food product..."
                            placeholderTextColor={t.textTertiary}
                            autoFocus
                        />

                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={t.primary} />
                                <Text style={[styles.loadingText, { color: t.textSecondary }]}>Searching Open Food Facts...</Text>
                            </View>
                        )}

                        {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
                            <View style={styles.emptySearch}>
                                <MaterialCommunityIcons name="food-off" size={48} color={t.textTertiary} />
                                <Text style={[styles.emptyText, { color: t.textSecondary }]}>No products found for "{searchQuery}"</Text>
                                <Text style={[styles.emptyHint, { color: t.textTertiary }]}>Try a different spelling or brand name</Text>
                            </View>
                        )}

                        {searchResults.map((product, i) => (
                            <TouchableOpacity
                                key={`${product.barcode}-${i}`}
                                style={[styles.foodRow, { backgroundColor: t.card, borderColor: t.border }]}
                                onPress={() => handleSelectProduct(product)}
                            >
                                {product.imageUrl ? (
                                    <Image source={{ uri: product.imageUrl }} style={styles.foodImage} />
                                ) : (
                                    <Text style={styles.foodEmoji}>{getProductEmoji(product)}</Text>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.foodName, { color: t.text }]} numberOfLines={2}>{product.name}</Text>
                                    <Text style={[styles.foodBrandText, { color: t.textTertiary }]}>{product.brand || 'Unknown brand'} • {product.serving}</Text>
                                </View>
                                <View style={styles.foodCarbs}>
                                    <Text style={[styles.foodCarbsVal, { color: t.primary }]}>{product.carbs}g</Text>
                                    <Text style={[styles.foodCarbsLabel, { color: t.textTertiary }]}>carbs</Text>
                                    <Text style={[styles.foodCalText, { color: t.textTertiary }]}>{product.calories} cal</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        {!loading && searchQuery.length < 2 && (
                            <View style={styles.searchTip}>
                                <MaterialCommunityIcons name="lightbulb-outline" size={20} color={t.textTertiary} />
                                <Text style={[styles.searchTipText, { color: t.textTertiary }]}>
                                    Type at least 2 characters to search the Open Food Facts database. Try product names, brands, or categories.
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* ═══ RESULT MODE ═════════════════════════════════════ */}
                {mode === 'result' && scannedProduct && (
                    <>
                        <View style={[styles.resultCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            {/* Product Image */}
                            {scannedProduct.imageUrl ? (
                                <Image source={{ uri: scannedProduct.imageUrl }} style={styles.resultImage} />
                            ) : (
                                <Text style={styles.resultEmoji}>{getProductEmoji(scannedProduct)}</Text>
                            )}

                            <Text style={[styles.resultName, { color: t.text }]}>{scannedProduct.name}</Text>
                            {scannedProduct.brand ? (
                                <Text style={[styles.resultBrand, { color: t.textTertiary }]}>{scannedProduct.brand}</Text>
                            ) : null}
                            <Text style={[styles.resultServing, { color: t.textSecondary }]}>
                                Per serving: {scannedProduct.serving}
                            </Text>

                            {/* Nutri-Score */}
                            <NutriScoreBadge grade={scannedProduct.nutriScore} />

                            {/* Nutrition Grid */}
                            <View style={styles.nutritionGrid}>
                                <NutrientBox label="Carbs" value={`${Math.round(scannedProduct.carbs * servings)}g`} color="#0A85FF" highlight theme={t} />
                                <NutrientBox label="Calories" value={`${Math.round(scannedProduct.calories * servings)}`} color="#FF9800" theme={t} />
                                <NutrientBox label="Protein" value={`${Math.round(scannedProduct.protein * servings * 10) / 10}g`} color="#4CAF50" theme={t} />
                                <NutrientBox label="Fat" value={`${Math.round(scannedProduct.fat * servings * 10) / 10}g`} color="#FF5252" theme={t} />
                            </View>

                            {/* Extra Nutrients */}
                            <View style={styles.extraNutrients}>
                                <View style={[styles.extraChip, { backgroundColor: t.glass }]}>
                                    <Text style={[styles.extraChipLabel, { color: t.textTertiary }]}>Sugar</Text>
                                    <Text style={[styles.extraChipValue, { color: scannedProduct.sugar > 10 ? '#FF5252' : t.text }]}>
                                        {Math.round(scannedProduct.sugar * servings * 10) / 10}g
                                    </Text>
                                </View>
                                <View style={[styles.extraChip, { backgroundColor: t.glass }]}>
                                    <Text style={[styles.extraChipLabel, { color: t.textTertiary }]}>Fiber</Text>
                                    <Text style={[styles.extraChipValue, { color: scannedProduct.fiber >= 3 ? '#4CAF50' : t.text }]}>
                                        {Math.round(scannedProduct.fiber * servings * 10) / 10}g
                                    </Text>
                                </View>
                            </View>

                            {/* Glycemic Impact */}
                            <GlycemicImpact product={scannedProduct} />

                            {/* Ingredients */}
                            {scannedProduct.ingredients && (
                                <View style={[styles.ingredientsBox, { backgroundColor: t.glass }]}>
                                    <Text style={[styles.ingredientsTitle, { color: t.textSecondary }]}>Ingredients</Text>
                                    <Text style={[styles.ingredientsText, { color: t.textTertiary }]} numberOfLines={4}>
                                        {scannedProduct.ingredients}
                                    </Text>
                                </View>
                            )}

                            {/* Allergens */}
                            {scannedProduct.allergens && scannedProduct.allergens.length > 0 && (
                                <View style={[styles.allergenBox, { backgroundColor: '#FFF3E0' }]}>
                                    <MaterialCommunityIcons name="alert-circle" size={16} color="#E65100" />
                                    <Text style={styles.allergenText}>Allergens: {scannedProduct.allergens}</Text>
                                </View>
                            )}

                            {/* Servings Adjuster */}
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
                                <Text style={styles.confirmText}>Log {Math.round(scannedProduct.carbs * servings)}g Carbs</Text>
                            </TouchableOpacity>

                            {/* Barcode */}
                            {scannedProduct.barcode && (
                                <Text style={[styles.barcodeLabel, { color: t.textTertiary }]}>
                                    Barcode: {scannedProduct.barcode}
                                </Text>
                            )}
                        </View>

                        {/* Data Source */}
                        <View style={[styles.sourceBox, { backgroundColor: t.glass }]}>
                            <MaterialCommunityIcons name="information" size={14} color={t.textTertiary} />
                            <Text style={[styles.sourceText, { color: t.textTertiary }]}>
                                Data from Open Food Facts (openfoodfacts.org). Nutritional values are community-contributed and may vary from actual product labels.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Sub-Components ─────────────────────────────────────────────────

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

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    modeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
    modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.lg, borderWidth: 1 },
    modeText: { fontSize: 14, fontWeight: '600' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xl, marginBottom: Spacing.sm },

    // Scan Area
    scanArea: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', ...Shadow.light },
    scanTitle: { fontSize: 20, fontWeight: '700', marginTop: Spacing.md },
    scanHint: { fontSize: 14, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
    manualRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.lg, width: '100%' },
    barcodeInput: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600' },
    lookupBtn: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    apiInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    apiInfoText: { fontSize: 11 },

    // Examples
    exampleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    exampleChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, width: (width - Spacing.lg * 2 - 8) / 2 },
    exampleName: { fontSize: 13, fontWeight: '600' },
    exampleCode: { fontSize: 10, marginTop: 1 },

    // Recent Scans
    recentRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.sm, marginBottom: 6, gap: 10 },
    recentImage: { width: 40, height: 40, borderRadius: 8 },
    recentEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
    recentName: { fontSize: 14, fontWeight: '600' },
    recentBrand: { fontSize: 11, marginTop: 1 },
    recentCarbs: { fontSize: 16, fontWeight: '800' },
    recentCarbsLabel: { fontSize: 10 },

    // Search
    searchInput: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: Spacing.md },
    loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    loadingText: { fontSize: 14 },
    emptySearch: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyText: { fontSize: 15, fontWeight: '600' },
    emptyHint: { fontSize: 13 },
    searchTip: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: Spacing.md },
    searchTipText: { flex: 1, fontSize: 13, lineHeight: 19 },

    // Food Row (search results)
    foodRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.sm, marginBottom: 8, gap: 10 },
    foodImage: { width: 48, height: 48, borderRadius: 8 },
    foodEmoji: { fontSize: 32, width: 48, textAlign: 'center' },
    foodName: { fontSize: 14, fontWeight: '600' },
    foodBrandText: { fontSize: 11, marginTop: 2 },
    foodCarbs: { alignItems: 'flex-end' },
    foodCarbsVal: { fontSize: 16, fontWeight: '800' },
    foodCarbsLabel: { fontSize: 10 },
    foodCalText: { fontSize: 10, marginTop: 1 },

    // Result Card
    resultCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', ...Shadow.light },
    resultImage: { width: 120, height: 120, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm },
    resultEmoji: { fontSize: 64, marginBottom: Spacing.sm },
    resultName: { fontSize: 22, fontWeight: '800', marginTop: Spacing.sm, textAlign: 'center' },
    resultBrand: { fontSize: 14, marginTop: 4 },
    resultServing: { fontSize: 13, marginTop: 4, marginBottom: Spacing.md },
    nutriBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: Spacing.md },
    nutriBadgeText: { fontSize: 12, fontWeight: '700' },
    nutritionGrid: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 8 },
    extraNutrients: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: Spacing.md },
    extraChip: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.md },
    extraChipLabel: { fontSize: 12 },
    extraChipValue: { fontSize: 14, fontWeight: '700' },
    glycemicCard: { flexDirection: 'row', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm, gap: 10, alignItems: 'flex-start', width: '100%', marginBottom: Spacing.md },
    glycemicTitle: { fontSize: 14, fontWeight: '700' },
    glycemicHint: { fontSize: 12, marginTop: 2, lineHeight: 17 },
    ingredientsBox: { borderRadius: BorderRadius.md, padding: Spacing.sm, width: '100%', marginBottom: 8 },
    ingredientsTitle: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    ingredientsText: { fontSize: 11, lineHeight: 16 },
    allergenBox: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: BorderRadius.md, padding: Spacing.sm, width: '100%', marginBottom: Spacing.md },
    allergenText: { fontSize: 12, color: '#E65100', flex: 1 },
    servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Spacing.sm },
    servingsLabel: { fontSize: 14, fontWeight: '600' },
    servBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    servingsValue: { fontSize: 20, fontWeight: '800', minWidth: 30, textAlign: 'center' },
    confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: BorderRadius.xl, paddingVertical: 16, width: '100%', marginTop: Spacing.lg },
    confirmText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    barcodeLabel: { fontSize: 11, marginTop: 8 },
    sourceBox: { flexDirection: 'row', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.md, gap: 8, alignItems: 'flex-start' },
    sourceText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
