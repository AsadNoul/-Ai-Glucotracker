import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    Animated,
    Alert,
    Dimensions,
    Modal,
    FlatList,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, getThemeColors } from '../constants/Theme';
import { useSettingsStore, useLogsStore } from '../store';
// Use require safely to avoid crashing the whole app if native modules are missing (e.g. in Expo Go)
const SpeechRecognition = (() => {
    try {
        return require('expo-speech-recognition');
    } catch (e) {
        console.warn('Speech recognition module not found. Falling back to manual mode.');
        return null;
    }
})();

const ExpoSpeechRecognitionModule = SpeechRecognition?.ExpoSpeechRecognitionModule;
const useSpeechRecognitionEvent = SpeechRecognition?.useSpeechRecognitionEvent || ((event: string, callback: any) => {
    // No-op dummy hook to satisfy the Rules of Hooks when the native module is missing
});

const IS_SPEECH_AVAILABLE = !!ExpoSpeechRecognitionModule;




const { width } = Dimensions.get('window');

// ─── AI Food Database for parsing voice input ──────────────────────
const FOOD_DATABASE: Record<string, { emoji: string; portion: string; carbs: number; calories: number; glycemicIndex: string }> = {
    'rice': { emoji: '🍚', portion: '1 cup (cooked)', carbs: 45, calories: 206, glycemicIndex: 'high' },
    'white rice': { emoji: '🍚', portion: '1 cup (cooked)', carbs: 45, calories: 206, glycemicIndex: 'high' },
    'brown rice': { emoji: '🍚', portion: '1 cup (cooked)', carbs: 36, calories: 216, glycemicIndex: 'medium' },
    'chicken': { emoji: '🍗', portion: '1 piece (medium)', carbs: 0, calories: 165, glycemicIndex: 'low' },
    'chicken breast': { emoji: '🍗', portion: '1 piece (medium)', carbs: 0, calories: 165, glycemicIndex: 'low' },
    'bread': { emoji: '🍞', portion: '2 slices', carbs: 26, calories: 134, glycemicIndex: 'high' },
    'pasta': { emoji: '🍝', portion: '1 cup (cooked)', carbs: 43, calories: 220, glycemicIndex: 'medium' },
    'egg': { emoji: '🥚', portion: '2 large', carbs: 1, calories: 156, glycemicIndex: 'low' },
    'eggs': { emoji: '🥚', portion: '2 large', carbs: 1, calories: 156, glycemicIndex: 'low' },
    'milk': { emoji: '🥛', portion: '1 cup', carbs: 12, calories: 149, glycemicIndex: 'medium' },
    'banana': { emoji: '🍌', portion: '1 medium', carbs: 27, calories: 105, glycemicIndex: 'medium' },
    'apple': { emoji: '🍎', portion: '1 medium', carbs: 25, calories: 95, glycemicIndex: 'low' },
    'orange': { emoji: '🍊', portion: '1 medium', carbs: 15, calories: 62, glycemicIndex: 'low' },
    'oatmeal': { emoji: '🥣', portion: '1 cup (cooked)', carbs: 28, calories: 158, glycemicIndex: 'medium' },
    'potato': { emoji: '🥔', portion: '1 medium', carbs: 37, calories: 163, glycemicIndex: 'high' },
    'sweet potato': { emoji: '🍠', portion: '1 medium', carbs: 24, calories: 103, glycemicIndex: 'medium' },
    'salmon': { emoji: '🐟', portion: '1 fillet', carbs: 0, calories: 208, glycemicIndex: 'low' },
    'steak': { emoji: '🥩', portion: '6 oz', carbs: 0, calories: 276, glycemicIndex: 'low' },
    'beef': { emoji: '🥩', portion: '6 oz', carbs: 0, calories: 276, glycemicIndex: 'low' },
    'salad': { emoji: '🥗', portion: '1 bowl', carbs: 8, calories: 65, glycemicIndex: 'low' },
    'pizza': { emoji: '🍕', portion: '2 slices', carbs: 52, calories: 570, glycemicIndex: 'high' },
    'burger': { emoji: '🍔', portion: '1 burger', carbs: 40, calories: 540, glycemicIndex: 'high' },
    'sandwich': { emoji: '🥪', portion: '1 sandwich', carbs: 34, calories: 350, glycemicIndex: 'medium' },
    'yogurt': { emoji: '🫙', portion: '1 cup', carbs: 17, calories: 150, glycemicIndex: 'low' },
    'cereal': { emoji: '🥣', portion: '1 cup', carbs: 36, calories: 190, glycemicIndex: 'high' },
    'juice': { emoji: '🧃', portion: '1 cup', carbs: 26, calories: 112, glycemicIndex: 'high' },
    'orange juice': { emoji: '🧃', portion: '1 cup', carbs: 26, calories: 112, glycemicIndex: 'high' },
    'coffee': { emoji: '☕', portion: '1 cup', carbs: 0, calories: 5, glycemicIndex: 'low' },
    'tea': { emoji: '🍵', portion: '1 cup', carbs: 0, calories: 2, glycemicIndex: 'low' },
    'noodles': { emoji: '🍜', portion: '1 cup (cooked)', carbs: 40, calories: 221, glycemicIndex: 'medium' },
    'soup': { emoji: '🍲', portion: '1 bowl', carbs: 15, calories: 120, glycemicIndex: 'low' },
    'beans': { emoji: '🫘', portion: '1 cup', carbs: 40, calories: 225, glycemicIndex: 'low' },
    'lentils': { emoji: '🫘', portion: '1 cup', carbs: 40, calories: 230, glycemicIndex: 'low' },
    'cheese': { emoji: '🧀', portion: '2 oz', carbs: 1, calories: 220, glycemicIndex: 'low' },
    'nuts': { emoji: '🥜', portion: '1 handful', carbs: 6, calories: 170, glycemicIndex: 'low' },
    'toast': { emoji: '🍞', portion: '2 slices', carbs: 26, calories: 134, glycemicIndex: 'high' },
    'roti': { emoji: '🫓', portion: '2 pieces', carbs: 30, calories: 200, glycemicIndex: 'medium' },
    'chapati': { emoji: '🫓', portion: '2 pieces', carbs: 30, calories: 200, glycemicIndex: 'medium' },
    'naan': { emoji: '🫓', portion: '1 piece', carbs: 42, calories: 262, glycemicIndex: 'high' },
    'paratha': { emoji: '🫓', portion: '1 piece', carbs: 32, calories: 260, glycemicIndex: 'medium' },
    'dal': { emoji: '🍲', portion: '1 cup', carbs: 20, calories: 170, glycemicIndex: 'low' },
    'biryani': { emoji: '🍚', portion: '1 plate', carbs: 65, calories: 490, glycemicIndex: 'high' },
    'curry': { emoji: '🍛', portion: '1 cup', carbs: 15, calories: 230, glycemicIndex: 'medium' },
    'fish': { emoji: '🐟', portion: '1 fillet', carbs: 0, calories: 180, glycemicIndex: 'low' },
    'shrimp': { emoji: '🦐', portion: '6 pieces', carbs: 1, calories: 84, glycemicIndex: 'low' },
    'corn': { emoji: '🌽', portion: '1 ear', carbs: 19, calories: 90, glycemicIndex: 'medium' },
    'fruit': { emoji: '🍇', portion: '1 cup mixed', carbs: 20, calories: 80, glycemicIndex: 'medium' },
    'ice cream': { emoji: '🍦', portion: '1 scoop', carbs: 17, calories: 137, glycemicIndex: 'high' },
    'cake': { emoji: '🍰', portion: '1 slice', carbs: 35, calories: 260, glycemicIndex: 'high' },
    'cookie': { emoji: '🍪', portion: '2 cookies', carbs: 22, calories: 150, glycemicIndex: 'high' },
    'chocolate': { emoji: '🍫', portion: '1 bar small', carbs: 26, calories: 235, glycemicIndex: 'medium' },
    'soda': { emoji: '🥤', portion: '1 can', carbs: 39, calories: 140, glycemicIndex: 'high' },
    'water': { emoji: '💧', portion: '1 glass', carbs: 0, calories: 0, glycemicIndex: 'low' },
    'smoothie': { emoji: '🥤', portion: '1 cup', carbs: 38, calories: 260, glycemicIndex: 'medium' },
    'wrap': { emoji: '🌯', portion: '1 wrap', carbs: 28, calories: 300, glycemicIndex: 'medium' },
    'taco': { emoji: '🌮', portion: '2 tacos', carbs: 24, calories: 340, glycemicIndex: 'medium' },
    'fries': { emoji: '🍟', portion: '1 serving', carbs: 44, calories: 365, glycemicIndex: 'high' },
    'pancake': { emoji: '🥞', portion: '2 pancakes', carbs: 44, calories: 350, glycemicIndex: 'high' },
    'pancakes': { emoji: '🥞', portion: '2 pancakes', carbs: 44, calories: 350, glycemicIndex: 'high' },
    'waffle': { emoji: '🧇', portion: '1 waffle', carbs: 25, calories: 218, glycemicIndex: 'high' },
    'mango': { emoji: '🥭', portion: '1 medium', carbs: 25, calories: 99, glycemicIndex: 'medium' },
    'dates': { emoji: '🌴', portion: '3 pieces', carbs: 54, calories: 200, glycemicIndex: 'high' },
    'hummus': { emoji: '🫘', portion: '1/4 cup', carbs: 9, calories: 104, glycemicIndex: 'low' },
    'kebab': { emoji: '🍢', portion: '2 skewers', carbs: 4, calories: 280, glycemicIndex: 'low' },
    'shawarma': { emoji: '🌯', portion: '1 wrap', carbs: 38, calories: 450, glycemicIndex: 'medium' },
    'falafel': { emoji: '🧆', portion: '4 pieces', carbs: 28, calories: 340, glycemicIndex: 'medium' },
    'pita': { emoji: '🫓', portion: '1 piece', carbs: 33, calories: 165, glycemicIndex: 'medium' },
};

