import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput,
    Alert, Dimensions, ActivityIndicator, Image, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore } from '../store';

const { width } = Dimensions.get('window');

// ─── Country/Region Configuration ───────────────────────────────────
// Open Food Facts uses country tag codes for filtering
interface CountryRegion {
    id: string;
    name: string;
    flag: string;
    tag: string; // Open Food Facts country tag
    popularFoods: string[]; // Example search terms popular in this region
}

const REGIONS: CountryRegion[] = [
    { id: 'world', name: 'All Countries', flag: '🌍', tag: '', popularFoods: ['chocolate', 'milk', 'bread', 'cereal', 'juice'] },
    { id: 'uae', name: 'UAE', flag: '🇦🇪', tag: 'en:united-arab-emirates', popularFoods: ['al ain milk', 'lacnor juice', 'rani juice', 'almarai', 'al rawabi'] },
    { id: 'saudi', name: 'Saudi Arabia', flag: '🇸🇦', tag: 'en:saudi-arabia', popularFoods: ['almarai milk', 'nadec', 'sadafco', 'hana water', 'saudia juice'] },
    { id: 'pakistan', name: 'Pakistan', flag: '🇵🇰', tag: 'en:pakistan', popularFoods: ['nestle pakistan', 'tapal tea', 'olpers milk', 'kolson', 'national spices'] },
    { id: 'india', name: 'India', flag: '🇮🇳', tag: 'en:india', popularFoods: ['amul milk', 'parle-g', 'britannia', 'maggi noodles', 'haldiram'] },
    { id: 'kuwait', name: 'Kuwait', flag: '🇰🇼', tag: 'en:kuwait', popularFoods: ['kdcow milk', 'kdd juice', 'americana'] },
    { id: 'qatar', name: 'Qatar', flag: '🇶🇦', tag: 'en:qatar', popularFoods: ['baladna milk', 'al rawabi'] },
    { id: 'bahrain', name: 'Bahrain', flag: '🇧🇭', tag: 'en:bahrain', popularFoods: ['awal dairy', 'al jazira'] },
    { id: 'oman', name: 'Oman', flag: '🇴🇲', tag: 'en:oman', popularFoods: ['mazoon dairy', 'al marai'] },
    { id: 'egypt', name: 'Egypt', flag: '🇪🇬', tag: 'en:egypt', popularFoods: ['juhayna', 'faragalla', 'el maraei', 'halawa'] },
    { id: 'jordan', name: 'Jordan', flag: '🇯🇴', tag: 'en:jordan', popularFoods: ['hammoudeh', 'candia'] },
    { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', tag: 'en:united-kingdom', popularFoods: ['tesco', 'sainsbury', 'hovis bread', 'cadbury', 'mcvities'] },
    { id: 'usa', name: 'United States', flag: '🇺🇸', tag: 'en:united-states', popularFoods: ['cheerios', 'coca-cola', 'oreo', 'lay chips', 'wonder bread'] },
    { id: 'france', name: 'France', flag: '🇫🇷', tag: 'en:france', popularFoods: ['nutella', 'danone', 'bonne maman', 'lu biscuits'] },
    { id: 'germany', name: 'Germany', flag: '🇩🇪', tag: 'en:germany', popularFoods: ['haribo', 'milka', 'ritter sport', 'aldi'] },
    { id: 'turkey', name: 'Turkey', flag: '🇹🇷', tag: 'en:turkey', popularFoods: ['ulker', 'eti', 'pinar', 'torku'] },
    { id: 'bangladesh', name: 'Bangladesh', flag: '🇧🇩', tag: 'en:bangladesh', popularFoods: ['pran', 'aarong milk', 'ifad'] },
    { id: 'malaysia', name: 'Malaysia', flag: '🇲🇾', tag: 'en:malaysia', popularFoods: ['dutch lady', 'gardenia', 'milo'] },
    { id: 'indonesia', name: 'Indonesia', flag: '🇮🇩', tag: 'en:indonesia', popularFoods: ['indomie', 'ultra milk', 'teh botol'] },
    { id: 'philippines', name: 'Philippines', flag: '🇵🇭', tag: 'en:philippines', popularFoods: ['del monte', 'alaska milk', 'c2'] },
    { id: 'australia', name: 'Australia', flag: '🇦🇺', tag: 'en:australia', popularFoods: ['vegemite', 'tim tam', 'weet-bix'] },
    { id: 'canada', name: 'Canada', flag: '🇨🇦', tag: 'en:canada', popularFoods: ['presidents choice', 'no name', 'maple leaf'] },
];

// ─── Open Food Facts API ────────────────────────────────────────────
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
    countries: string | null;
}

