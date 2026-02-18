import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    TextInput,
    ScrollView,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Shadow, BorderRadius } from '../constants/Theme';
import { useLogsStore, useSettingsStore } from '../store';

const { width, height } = Dimensions.get('window');

// ─── Food Database for user-assisted recognition ─────────────────
const FOOD_DATABASE: Record<string, { emoji: string; portion: string; carbs: number; calories: number; glycemicIndex: string }> = {
    'rice': { emoji: '🍚', portion: '1 cup', carbs: 45, calories: 206, glycemicIndex: 'high' },
    'white rice': { emoji: '🍚', portion: '1 cup', carbs: 45, calories: 206, glycemicIndex: 'high' },
    'brown rice': { emoji: '🍚', portion: '1 cup', carbs: 36, calories: 216, glycemicIndex: 'medium' },
    'chicken': { emoji: '🍗', portion: '1 piece', carbs: 0, calories: 165, glycemicIndex: 'low' },
    'bread': { emoji: '🍞', portion: '2 slices', carbs: 26, calories: 134, glycemicIndex: 'high' },
    'pasta': { emoji: '🍝', portion: '1 cup', carbs: 43, calories: 220, glycemicIndex: 'medium' },
    'eggs': { emoji: '🥚', portion: '2 large', carbs: 1, calories: 156, glycemicIndex: 'low' },
    'salad': { emoji: '🥗', portion: '1 bowl', carbs: 8, calories: 65, glycemicIndex: 'low' },
    'pizza': { emoji: '🍕', portion: '2 slices', carbs: 52, calories: 570, glycemicIndex: 'high' },
    'burger': { emoji: '🍔', portion: '1 burger', carbs: 40, calories: 540, glycemicIndex: 'high' },
    'sandwich': { emoji: '🥪', portion: '1 sandwich', carbs: 34, calories: 350, glycemicIndex: 'medium' },
    'oatmeal': { emoji: '🥣', portion: '1 bowl', carbs: 28, calories: 158, glycemicIndex: 'medium' },
    'banana': { emoji: '🍌', portion: '1 medium', carbs: 27, calories: 105, glycemicIndex: 'medium' },
    'apple': { emoji: '🍎', portion: '1 medium', carbs: 25, calories: 95, glycemicIndex: 'low' },
    'biryani': { emoji: '🍚', portion: '1 plate', carbs: 65, calories: 490, glycemicIndex: 'high' },
    'roti': { emoji: '🫓', portion: '2 pieces', carbs: 30, calories: 200, glycemicIndex: 'medium' },
    'dal': { emoji: '🍲', portion: '1 cup', carbs: 20, calories: 170, glycemicIndex: 'low' },
    'curry': { emoji: '🍛', portion: '1 cup', carbs: 15, calories: 230, glycemicIndex: 'medium' },
    'naan': { emoji: '🫓', portion: '1 piece', carbs: 42, calories: 262, glycemicIndex: 'high' },
    'shawarma': { emoji: '🌯', portion: '1 wrap', carbs: 38, calories: 450, glycemicIndex: 'medium' },
    'falafel': { emoji: '🧆', portion: '4 pieces', carbs: 28, calories: 340, glycemicIndex: 'medium' },
    'dates': { emoji: '🌴', portion: '3 pieces', carbs: 54, calories: 200, glycemicIndex: 'high' },
    'hummus': { emoji: '🫘', portion: '1/4 cup', carbs: 9, calories: 104, glycemicIndex: 'low' },
    'steak': { emoji: '🥩', portion: '6 oz', carbs: 0, calories: 276, glycemicIndex: 'low' },
    'salmon': { emoji: '🐟', portion: '1 fillet', carbs: 0, calories: 208, glycemicIndex: 'low' },
    'yogurt': { emoji: '🫙', portion: '1 cup', carbs: 17, calories: 150, glycemicIndex: 'low' },
    'smoothie': { emoji: '🥤', portion: '1 cup', carbs: 38, calories: 260, glycemicIndex: 'medium' },
    'fries': { emoji: '🍟', portion: '1 serving', carbs: 44, calories: 365, glycemicIndex: 'high' },
    'cake': { emoji: '🍰', portion: '1 slice', carbs: 35, calories: 260, glycemicIndex: 'high' },
    'ice cream': { emoji: '🍦', portion: '1 scoop', carbs: 17, calories: 137, glycemicIndex: 'high' },
    'juice': { emoji: '🧃', portion: '1 cup', carbs: 26, calories: 112, glycemicIndex: 'high' },
    'coffee': { emoji: '☕', portion: '1 cup', carbs: 0, calories: 5, glycemicIndex: 'low' },
    'tea': { emoji: '🍵', portion: '1 cup', carbs: 0, calories: 2, glycemicIndex: 'low' },
    'milk': { emoji: '🥛', portion: '1 cup', carbs: 12, calories: 149, glycemicIndex: 'medium' },
    'cereal': { emoji: '🥣', portion: '1 cup', carbs: 36, calories: 190, glycemicIndex: 'high' },
    'potato': { emoji: '🥔', portion: '1 medium', carbs: 37, calories: 163, glycemicIndex: 'high' },
    'soup': { emoji: '🍲', portion: '1 bowl', carbs: 15, calories: 120, glycemicIndex: 'low' },
    'wrap': { emoji: '🌯', portion: '1 wrap', carbs: 28, calories: 300, glycemicIndex: 'medium' },
    'pancakes': { emoji: '🥞', portion: '2 pancakes', carbs: 44, calories: 350, glycemicIndex: 'high' },
};