// Parse meal text into food items with quantities
function parseMealText(text: string): { name: string; emoji: string; portion: string; carbs: number; calories: number; glycemicIndex: string; quantity: number }[] {
    const lower = text.toLowerCase().replace(/[,;.!?]/g, ' ');
    const items: { name: string; emoji: string; portion: string; carbs: number; calories: number; glycemicIndex: string; quantity: number }[] = [];
    const matched = new Set<string>();

    // Sort keys by length (longest first) to match multi-word items first
    const sortedKeys = Object.keys(FOOD_DATABASE).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
        if (lower.includes(key) && !matched.has(key)) {
            // Extract quantity (look for numbers before the food item)
            const regex = new RegExp(`(\\d+)?\\s*(?:cups?|pieces?|slices?|bowls?|plates?|servings?|fillets?)?\\s*(?:of\\s+)?${key}`, 'i');
            const qMatch = lower.match(regex);
            const quantity = qMatch && qMatch[1] ? parseInt(qMatch[1]) : 1;

            const food = FOOD_DATABASE[key];
            items.push({
                name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                emoji: food.emoji,
                portion: quantity > 1 ? `${quantity}x ${food.portion}` : food.portion,
                carbs: Math.round(food.carbs * quantity),
                calories: Math.round(food.calories * quantity),
                glycemicIndex: food.glycemicIndex,
                quantity,
            });
            matched.add(key);
            // Mark individual words as matched to avoid duplicates
            key.split(' ').forEach(word => matched.add(word));
        }
    }

    // If nothing matched, create a generic entry
    if (items.length === 0 && text.trim().length > 0) {
        items.push({
            name: text.trim().substring(0, 40),
            emoji: '🍽️',
            portion: '1 serving',
            carbs: 25,
            calories: 200,
            glycemicIndex: 'medium',
            quantity: 1,
        });
    }

    return items;
}

