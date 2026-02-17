import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/Theme';

const { width } = Dimensions.get('window');

export const ScanMealScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [scannedItems] = useState(['Avocado', 'Salmon']);
    const [permission, requestPermission] = useCameraPermissions();
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [flash, setFlash] = useState<'off' | 'on'>('off');

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Real Camera View */}
            <CameraView
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

                    {isAnalyzing && (
                        <View style={styles.analyzingBadge}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.analyzingText}>Analyzing...</Text>
                            <Text style={styles.detectionText}>AI DETECTION ACTIVE</Text>
                        </View>
                    )}

                    <View style={styles.detectedItems}>
                        {scannedItems.map(item => (
                            <View key={item} style={styles.itemBadge}>
                                <Text style={styles.itemText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.hintBadge}>
                    <Text style={styles.hintText}>Hold steady for nutrition details</Text>
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

            {/* Bottom Controls */}
            <BlurView intensity={20} tint="dark" style={styles.footerBlur}>
                <Text style={styles.lastMealText}>Last meal: Breakfast (45g carbs)   <Ionicons name="chevron-forward" size={14} color="#FFF" /></Text>

                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        style={styles.controlIcon}
                        onPress={() => Alert.alert('Voice Coming Soon', 'Voice food recognition is currently in beta.')}
                    >
                        <Ionicons name="mic" size={24} color="#FFF" />
                        <Text style={styles.controlLabel}>VOICE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.shutterContainer}
                        onPress={() => {
                            Alert.alert('Scan Complete', 'AI detected: Avocado Salmon Bowl (42g Carbs)', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Confirm',
                                    onPress: () => navigation.navigate('AddLog', {
                                        tab: 'carbs',
                                        scannedFood: 'Avocado Salmon Bowl',
                                        scannedCarbs: '42'
                                    })
                                }
                            ]);
                        }}
                    >
                        <View style={styles.shutterOuter}>
                            <View style={styles.shutterInner} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlIcon}
                        onPress={() => Alert.alert('Upload', 'Select a photo from your library coming soon.')}
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
    cameraPlaceholder: {
        flex: 1,
        backgroundColor: '#1A1B2E',
    },
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
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 30,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 30,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 30,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 30,
    },
    analyzingBadge: {
        alignItems: 'center',
        gap: 8,
    },
    analyzingText: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
        color: '#FFF',
        marginTop: 10,
    },
    detectionText: {
        fontSize: 10,
        fontWeight: Typography.weights.bold,
        color: Colors.primary,
        letterSpacing: 1.5,
    },
    detectedItems: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 24,
        gap: 8,
    },
    itemBadge: {
        backgroundColor: 'rgba(10, 133, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(10, 133, 255, 0.3)',
    },
    itemText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: Typography.weights.bold,
    },
    hintBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 40,
    },
    hintText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 13,
        fontWeight: Typography.weights.medium,
    },
    overlayHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    circleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIndicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    indicatorText: {
        color: '#FFF',
        fontWeight: Typography.weights.bold,
        fontSize: 14,
    },
    footerBlur: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 30,
        paddingBottom: 50,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
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
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterOuter: {
        width: 70,
        height: 70,
        borderRadius: 35,
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
});