function parseProduct(p: any, barcode?: string): ProductData {
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
        barcode: barcode || p.code || '',
        nutriScore: p.nutriscore_grade || null,
        novaGroup: p.nova_group || null,
        ingredients: p.ingredients_text || p.ingredients_text_en || null,
        allergens: p.allergens || null,
        categories: p.categories || null,
        countries: p.countries || null,
    };
}

// Fetch product by barcode
async function fetchProductByBarcode(barcode: string): Promise<ProductData | null> {
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
            { headers: { 'User-Agent': 'GlucoTrackAI/1.0 (contact@glucotrack.app)' } }
        );
        const data = await response.json();
        if (data.status !== 1 || !data.product) return null;
        return parseProduct(data.product, barcode);
    } catch (error) {
        console.error('Open Food Facts API error:', error);
        return null;
    }
}

// Search products with optional country filter
async function searchProductsByName(query: string, countryTag?: string): Promise<ProductData[]> {
    try {
        let url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25&fields=product_name,brands,serving_size,quantity,nutriments,image_front_small_url,code,nutriscore_grade,countries`;

        // Add country filter if specified
        if (countryTag) {
            url += `&tagtype_0=countries&tag_contains_0=contains&tag_0=${encodeURIComponent(countryTag)}`;
        }

        const response = await fetch(url, {
            headers: { 'User-Agent': 'GlucoTrackAI/1.0 (contact@glucotrack.app)' },
        });
        const data = await response.json();

        if (!data.products || data.products.length === 0) return [];

        return data.products
            .filter((p: any) => p.product_name)
            .map((p: any) => parseProduct(p));
    } catch (error) {
        console.error('Open Food Facts search error:', error);
        return [];
    }
}

// Fetch popular/trending products for a country
async function fetchPopularProducts(countryTag: string): Promise<ProductData[]> {
    try {
        let url: string;
        if (countryTag) {
            url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&page_size=20&sort_by=unique_scans_n&fields=product_name,brands,serving_size,quantity,nutriments,image_front_small_url,code,nutriscore_grade,countries&tagtype_0=countries&tag_contains_0=contains&tag_0=${encodeURIComponent(countryTag)}`;
        } else {
            url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&page_size=20&sort_by=unique_scans_n&fields=product_name,brands,serving_size,quantity,nutriments,image_front_small_url,code,nutriscore_grade,countries`;
        }
        const response = await fetch(url, {
            headers: { 'User-Agent': 'GlucoTrackAI/1.0 (contact@glucotrack.app)' },
        });
        const data = await response.json();
        if (!data.products) return [];
        return data.products.filter((p: any) => p.product_name).map((p: any) => parseProduct(p));
    } catch (error) {
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
    if (name.includes('cola') || name.includes('soda') || name.includes('drink') || name.includes('pepsi')) return '🥤';
    if (name.includes('juice') || name.includes('rani') || name.includes('lacnor')) return '🧃';
    if (name.includes('milk') || name.includes('yogurt') || name.includes('dairy') || name.includes('laban') || name.includes('lassi')) return '🥛';
    if (name.includes('chocolate') || name.includes('candy') || name.includes('snickers') || name.includes('kitkat')) return '🍫';
    if (name.includes('bread') || name.includes('toast') || name.includes('naan') || name.includes('roti') || name.includes('paratha')) return '🍞';
    if (name.includes('cereal') || name.includes('granola') || name.includes('oat')) return '🥣';
    if (name.includes('cookie') || name.includes('biscuit') || name.includes('parle')) return '🍪';
    if (name.includes('chip') || name.includes('crisp') || name.includes('kurkure')) return '🍟';
    if (name.includes('noodle') || name.includes('pasta') || name.includes('ramen') || name.includes('maggi') || name.includes('indomie')) return '🍜';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('ice cream')) return '🍦';
    if (name.includes('cake') || name.includes('pastry') || name.includes('halwa')) return '🎂';
    if (name.includes('fruit') || name.includes('apple') || name.includes('banana') || name.includes('mango') || name.includes('date') || name.includes('tamr')) return '🍎';
    if (name.includes('nut') || name.includes('almond') || name.includes('peanut') || name.includes('cashew')) return '🥜';
    if (name.includes('rice') || name.includes('biryani')) return '🍚';
    if (name.includes('bar') || name.includes('protein')) return '💪';
    if (name.includes('water')) return '💧';
    if (name.includes('tea') || name.includes('coffee') || name.includes('chai') || name.includes('karak')) return '☕';
    if (name.includes('sauce') || name.includes('ketchup') || name.includes('chutney') || name.includes('pickle') || name.includes('achaar')) return '🫙';
    if (name.includes('cheese') || name.includes('paneer')) return '🧀';
    if (name.includes('egg')) return '🥚';
    if (name.includes('meat') || name.includes('chicken') || name.includes('beef') || name.includes('kebab') || name.includes('tikka')) return '🍖';
    if (name.includes('fish') || name.includes('tuna') || name.includes('salmon')) return '🐟';
    if (name.includes('spice') || name.includes('masala')) return '🌶️';
    if (name.includes('oil') || name.includes('ghee')) return '🫒';
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
    const [searchTimeoutId, setSearchTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [recentScans, setRecentScans] = useState<ProductData[]>([]);

    // Country filter state
    const [selectedRegion, setSelectedRegion] = useState<CountryRegion>(REGIONS[0]); // Default: World
    const [countryModalVisible, setCountryModalVisible] = useState(false);
    const [trendingProducts, setTrendingProducts] = useState<ProductData[]>([]);
    const [trendingLoading, setTrendingLoading] = useState(false);

    // ─── Load Trending Products for Selected Country ────────────────
    const loadTrending = useCallback(async (region: CountryRegion) => {
        setTrendingLoading(true);
        try {
            const products = await fetchPopularProducts(region.tag);
            setTrendingProducts(products);
        } catch {
            setTrendingProducts([]);
        }
        setTrendingLoading(false);
    }, []);

    // ─── Change Country ─────────────────────────────────────────────
    const handleSelectCountry = (region: CountryRegion) => {
        setSelectedRegion(region);
        setCountryModalVisible(false);
        setSearchResults([]);
        setSearchQuery('');
        loadTrending(region);
    };

    // ─── Barcode Lookup ─────────────────────────────────────────────
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
                    return [product, ...filtered].slice(0, 10);
                });
                setMode('result');
            } else {
                Alert.alert(
                    '🔍 Product Not Found',
                    `Barcode "${code}" was not found in the database.\n\nTry searching by product name.`,
                    [
                        { text: 'Search by Name', onPress: () => setMode('search') },
                        { text: 'OK' },
                    ]
                );
            }
        } catch {
            Alert.alert('Network Error', 'Could not connect. Check your internet.');
        }
        setLoading(false);
    }, [barcodeInput]);

    // ─── Search with Country Filter ─────────────────────────────────
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (searchTimeoutId) clearTimeout(searchTimeoutId);
        if (query.trim().length < 2) { setSearchResults([]); return; }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            const results = await searchProductsByName(query.trim(), selectedRegion.tag || undefined);
            setSearchResults(results);
            setLoading(false);
        }, 500);
        setSearchTimeoutId(timeoutId);
    }, [searchTimeoutId, selectedRegion]);

    const handleSelectProduct = (product: ProductData) => {
        setScannedProduct(product);
        setServings(1);
        setRecentScans(prev => {
            const filtered = prev.filter(p => p.barcode !== product.barcode);
            return [product, ...filtered].slice(0, 10);
        });
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

    // ─── Sub-Components ─────────────────────────────────────────────
    const NutriScoreBadge = ({ grade }: { grade: string | null }) => {
        if (!grade || !nutriScoreColors[grade]) return null;
        const ns = nutriScoreColors[grade];
        return (
            <View style={[styles.nutriBadge, { backgroundColor: ns.bg }]}>
                <Text style={[styles.nutriBadgeText, { color: ns.text }]}>Nutri-Score {ns.label}</Text>
            </View>
        );
    };

    const GlycemicImpact = ({ product }: { product: ProductData }) => {
        const sugarRatio = product.sugar / Math.max(1, product.carbs);
        const hasFiber = product.fiber >= 3;
        let impact: string, color: string, emoji: string;
        if (product.carbs <= 10 || (hasFiber && sugarRatio < 0.3)) {
            impact = 'Low'; color = '#4CAF50'; emoji = '🟢';
        } else if (product.carbs <= 30 && sugarRatio < 0.6) {
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

    // ─── Product Row Component ──────────────────────────────────────
    const ProductRow = ({ product, onPress }: { product: ProductData; onPress: () => void }) => (
        <TouchableOpacity style={[styles.foodRow, { backgroundColor: t.card, borderColor: t.border }]} onPress={onPress}>
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
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Barcode Scanner</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Country Filter Bar */}
            <TouchableOpacity
                style={[styles.countryBar, { backgroundColor: t.card, borderColor: t.border }]}
                onPress={() => setCountryModalVisible(true)}
            >
                <Text style={{ fontSize: 20 }}>{selectedRegion.flag}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.countryBarLabel, { color: t.textTertiary }]}>REGION FILTER</Text>
                    <Text style={[styles.countryBarName, { color: t.text }]}>{selectedRegion.name}</Text>
                </View>
                <View style={[styles.countryChangeBtn, { backgroundColor: t.primary + '15' }]}>
                    <Ionicons name="globe" size={16} color={t.primary} />
                    <Text style={[styles.countryChangeText, { color: t.primary }]}>Change</Text>
                </View>
            </TouchableOpacity>

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
                                Enter any barcode number to look up nutrition from Open Food Facts (3M+ products worldwide).
                            </Text>

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
                                    {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="search" size={20} color="#FFF" />}
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.apiInfo, { backgroundColor: t.glass }]}>
                                <MaterialCommunityIcons name="database" size={14} color={t.textTertiary} />
                                <Text style={[styles.apiInfoText, { color: t.textTertiary }]}>
                                    Powered by Open Food Facts — 3M+ products • Free & Open Source
                                </Text>
                            </View>
                        </View>

                        {/* Popular in Region */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>
                                {selectedRegion.flag} POPULAR IN {selectedRegion.name.toUpperCase()}
                            </Text>
                            <TouchableOpacity onPress={() => loadTrending(selectedRegion)}>
                                <Text style={[styles.refreshBtn, { color: t.primary }]}>Refresh</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Popular Food Search Chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                            {selectedRegion.popularFoods.map((food, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.popularChip, { backgroundColor: t.glass, borderColor: t.border }]}
                                    onPress={() => { setSearchQuery(food); setMode('search'); handleSearch(food); }}
                                >
                                    <Ionicons name="search" size={12} color={t.textSecondary} />
                                    <Text style={[styles.popularChipText, { color: t.textSecondary }]}>{food}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {trendingLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={t.primary} />
                                <Text style={[styles.loadingText, { color: t.textSecondary }]}>Loading popular products...</Text>
                            </View>
                        )}

                        {!trendingLoading && trendingProducts.length > 0 && (
                            trendingProducts.slice(0, 8).map((product, i) => (
                                <ProductRow key={`${product.barcode}-${i}`} product={product} onPress={() => handleSelectProduct(product)} />
                            ))
                        )}

                        {/* Recent Scans */}
                        {recentScans.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>🕐 RECENT SCANS</Text>
                                {recentScans.map((product, i) => (
                                    <ProductRow key={`recent-${product.barcode}-${i}`} product={product} onPress={() => handleSelectProduct(product)} />
                                ))}
                            </>
                        )}

                        {/* Example Barcodes */}
                        <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>💡 TRY THESE BARCODES</Text>
                        <View style={styles.exampleGrid}>
                            {[
                                { code: '3017620422003', name: 'Nutella', emoji: '🫙' },
                                { code: '5449000000996', name: 'Coca-Cola', emoji: '🥤' },
                                { code: '80177646', name: 'Snickers', emoji: '🍫' },
                                { code: '7613034626844', name: 'Nescafe', emoji: '☕' },
                            ].map(ex => (
                                <TouchableOpacity
                                    key={ex.code}
                                    style={[styles.exampleChip, { backgroundColor: t.glass, borderColor: t.border }]}
                                    onPress={() => setBarcodeInput(ex.code)}
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
                            placeholder={`🔍 Search products in ${selectedRegion.name}...`}
                            placeholderTextColor={t.textTertiary}
                            autoFocus
                        />

                        {/* Region Quick Filter */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                            {REGIONS.slice(0, 10).map(region => (
                                <TouchableOpacity
                                    key={region.id}
                                    style={[
                                        styles.regionChip,
                                        { backgroundColor: selectedRegion.id === region.id ? t.primary : t.glass, borderColor: selectedRegion.id === region.id ? t.primary : t.border },
                                    ]}
                                    onPress={() => { setSelectedRegion(region); if (searchQuery.length >= 2) handleSearch(searchQuery); }}
                                >
                                    <Text style={{ fontSize: 14 }}>{region.flag}</Text>
                                    <Text style={[styles.regionChipText, { color: selectedRegion.id === region.id ? '#FFF' : t.textSecondary }]}>
                                        {region.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.regionChip, { backgroundColor: t.glass, borderColor: t.border }]}
                                onPress={() => setCountryModalVisible(true)}
                            >
                                <Text style={{ fontSize: 14 }}>➕</Text>
                                <Text style={[styles.regionChipText, { color: t.textSecondary }]}>More</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={t.primary} />
                                <Text style={[styles.loadingText, { color: t.textSecondary }]}>Searching in {selectedRegion.name}...</Text>
                            </View>
                        )}

                        {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
                            <View style={styles.emptySearch}>
                                <MaterialCommunityIcons name="food-off" size={48} color={t.textTertiary} />
                                <Text style={[styles.emptyText, { color: t.textSecondary }]}>No products found for "{searchQuery}"</Text>
                                <Text style={[styles.emptyHint, { color: t.textTertiary }]}>
                                    {selectedRegion.id !== 'world' ? `Try switching to "All Countries" or a different region.` : 'Try a different spelling or brand name.'}
                                </Text>
                                {selectedRegion.id !== 'world' && (
                                    <TouchableOpacity
                                        style={[styles.switchWorldBtn, { borderColor: t.primary }]}
                                        onPress={() => { setSelectedRegion(REGIONS[0]); handleSearch(searchQuery); }}
                                    >
                                        <Text style={[styles.switchWorldText, { color: t.primary }]}>🌍 Search All Countries</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {searchResults.map((product, i) => (
                            <ProductRow key={`${product.barcode}-${i}`} product={product} onPress={() => handleSelectProduct(product)} />
                        ))}

                        {!loading && searchQuery.length < 2 && (
                            <>
                                <View style={styles.searchTip}>
                                    <MaterialCommunityIcons name="lightbulb-outline" size={20} color={t.textTertiary} />
                                    <Text style={[styles.searchTipText, { color: t.textTertiary }]}>
                                        Type at least 2 characters. Results filtered to {selectedRegion.flag} {selectedRegion.name}.
                                    </Text>
                                </View>
                                {/* Popular Search Suggestions */}
                                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.md }]}>
                                    {selectedRegion.flag} POPULAR IN {selectedRegion.name.toUpperCase()}
                                </Text>
                                <View style={styles.suggestGrid}>
                                    {selectedRegion.popularFoods.map((food, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={[styles.suggestChip, { backgroundColor: t.glass, borderColor: t.border }]}
                                            onPress={() => handleSearch(food)}
                                        >
                                            <Ionicons name="trending-up" size={14} color={t.primary} />
                                            <Text style={[styles.suggestText, { color: t.text }]}>{food}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </>
                )}

                {/* ═══ RESULT MODE ═════════════════════════════════════ */}
                {mode === 'result' && scannedProduct && (
                    <>
                        <View style={[styles.resultCard, { backgroundColor: t.card, borderColor: t.border }]}>
                            {scannedProduct.imageUrl ? (
                                <Image source={{ uri: scannedProduct.imageUrl }} style={styles.resultImage} />
                            ) : (
                                <Text style={styles.resultEmoji}>{getProductEmoji(scannedProduct)}</Text>
                            )}

                            <Text style={[styles.resultName, { color: t.text }]}>{scannedProduct.name}</Text>
                            {scannedProduct.brand ? <Text style={[styles.resultBrand, { color: t.textTertiary }]}>{scannedProduct.brand}</Text> : null}
                            <Text style={[styles.resultServing, { color: t.textSecondary }]}>Per serving: {scannedProduct.serving}</Text>

                            {/* Country of origin */}
                            {scannedProduct.countries && (
                                <Text style={[styles.countryOrigin, { color: t.textTertiary }]}>📍 {scannedProduct.countries}</Text>
                            )}

                            <NutriScoreBadge grade={scannedProduct.nutriScore} />

                            <View style={styles.nutritionGrid}>
                                <NutrientBox label="Carbs" value={`${Math.round(scannedProduct.carbs * servings)}g`} color="#0A85FF" highlight theme={t} />
                                <NutrientBox label="Calories" value={`${Math.round(scannedProduct.calories * servings)}`} color="#FF9800" theme={t} />
                                <NutrientBox label="Protein" value={`${Math.round(scannedProduct.protein * servings * 10) / 10}g`} color="#4CAF50" theme={t} />
                                <NutrientBox label="Fat" value={`${Math.round(scannedProduct.fat * servings * 10) / 10}g`} color="#FF5252" theme={t} />
                            </View>

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

                            <GlycemicImpact product={scannedProduct} />

                            {scannedProduct.ingredients && (
                                <View style={[styles.ingredientsBox, { backgroundColor: t.glass }]}>
                                    <Text style={[styles.ingredientsTitle, { color: t.textSecondary }]}>Ingredients</Text>
                                    <Text style={[styles.ingredientsText, { color: t.textTertiary }]} numberOfLines={4}>{scannedProduct.ingredients}</Text>
                                </View>
                            )}

                            {scannedProduct.allergens && scannedProduct.allergens.length > 0 && (
                                <View style={[styles.allergenBox, { backgroundColor: '#FFF3E0' }]}>
                                    <MaterialCommunityIcons name="alert-circle" size={16} color="#E65100" />
                                    <Text style={styles.allergenText}>Allergens: {scannedProduct.allergens}</Text>
                                </View>
                            )}

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

                            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: t.primary }]} onPress={handleConfirm}>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                <Text style={styles.confirmText}>Log {Math.round(scannedProduct.carbs * servings)}g Carbs</Text>
                            </TouchableOpacity>

                            {scannedProduct.barcode && <Text style={[styles.barcodeLabel, { color: t.textTertiary }]}>Barcode: {scannedProduct.barcode}</Text>}
                        </View>

                        <View style={[styles.sourceBox, { backgroundColor: t.glass }]}>
                            <MaterialCommunityIcons name="information" size={14} color={t.textTertiary} />
                            <Text style={[styles.sourceText, { color: t.textTertiary }]}>
                                Data from Open Food Facts (openfoodfacts.org). Values are community-contributed and may vary from actual labels.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* ═══ Country Selection Modal ═════════════════════════════ */}
            <Modal animationType="slide" transparent visible={countryModalVisible} onRequestClose={() => setCountryModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>🌍 Select Region</Text>
                            <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.modalSub, { color: t.textTertiary }]}>
                            Filter products by country to see items available near you
                        </Text>
                        <FlatList
                            data={REGIONS}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 400 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.countryRow,
                                        { backgroundColor: selectedRegion.id === item.id ? t.primary + '10' : 'transparent', borderColor: selectedRegion.id === item.id ? t.primary : t.border },
                                    ]}
                                    onPress={() => handleSelectCountry(item)}
                                >
                                    <Text style={{ fontSize: 28 }}>{item.flag}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.countryRowName, { color: t.text }]}>{item.name}</Text>
                                        <Text style={[styles.countryRowHint, { color: t.textTertiary }]}>
                                            {item.popularFoods.slice(0, 3).join(', ')}
                                        </Text>
                                    </View>
                                    {selectedRegion.id === item.id && (
                                        <Ionicons name="checkmark-circle" size={22} color={t.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ─── Sub-components ─────────────────────────────────────────────────
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
    // Country Bar
    countryBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.lg, padding: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm },
    countryBarLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    countryBarName: { fontSize: 15, fontWeight: '700' },
    countryChangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    countryChangeText: { fontSize: 12, fontWeight: '700' },
    // Mode
    modeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
    modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.lg, borderWidth: 1 },
    modeText: { fontSize: 14, fontWeight: '600' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.sm },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    refreshBtn: { fontSize: 13, fontWeight: '600' },
    // Scan Area
    scanArea: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', ...Shadow.light },
    scanTitle: { fontSize: 20, fontWeight: '700', marginTop: Spacing.md },
    scanHint: { fontSize: 14, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
    manualRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.lg, width: '100%' },
    barcodeInput: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600' },
    lookupBtn: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    apiInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    apiInfoText: { fontSize: 11 },
    // Popular Chips
    chipScroll: { gap: 8, paddingRight: Spacing.lg },
    popularChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
    popularChipText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    // Region Chips
    regionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
    regionChipText: { fontSize: 12, fontWeight: '600' },
    // Examples
    exampleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    exampleChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, width: (width - Spacing.lg * 2 - 8) / 2 },
    exampleName: { fontSize: 13, fontWeight: '600' },
    exampleCode: { fontSize: 10, marginTop: 1 },
    // Search
    searchInput: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: Spacing.sm },
    loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    loadingText: { fontSize: 14 },
    emptySearch: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyText: { fontSize: 15, fontWeight: '600' },
    emptyHint: { fontSize: 13, textAlign: 'center' },
    switchWorldBtn: { borderWidth: 1.5, borderRadius: BorderRadius.lg, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
    switchWorldText: { fontSize: 14, fontWeight: '700' },
    searchTip: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: Spacing.md },
    searchTipText: { flex: 1, fontSize: 13, lineHeight: 19 },
    suggestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    suggestChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1 },
    suggestText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    // Food Row
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
    resultServing: { fontSize: 13, marginTop: 4 },
    countryOrigin: { fontSize: 11, marginTop: 4, marginBottom: Spacing.md },
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
    // Country Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, borderWidth: 1, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    modalSub: { fontSize: 13, marginBottom: Spacing.lg },
    countryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: 6 },
    countryRowName: { fontSize: 15, fontWeight: '700' },
    countryRowHint: { fontSize: 11, marginTop: 1 },
});