function getGlycemicLoad(items: { carbs: number; glycemicIndex: string }[]): { label: string; color: string; emoji: string } {
    const totalCarbs = items.reduce((s, i) => s + i.carbs, 0);
    const hasHigh = items.some(i => i.glycemicIndex === 'high');
    if (totalCarbs > 50 || (hasHigh && totalCarbs > 30)) return { label: 'High', color: '#FF5252', emoji: '🔴' };
    if (totalCarbs > 25) return { label: 'Moderate', color: '#FFC107', emoji: '🟡' };
    return { label: 'Low', color: '#4CAF50', emoji: '🟢' };
}

// Recent suggestions
const QUICK_SUGGESTIONS = [
    '"Oatmeal and berries"',
    '"Grilled salmon salad"',
    '"2 eggs and toast"',
    '"Rice and curry"',
    '"Chicken sandwich"',
    '"Roti and dal"',
    '"Biryani"',
];

interface VoiceLogEntry {
    id: string;
    text: string;
    items: { name: string; emoji: string; portion: string; carbs: number; calories: number; glycemicIndex: string; quantity: number }[];
    totalCarbs: number;
    timestamp: string;
}

export const VoiceLogScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useSettingsStore();
    const { addCarbLog } = useLogsStore();
    const t = getThemeColors(theme);

    const [inputMode, setInputMode] = useState<'idle' | 'listening' | 'typing' | 'parsed'>('idle');
    const [inputText, setInputText] = useState('');
    const [interimText, setInterimText] = useState('');
    const [parsedItems, setParsedItems] = useState<ReturnType<typeof parseMealText>>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [voiceLogs, setVoiceLogs] = useState<VoiceLogEntry[]>([]);
    const [textInputValue, setTextInputValue] = useState('');
    const [speechAvailable, setSpeechAvailable] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Mic animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, []);

    // ─── Speech Recognition Event Handlers ──────────────────────────
    // Wrap hooks or use them safely
    const handleStart = useCallback(() => {
        setInputMode('listening');
        setErrorMsg(null);
    }, []);

    const handleEnd = useCallback(() => {
        pulseAnim.stopAnimation();
        waveAnim.stopAnimation();
        pulseAnim.setValue(1);
        waveAnim.setValue(0);

        if (inputText.trim().length > 0) {
            const items = parseMealText(inputText);
            setParsedItems(items);
            setInputMode('parsed');
        } else if (interimText.trim().length > 0) {
            setInputText(interimText);
            const items = parseMealText(interimText);
            setParsedItems(items);
            setInputMode('parsed');
        } else {
            setInputMode('typing');
        }
        setInterimText('');
    }, [inputText, interimText]);

    const handleResult = useCallback((event: any) => {
        const transcript = event.results[0]?.transcript || '';
        if (event.isFinal) {
            setInputText(prev => {
                const combined = prev ? `${prev} ${transcript}` : transcript;
                return combined.trim();
            });
            setInterimText('');
        } else {
            setInterimText(transcript);
        }
    }, []);

    const handleError = useCallback((event: any) => {
        console.log('Speech recognition error:', event.error, event.message);
        pulseAnim.stopAnimation();
        waveAnim.stopAnimation();
        pulseAnim.setValue(1);
        waveAnim.setValue(0);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setErrorMsg('Microphone permission denied. Please enable in Settings.');
            setSpeechAvailable(false);
            setInputMode('typing');
        } else {
            setErrorMsg(`Speech error: ${event.message || event.error}. Try typing instead.`);
            setInputMode('typing');
        }
    }, []);

    // Register hooks (always called to satisfy Rules of Hooks)
    useSpeechRecognitionEvent('start', handleStart);
    useSpeechRecognitionEvent('end', handleEnd);
    useSpeechRecognitionEvent('result', handleResult);
    useSpeechRecognitionEvent('error', handleError);



    // ─── Start Listening ────────────────────────────────────────────
    const startListening = useCallback(async () => {
        if (!IS_SPEECH_AVAILABLE || !ExpoSpeechRecognitionModule) {
            setErrorMsg('Speech recognition requires a Development Build. Please use typing mode.');
            setInputMode('typing');
            return;
        }

        setInputText('');
        setInterimText('');
        setParsedItems([]);
        setErrorMsg(null);
        setInputMode('listening');


        // Pulse animation for mic
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();

        // Wave animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(waveAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(waveAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        try {
            // Request permissions first
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                setSpeechAvailable(false);
                setErrorMsg('Microphone permission required. Please enable in Settings.');
                setInputMode('typing');
                pulseAnim.stopAnimation();
                waveAnim.stopAnimation();
                pulseAnim.setValue(1);
                waveAnim.setValue(0);
                return;
            }

            // Start speech recognition
            ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                continuous: false, // Stop after one phrase
            });

            // Set a timeout: if no results within 6 seconds, go to manual typing
            setTimeout(() => {
                setInputMode(prev => (prev === 'listening' ? 'typing' : prev));
            }, 6000);

        } catch (error: any) {
            console.error('Failed to start speech recognition:', error);
            setSpeechAvailable(false);
            setErrorMsg('Speech recognition not available on this device. Use typing instead.');
            setInputMode('typing');
            pulseAnim.stopAnimation();
            waveAnim.stopAnimation();
            pulseAnim.setValue(1);
            waveAnim.setValue(0);
        }
    }, []);

    // ─── Stop Listening ─────────────────────────────────────────────
    const stopListening = useCallback(() => {
        try {
            ExpoSpeechRecognitionModule.stop();
        } catch { }
    }, []);

    const handleTextSubmit = useCallback(() => {
        const text = textInputValue.trim();
        if (!text) return;

        setInputText(text);
        const items = parseMealText(text);
        setParsedItems(items);
        setInputMode('parsed');
    }, [textInputValue]);

    const handleSuggestionPress = useCallback((suggestion: string) => {
        const cleanText = suggestion.replace(/"/g, '');
        setTextInputValue(cleanText);
        setInputText(cleanText);
        const items = parseMealText(cleanText);
        setParsedItems(items);
        setInputMode('parsed');
    }, []);

    const handleConfirm = useCallback(() => {
        if (parsedItems.length === 0) return;

        const totalCarbs = parsedItems.reduce((s, i) => s + i.carbs, 0);
        const foodName = parsedItems.map(i => i.name).join(', ');

        // Save to carb logs store
        addCarbLog({
            id: Date.now().toString(),
            user_id: 'local',
            food_name: foodName,
            estimated_carbs: totalCarbs,
            photo_url: undefined,
            created_at: new Date().toISOString(),
        });

        // Save to voice log history
        const entry: VoiceLogEntry = {
            id: Date.now().toString(),
            text: inputText,
            items: parsedItems,
            totalCarbs,
            timestamp: new Date().toISOString(),
        };
        setVoiceLogs(prev => [entry, ...prev]);

        Alert.alert('✅ Logged!', `${foodName}\n${totalCarbs}g carbs added to your log.`, [
            { text: 'OK', onPress: () => resetState() }
        ]);
    }, [parsedItems, inputText, addCarbLog]);

    const resetState = () => {
        setInputMode('idle');
        setInputText('');
        setInterimText('');
        setParsedItems([]);
        setTextInputValue('');
        setErrorMsg(null);
    };

    const totalCarbs = useMemo(() => parsedItems.reduce((s, i) => s + i.carbs, 0), [parsedItems]);
    const glycemicLoad = useMemo(() => getGlycemicLoad(parsedItems), [parsedItems]);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Combined text display (final + interim)
    const displayText = interimText ? `${inputText} ${interimText}`.trim() : inputText;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={28} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Voice Log</Text>
                <TouchableOpacity onPress={() => setShowHistory(true)}>
                    <Text style={[styles.historyLink, { color: t.primary }]}>History</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Error Message */}
                {errorMsg && (
                    <View style={[styles.errorCard, { backgroundColor: '#FFF3E0', borderColor: '#FFB74D' }]}>
                        <Ionicons name="warning" size={18} color="#E65100" />
                        <Text style={styles.errorText}>{errorMsg}</Text>
                        <TouchableOpacity onPress={() => setErrorMsg(null)}>
                            <Ionicons name="close" size={18} color="#E65100" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Conversation View */}
                {displayText.length > 0 && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {/* Timestamp */}
                        <Text style={[styles.timestamp, { color: t.textTertiary }]}>
                            TODAY, {timeStr.toUpperCase()}
                        </Text>

                        {/* User Message Bubble */}
                        <View style={styles.userBubbleContainer}>
                            <View style={[styles.userBubble, { backgroundColor: t.primary }]}>
                                <Ionicons name="mic" size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                                <Text style={styles.userBubbleText}>
                                    {displayText.charAt(0).toUpperCase() + displayText.slice(1)}
                                </Text>
                            </View>
                            <Text style={[styles.senderLabel, { color: t.textTertiary }]}>
                                {inputMode === 'listening' ? '🎤 Listening...' : 'You'}
                            </Text>
                        </View>

                        {/* Interim indicator */}
                        {inputMode === 'listening' && interimText && (
                            <View style={[styles.interimCard, { backgroundColor: t.glass }]}>
                                <ActivityIndicatorDots color={t.primary} />
                                <Text style={[styles.interimText, { color: t.textSecondary }]}>
                                    Hearing: "{interimText}"
                                </Text>
                            </View>
                        )}

                        {/* AI Response */}
                        {inputMode === 'parsed' && (
                            <View style={styles.aiSection}>
                                <View style={styles.aiLabel}>
                                    <View style={[styles.aiDot, { backgroundColor: t.primary }]}>
                                        <MaterialCommunityIcons name="star-four-points" size={12} color="#FFF" />
                                    </View>
                                    <Text style={[styles.aiLabelText, { color: t.primary }]}>AI Assistant</Text>
                                </View>

                                {/* Parsed Meal Card */}
                                <View style={[styles.parsedCard, { backgroundColor: t.card, borderColor: t.border }]}>
                                    <View style={styles.parsedHeader}>
                                        <Text style={[styles.parsedTitle, { color: t.textSecondary }]}>PARSED MEAL</Text>
                                        <View style={[styles.carbsBadge, { backgroundColor: '#E8F5E9' }]}>
                                            <Text style={styles.carbsBadgeText}>{totalCarbs}g Net Carbs</Text>
                                        </View>
                                    </View>

                                    {/* Food Items */}
                                    {parsedItems.map((item, index) => (
                                        <View key={index} style={[styles.foodItem, index < parsedItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
                                            <Text style={styles.foodEmoji}>{item.emoji}</Text>
                                            <View style={styles.foodInfo}>
                                                <Text style={[styles.foodName, { color: t.text }]}>{item.name}</Text>
                                                <Text style={[styles.foodPortion, { color: t.textTertiary }]}>{item.portion}</Text>
                                            </View>
                                            <View style={styles.carbsCol}>
                                                <Text style={[styles.carbsValue, { color: t.text }]}>{item.carbs}g</Text>
                                                <Text style={[styles.carbsLabel, { color: t.textTertiary }]}>CARBS</Text>
                                            </View>
                                        </View>
                                    ))}

                                    {/* Glycemic Load */}
                                    <View style={[styles.glycemicRow, { borderTopWidth: 1, borderTopColor: t.border }]}>
                                        <View>
                                            <Text style={[styles.glycemicLabel, { color: t.textSecondary }]}>Glycemic Load</Text>
                                            <View style={styles.glycemicStatus}>
                                                <Text style={styles.glycemicDot}>{glycemicLoad.emoji}</Text>
                                                <Text style={{ color: glycemicLoad.color, fontWeight: '600', fontSize: 14 }}>{glycemicLoad.label}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.totalCarbs}>
                                            <Text style={[styles.totalCarbsNum, { color: t.primary }]}>{totalCarbs}</Text>
                                            <Text style={[styles.totalCarbsUnit, { color: t.textTertiary }]}>g</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={[styles.editBtn, { backgroundColor: t.card, borderColor: t.border }]} onPress={resetState}>
                                        <MaterialCommunityIcons name="pencil" size={18} color={t.text} />
                                        <Text style={[styles.editBtnText, { color: t.text }]}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: t.primary }]} onPress={handleConfirm}>
                                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                        <Text style={styles.confirmBtnText}>Confirm Log</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Typing input mode */}
                {inputMode === 'typing' && (
                    <View style={[styles.typingCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Text style={[styles.typingTitle, { color: t.textSecondary }]}>
                            ✏️ Type your meal
                        </Text>
                        <Text style={[styles.typingHint, { color: t.textTertiary }]}>
                            {!speechAvailable ? 'Speech recognition not available. Type your meal below:' : 'Describe what you ate:'}
                        </Text>
                        <TextInput
                            style={[styles.typingInput, { color: t.text, borderColor: t.border }]}
                            placeholder="e.g. 1 cup rice, 1 chicken piece, dal"
                            placeholderTextColor={t.textTertiary}
                            value={textInputValue}
                            onChangeText={setTextInputValue}
                            onSubmitEditing={handleTextSubmit}
                            autoFocus
                            multiline
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: t.primary, opacity: textInputValue.trim() ? 1 : 0.5 }]}
                            onPress={handleTextSubmit}
                            disabled={!textInputValue.trim()}
                        >
                            <Text style={styles.submitBtnText}>Parse Meal →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Listening indicator */}
                {inputMode === 'listening' && !displayText && (
                    <View style={styles.listeningContainer}>
                        <Animated.View style={[styles.listeningWave, { transform: [{ scale: pulseAnim }], backgroundColor: t.primary + '15' }]} />
                        <Animated.View style={[styles.listeningWave2, { transform: [{ scale: pulseAnim }], backgroundColor: t.primary + '10' }]} />
                        <View style={[styles.listeningDot, { backgroundColor: t.primary }]}>
                            <Ionicons name="mic" size={36} color="#FFF" />
                        </View>
                        <Text style={[styles.listeningText, { color: t.primary }]}>Listening...</Text>
                        <Text style={[styles.listeningHint, { color: t.textTertiary }]}>
                            Say your meal clearly{'\n'}e.g. "I had 2 eggs and toast with coffee"
                        </Text>
                        <TouchableOpacity
                            style={[styles.stopBtn, { backgroundColor: '#FF5252' }]}
                            onPress={stopListening}
                        >
                            <Ionicons name="stop" size={20} color="#FFF" />
                            <Text style={styles.stopBtnText}>Stop & Process</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Bar */}
            <View style={[styles.bottomBar, { backgroundColor: t.card, borderTopColor: t.border }]}>
                {/* Quick Suggestions */}
                {(inputMode === 'idle' || inputMode === 'typing') && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
                        {QUICK_SUGGESTIONS.map((s, i) => (
                            <TouchableOpacity key={i} style={[styles.suggestionChip, { backgroundColor: t.glass, borderColor: t.border }]} onPress={() => handleSuggestionPress(s)}>
                                <Text style={[styles.suggestionText, { color: t.textSecondary }]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Input Controls */}
                <View style={styles.inputControls}>
                    <TouchableOpacity
                        style={[styles.sideBtn, { backgroundColor: t.glass }]}
                        onPress={() => {
                            setInputMode('typing');
                            setInputText('');
                            setParsedItems([]);
                            setErrorMsg(null);
                        }}
                    >
                        <Ionicons name="keypad" size={22} color={t.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.micButton, { backgroundColor: inputMode === 'listening' ? '#FF5252' : t.primary }]}
                        onPress={inputMode === 'listening' ? stopListening : startListening}
                        activeOpacity={0.7}
                    >
                        <Animated.View style={{ transform: [{ scale: inputMode === 'listening' ? pulseAnim : new Animated.Value(1) }] }}>
                            <Ionicons name={inputMode === 'listening' ? 'stop' : 'mic'} size={32} color="#FFF" />
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sideBtn, { backgroundColor: t.glass }]}
                        onPress={() => navigation.navigate('ScanMeal')}
                    >
                        <Ionicons name="camera" size={22} color={t.textSecondary} />
                    </TouchableOpacity>
                </View>

                {inputMode === 'idle' && (
                    <Text style={[styles.tapHint, { color: t.textTertiary }]}>Tap mic to speak or keyboard to type</Text>
                )}
            </View>

            {/* History Modal */}
            <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: t.text }]}>Voice Log History</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                            <Ionicons name="close-circle" size={28} color={t.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    {voiceLogs.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="microphone-off" size={64} color={t.textTertiary} />
                            <Text style={[styles.emptyTitle, { color: t.textSecondary }]}>No voice logs yet</Text>
                            <Text style={[styles.emptySubtitle, { color: t.textTertiary }]}>Your voice-logged meals will appear here</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={voiceLogs}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ padding: Spacing.md }}
                            renderItem={({ item }) => (
                                <View style={[styles.historyCard, { backgroundColor: t.card, borderColor: t.border }]}>
                                    <Text style={[styles.historyTime, { color: t.textTertiary }]}>
                                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <Text style={[styles.historyText, { color: t.text }]}>"{item.text}"</Text>
                                    <View style={styles.historyItems}>
                                        {item.items.map((food, i) => (
                                            <Text key={i} style={[styles.historyItem, { color: t.textSecondary }]}>
                                                {food.emoji} {food.name} — {food.carbs}g
                                            </Text>
                                        ))}
                                    </View>
                                    <Text style={[styles.historyTotal, { color: t.primary }]}>Total: {item.totalCarbs}g carbs</Text>
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

// Simple animated dots for interim display
const ActivityIndicatorDots = ({ color }: { color: string }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={{ opacity: anim }}>
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={color} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    historyLink: { fontSize: 15, fontWeight: '600' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 200 },
    // Error
    errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.md },
    errorText: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 18 },
    // Conversation
    timestamp: { textAlign: 'center', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: Spacing.md },
    userBubbleContainer: { alignItems: 'flex-end', marginBottom: Spacing.lg },
    userBubble: { borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 20, paddingVertical: 14, maxWidth: '85%', flexDirection: 'row', alignItems: 'flex-start' },
    userBubbleText: { color: '#FFF', fontSize: 16, fontWeight: '500', lineHeight: 22, flex: 1 },
    senderLabel: { fontSize: 11, fontWeight: '500', marginTop: 4, marginRight: 4 },
    interimCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
    interimText: { fontSize: 13, fontStyle: 'italic' },
    aiSection: { marginTop: Spacing.sm },
    aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
    aiDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    aiLabelText: { fontSize: 14, fontWeight: '600' },
    parsedCard: { borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden' },
    parsedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: Spacing.sm },
    parsedTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    carbsBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
    carbsBadgeText: { color: '#4CAF50', fontSize: 13, fontWeight: '700' },
    foodItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
    foodEmoji: { fontSize: 32 },
    foodInfo: { flex: 1 },
    foodName: { fontSize: 16, fontWeight: '600' },
    foodPortion: { fontSize: 13, marginTop: 2 },
    carbsCol: { alignItems: 'flex-end' },
    carbsValue: { fontSize: 18, fontWeight: '700' },
    carbsLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
    glycemicRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
    glycemicLabel: { fontSize: 13, fontWeight: '500' },
    glycemicStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    glycemicDot: { fontSize: 12 },
    totalCarbs: { flexDirection: 'row', alignItems: 'baseline' },
    totalCarbsNum: { fontSize: 36, fontWeight: '700' },
    totalCarbsUnit: { fontSize: 18, fontWeight: '500', marginLeft: 2 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: Spacing.lg },
    editBtn: {
        flex: 0.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: BorderRadius.xl, paddingVertical: 14, borderWidth: 1,
    },
    editBtnText: { fontSize: 15, fontWeight: '600' },
    confirmBtn: {
        flex: 0.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: BorderRadius.xl, paddingVertical: 14,
    },
    confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    typingCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, marginTop: Spacing.xl },
    typingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    typingHint: { fontSize: 13, marginBottom: Spacing.md },
    typingInput: {
        borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md,
        fontSize: 16, minHeight: 60, textAlignVertical: 'top',
    },
    submitBtn: { borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.md },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    listeningContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    listeningWave: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
    listeningWave2: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
    listeningDot: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    listeningText: { fontSize: 20, fontWeight: '700', marginTop: Spacing.lg },
    listeningHint: { fontSize: 14, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 20 },
    stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.xl, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.xl },
    stopBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, paddingTop: Spacing.sm, borderTopWidth: 1 },
    suggestionsRow: { paddingHorizontal: Spacing.md, gap: 8, paddingBottom: Spacing.sm },
    suggestionChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
    suggestionText: { fontSize: 13 },
    inputControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: Spacing.sm },
    sideBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    micButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#0A85FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    tapHint: { textAlign: 'center', fontSize: 13, marginTop: 4, paddingBottom: 4 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600' },
    emptySubtitle: { fontSize: 14 },
    historyCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
    historyTime: { fontSize: 11, fontWeight: '600' },
    historyText: { fontSize: 15, fontWeight: '600', marginTop: 4, fontStyle: 'italic' },
    historyItems: { marginTop: 8, gap: 4 },
    historyItem: { fontSize: 13 },
    historyTotal: { fontSize: 14, fontWeight: '700', marginTop: 8 },
});