// Quick food entries for faster logging
const QUICK_FOODS = [
    { name: 'Rice', emoji: '🍚', carbs: 45 },
    { name: 'Roti', emoji: '🫓', carbs: 30 },
    { name: 'Chicken', emoji: '🍗', carbs: 0 },
    { name: 'Dal', emoji: '🍲', carbs: 20 },
    { name: 'Biryani', emoji: '🍚', carbs: 65 },
    { name: 'Salad', emoji: '🥗', carbs: 8 },
    { name: 'Bread', emoji: '🍞', carbs: 26 },
    { name: 'Eggs', emoji: '🥚', carbs: 1 },
    { name: 'Banana', emoji: '🍌', carbs: 27 },
    { name: 'Yogurt', emoji: '🫙', carbs: 17 },
];

function parseFoodText(text: string): { name: string; emoji: string; carbs: number; calories: number } {
    const lower = text.toLowerCase().trim();
    const sortedKeys = Object.keys(FOOD_DATABASE).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (lower.includes(key)) {
            const food = FOOD_DATABASE[key];
            return {
                name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                emoji: food.emoji,
                carbs: food.carbs,
                calories: food.calories,
            };
        }
    }
    return { name: text.trim(), emoji: '🍽️', carbs: 25, calories: 200 };
}

type ScreenMode = 'camera' | 'review' | 'manual';

export const ScanMealScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { carbLogs, addCarbLog } = useLogsStore();
    const { theme } = useSettingsStore();
    const [permission, requestPermission] = useCameraPermissions();
    const [flash, setFlash] = useState<'off' | 'on'>('off');
    const [screenMode, setScreenMode] = useState<ScreenMode>('camera');
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [foodName, setFoodName] = useState('');
    const [carbsValue, setCarbsValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedQuickFoods, setSelectedQuickFoods] = useState<Set<string>>(new Set());
    const cameraRef = useRef<CameraView>(null);

    // Last meal from real data
    const lastMeal = carbLogs.length > 0
        ? `Last: ${carbLogs[0].food_name} (${carbLogs[0].estimated_carbs}g carbs)`
        : 'No meals logged yet';

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    // ─── Take Photo ──────────────────────────────────────────────────
    const takePhoto = useCallback(async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                skipProcessing: false,
            });
            if (photo?.uri) {
                setCapturedPhoto(photo.uri);
                setScreenMode('review');
            }
        } catch (error) {
            console.error('Failed to take photo:', error);
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
        }
    }, []);

    // ─── Pick from Library ───────────────────────────────────────────
    const pickFromLibrary = useCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
            });
            if (!result.canceled && result.assets[0]?.uri) {
                setCapturedPhoto(result.assets[0].uri);
                setScreenMode('review');
            }
        } catch (error) {
            console.error('Failed to pick image:', error);
            Alert.alert('Error', 'Failed to select photo from library.');
        }
    }, []);

    // ─── Handle Quick Food Toggle ────────────────────────────────────
    const toggleQuickFood = useCallback((name: string) => {
        setSelectedQuickFoods(prev => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    }, []);

    // ─── Confirm & Log ───────────────────────────────────────────────
    const confirmAndLog = useCallback(() => {
        // Combine manual entry + quick food selections
        const foodEntries: { name: string; carbs: number }[] = [];

        // Manual text entry
        if (foodName.trim()) {
            const parsed = parseFoodText(foodName);
            const carbs = carbsValue.trim() ? parseInt(carbsValue) : parsed.carbs;
            foodEntries.push({ name: parsed.name, carbs: isNaN(carbs) ? parsed.carbs : carbs });
        }

        // Quick food selections
        for (const qf of QUICK_FOODS) {
            if (selectedQuickFoods.has(qf.name)) {
                foodEntries.push({ name: qf.name, carbs: qf.carbs });
            }
        }

        if (foodEntries.length === 0) {
            Alert.alert('No Food Selected', 'Please type a food name or select from the quick options below.');
            return;
        }

        setIsSaving(true);
        const totalName = foodEntries.map(e => e.name).join(', ');
        const totalCarbs = foodEntries.reduce((s, e) => s + e.carbs, 0);

        addCarbLog({
            id: Date.now().toString(),
            user_id: 'local',
            food_name: totalName,
            estimated_carbs: totalCarbs,
            photo_url: capturedPhoto === 'SKIP' ? undefined : capturedPhoto,
            created_at: new Date().toISOString(),
        });

        setTimeout(() => {
            setIsSaving(false);
            Alert.alert(
                '✅ Meal Logged!',
                `${totalName}\n${totalCarbs}g carbs added to your log.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }, 500);
    }, [foodName, carbsValue, selectedQuickFoods, capturedPhoto, addCarbLog, navigation]);

    // ─── Retake Photo ────────────────────────────────────────────────
    const retakePhoto = useCallback(() => {
        setCapturedPhoto(null);
        setScreenMode('camera');
        setFoodName('');
        setCarbsValue('');
        setSelectedQuickFoods(new Set());
    }, []);

    if (!permission) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="camera-outline" size={64} color={Colors.primary} />
                <Text style={styles.permissionText}>Camera permission is required to scan meals.</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>Enable Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                    <Text style={styles.backLinkText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Review Mode: Show captured photo + manual food entry ────────
    if (screenMode === 'review' && capturedPhoto) {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <StatusBar barStyle="light-content" />
                <SafeAreaView style={styles.reviewContainer}>
                    {/* Header */}
                    <View style={styles.reviewHeader}>
                        <TouchableOpacity onPress={retakePhoto} style={styles.reviewHeaderBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.reviewTitle}>📸 Identify Your Meal</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.reviewScroll} keyboardShouldPersistTaps="handled">
                        {/* Photo Preview */}
                        <View style={styles.photoContainer}>
                            <Image source={{ uri: capturedPhoto }} style={styles.photoPreview} />
                            <TouchableOpacity style={styles.retakeBtn} onPress={retakePhoto}>
                                <Ionicons name="camera-reverse" size={18} color="#FFF" />
                                <Text style={styles.retakeBtnText}>Retake</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Manual Entry Section */}
                        <View style={styles.manualSection}>
                            <Text style={styles.manualTitle}>What's in this photo?</Text>
                            <Text style={styles.manualSubtitle}>
                                Type the food name and we'll estimate the carbs, or select from common foods below
                            </Text>

                            {/* Food Name Input */}
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.foodInput}
                                    placeholder="e.g. Rice and Chicken..."
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={foodName}
                                    onChangeText={(text) => {
                                        setFoodName(text);
                                        // Auto-detect carbs from database
                                        if (text.trim()) {
                                            const parsed = parseFoodText(text);
                                            if (parsed.carbs !== 25) { // not the generic fallback
                                                setCarbsValue(parsed.carbs.toString());
                                            }
                                        }
                                    }}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Carbs Override */}
                            <View style={styles.carbsInputRow}>
                                <Text style={styles.carbsInputLabel}>Estimated Carbs:</Text>
                                <TextInput
                                    style={styles.carbsInput}
                                    placeholder="25"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={carbsValue}
                                    onChangeText={setCarbsValue}
                                    keyboardType="numeric"
                                />
                                <Text style={styles.carbsInputUnit}>g</Text>
                            </View>

                            {/* Quick Food Selection */}
                            <Text style={styles.quickTitle}>Or tap to add common foods:</Text>
                            <View style={styles.quickGrid}>
                                {QUICK_FOODS.map((food) => {
                                    const isSelected = selectedQuickFoods.has(food.name);
                                    return (
                                        <TouchableOpacity
                                            key={food.name}
                                            style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                                            onPress={() => toggleQuickFood(food.name)}
                                        >
                                            <Text style={styles.quickEmoji}>{food.emoji}</Text>
                                            <Text style={[styles.quickName, isSelected && styles.quickNameSelected]}>{food.name}</Text>
                                            <Text style={[styles.quickCarbs, isSelected && styles.quickCarbsSelected]}>{food.carbs}g</Text>
                                            {isSelected && (
                                                <View style={styles.quickCheck}>
                                                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Confirm Button */}
                    <View style={styles.reviewFooter}>
                        <TouchableOpacity
                            style={[styles.confirmButton, isSaving && { opacity: 0.6 }]}
                            onPress={confirmAndLog}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                                    <Text style={styles.confirmButtonText}>
                                        Log Meal{selectedQuickFoods.size > 0 ? ` (${selectedQuickFoods.size} items)` : ''}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        );
    }

    // ─── Camera Mode ─────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Real Camera View */}
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={flash === 'on'}
            />

            {/* Scanner Overlay */}
            <View style={styles.scannerOverlay}>
                <View style={styles.scanTarget}>
                    <View style={styles.scanCorners}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>

                    <View style={styles.centerContent}>
                        <MaterialCommunityIcons name="food-apple-outline" size={48} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.centerText}>Point at your meal</Text>
                    </View>
                </View>

                <View style={styles.hintBadge}>
                    <Text style={styles.hintText}>📸 Take a photo — then identify the food</Text>
                </View>
            </View>

            {/* Header Overlays */}
            <SafeAreaView style={styles.overlayHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleButton}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.headerIndicator}>
                    <Text style={styles.indicatorText}>Scan Meal</Text>
                </View>

                <TouchableOpacity
                    style={styles.circleButton}
                    onPress={() => setFlash(flash === 'on' ? 'off' : 'on')}
                >
                    <MaterialCommunityIcons
                        name={flash === 'on' ? "flash" : "flash-off"}
                        size={24}
                        color={flash === 'on' ? Colors.primary : "#FFF"}
                    />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Manual Entry Shortcut */}
            <TouchableOpacity
                style={styles.manualEntryBtn}
                onPress={() => {
                    setCapturedPhoto(null);
                    setScreenMode('review');
                    // Go straight to review mode without a photo
                    setCapturedPhoto('SKIP');
                }}
            >
                <Ionicons name="create-outline" size={18} color="#FFF" />
                <Text style={styles.manualEntryText}>Skip photo — log manually</Text>
            </TouchableOpacity>

            {/* Bottom Controls */}
            <BlurView intensity={20} tint="dark" style={styles.footerBlur}>
                <Text style={styles.lastMealText}>{lastMeal}</Text>

                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        style={styles.controlIcon}
                        onPress={() => navigation.navigate('VoiceLog')}
                    >
                        <Ionicons name="mic" size={24} color="#FFF" />
                        <Text style={styles.controlLabel}>VOICE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.shutterContainer}
                        onPress={takePhoto}
                    >
                        <View style={styles.shutterOuter}>
                            <View style={styles.shutterInner} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlIcon}
                        onPress={pickFromLibrary}
                    >
                        <Ionicons name="images" size={24} color="#FFF" />
                        <Text style={styles.controlLabel}>UPLOAD</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionText: {
        color: '#FFF',
        fontSize: Typography.sizes.lg,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 30,
        lineHeight: 24,
    },
    permissionBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
        ...Shadow.blue,
    },
    permissionBtnText: {
        color: '#FFF',
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.bold,
    },
    backLink: {
        marginTop: 20,
    },
    backLinkText: {
        color: Colors.text.onDark.tertiary,
        fontSize: Typography.sizes.md,
    },
    // ─── Scanner ─────────────────────────────
    scannerOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 200,
    },
    scanTarget: {
        width: width * 0.75,
        height: width * 0.75,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    scanCorners: {
        ...StyleSheet.absoluteFillObject,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: Colors.primary,
    },
    topLeft: {
        top: 0, left: 0,
        borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 30,
    },
    topRight: {
        top: 0, right: 0,
        borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 30,
    },
    bottomLeft: {
        bottom: 0, left: 0,
        borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 30,
    },
    bottomRight: {
        bottom: 0, right: 0,
        borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 30,
    },
    centerContent: {
        alignItems: 'center',
        gap: 12,
    },
    centerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 15,
        fontWeight: '600',
    },
    hintBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 30,
    },
    hintText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
        fontWeight: Typography.weights.medium,
    },
    overlayHeader: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    circleButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerIndicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
    },
    indicatorText: {
        color: '#FFF',
        fontWeight: Typography.weights.bold,
        fontSize: 14,
    },
    manualEntryBtn: {
        position: 'absolute',
        bottom: 210,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    manualEntryText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    footerBlur: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        paddingTop: 30, paddingBottom: 50,
        borderTopLeftRadius: 40, borderTopRightRadius: 40,
        overflow: 'hidden',
        alignItems: 'center',
    },
    lastMealText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontWeight: Typography.weights.semibold,
        marginBottom: 30,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 40,
    },
    controlIcon: {
        alignItems: 'center',
        gap: 6,
    },
    controlLabel: {
        fontSize: 9,
        fontWeight: Typography.weights.bold,
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 1,
    },
    shutterContainer: {
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    shutterOuter: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: '#FFF',
        padding: 4,
    },
    shutterInner: {
        flex: 1,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#CCC',
        backgroundColor: Colors.primary,
    },
    // ─── Review Mode ─────────────────────────
    reviewContainer: {
        flex: 1,
        backgroundColor: '#0A0B0F',
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    reviewHeaderBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    reviewTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    reviewScroll: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
    photoContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
        position: 'relative',
    },
    photoPreview: {
        width: '100%',
        height: 220,
        borderRadius: 20,
        backgroundColor: '#1A1B2E',
    },
    retakeBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    retakeBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    manualSection: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    manualTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    manualSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    inputRow: {
        marginBottom: Spacing.md,
    },
    foodInput: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        color: '#FFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    carbsInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: Spacing.lg,
    },
    carbsInputLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '600',
    },
    carbsInput: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
        width: 80,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    carbsInputUnit: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 16,
        fontWeight: '600',
    },
    quickTitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        letterSpacing: 0.5,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    quickChipSelected: {
        backgroundColor: 'rgba(10,133,255,0.15)',
        borderColor: Colors.primary,
    },
    quickEmoji: {
        fontSize: 16,
    },
    quickName: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
    },
    quickNameSelected: {
        color: '#FFF',
    },
    quickCarbs: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        fontWeight: '600',
    },
    quickCarbsSelected: {
        color: Colors.primary,
        fontWeight: '700',
    },
    quickCheck: {
        marginLeft: 2,
    },
    reviewFooter: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: Spacing.lg,
        paddingBottom: 40,
        backgroundColor: 'rgba(10,11,15,0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        ...Shadow.blue,
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
