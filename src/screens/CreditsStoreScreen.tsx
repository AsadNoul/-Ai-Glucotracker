import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/Theme';
import { useSubscriptionStore, useAuthStore } from '../store';
import { RevenueCatService } from '../services/revenuecat';
import { PurchasesPackage } from 'react-native-purchases';

export const CreditsStoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const {
        creditsRemaining,
        isPremium,
        setCredits,
        setSubscription,
    } = useSubscriptionStore();
    const { user } = useAuthStore();

    const [packages, setPackages] = React.useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        setLoading(true);
        const available = await RevenueCatService.getOfferings();
        setPackages(available);
        setLoading(false);
    };

    const handlePurchase = async (pack: PurchasesPackage) => {
        if (!user) {
            Alert.alert('Login Required', 'Please log in to make purchases.');
            return;
        }

        const result = await RevenueCatService.purchasePackage(pack);
        if (result.success) {
            // Update store based on what was bought
            const isSub = !!result.customerInfo?.entitlements.active['Premium'];
            if (isSub) {
                setSubscription(true, -1, 'premium');
            } else {
                // If it's a credit pack, we'd ideally have logic to parse product ID
                // For now, let's use the UI amount as reference
                setCredits(creditsRemaining + (pack.product.identifier.includes('500') ? 500 : 100));
            }
            Alert.alert('Success', 'Purchase completed successfully!');
        } else if (result.error) {
            Alert.alert('Error', result.error);
        }
    };

    const handleRestore = async () => {
        const result = await RevenueCatService.restorePurchases();
        if (result.success) {
            const isSub = !!result.customerInfo?.entitlements.active['Premium'];
            setSubscription(isSub, isSub ? -1 : creditsRemaining, isSub ? 'premium' : 'free');
            Alert.alert('Restored', 'Purchases restored successfully.');
        } else {
            Alert.alert('Error', result.error || 'Failed to restore purchases.');
        }
    };

    const CreditOption = ({ pack, description, popular }: any) => (
        <TouchableOpacity
            style={[styles.optionCard, popular && styles.popularOption]}
            onPress={() => handlePurchase(pack)}
        >
            <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                    <MaterialCommunityIcons
                        name={pack.product.identifier.includes('premium') ? "star-circle" : "lightning-bolt"}
                        size={24}
                        color={Colors.primary}
                    />
                </View>
                <View style={styles.optionInfo}>
                    <Text style={styles.optionAmount}>{pack.product.title}</Text>
                    <Text style={styles.optionDesc}>{description || pack.product.description}</Text>
                </View>
            </View>
            <View style={styles.optionRight}>
                <Text style={styles.optionPrice}>{pack.product.priceString}</Text>
                <Text style={styles.buyNowText}>PURCHASE</Text>
            </View>
            {popular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Credits Store</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <View style={{ height: 200, justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.planCard}>
                            <Text style={styles.planLabel}>UNLIMITED ACCESS</Text>
                            <View style={styles.planHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.planTitle}>{isPremium ? 'Premium Subscribed' : 'Get Full Control'}</Text>
                                    <Text style={styles.planSubtitle}>
                                        Unlock unlimited AI meal scans, advanced predictions, and comprehensive health reports.
                                    </Text>
                                </View>
                                <View style={styles.planIconCircle}>
                                    <MaterialCommunityIcons name="crown" size={36} color={Colors.primary} />
                                </View>
                            </View>

                            <View style={styles.trialBadge}>
                                <MaterialCommunityIcons name="clock-check" size={14} color="#FFF" />
                                <Text style={styles.trialText}>3-DAY FREE TRIAL ON ALL PLANS</Text>
                            </View>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Select Your Plan</Text>
                        </View>

                        {/* Subscription Plans */}
                        {packages.filter(p => p.packageType === 'MONTHLY' || p.packageType === 'ANNUAL').map((p, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.subscriptionCard, p.packageType === 'ANNUAL' && styles.popularOption]}
                                onPress={() => handlePurchase(p)}
                            >
                                {p.packageType === 'ANNUAL' && (
                                    <View style={styles.saveBadge}>
                                        <Text style={styles.saveBadgeText}>SAVE 33%</Text>
                                    </View>
                                )}
                                <View style={styles.subLeft}>
                                    <Text style={styles.subType}>{p.packageType === 'ANNUAL' ? 'Yearly Access' : 'Monthly Access'}</Text>
                                    <Text style={styles.subSubtitle}>
                                        {p.packageType === 'ANNUAL' ? 'Only $0.22 per day' : 'Flexible monthly billing'}
                                    </Text>
                                </View>
                                <View style={styles.subRight}>
                                    <Text style={styles.subPrice}>{p.product.priceString}</Text>
                                    <Text style={styles.subCycle}>{p.packageType === 'ANNUAL' ? '/year' : '/month'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>One-Time Credits</Text>
                            <View style={styles.currentBadge}>
                                <Text style={styles.currentText}>Balance: {creditsRemaining}</Text>
                            </View>
                        </View>

                        {packages
                            .filter(p => !['MONTHLY', 'ANNUAL'].includes(p.packageType))
                            .map((p, i) => (
                                <CreditOption
                                    key={i}
                                    pack={p}
                                    popular={p.product.identifier.includes('500')}
                                />
                            ))
                        }
                    </>
                )}

                <View style={styles.footerInfo}>
                    <View style={styles.secureBox}>
                        <Ionicons name="lock-closed" size={14} color={Colors.text.onDark.tertiary} />
                        <Text style={styles.secureText}>SECURE BILLING BY REVENUECAT</Text>
                    </View>

                    <View style={styles.legalLinks}>
                        <TouchableOpacity onPress={handleRestore}><Text style={styles.legalText}>RESTORE PURCHASES</Text></TouchableOpacity>
                        <View style={styles.legalDivider} />
                        <TouchableOpacity><Text style={styles.legalText}>TERMS OF SERVICE</Text></TouchableOpacity>
                        <View style={styles.legalDivider} />
                        <TouchableOpacity><Text style={styles.legalText}>PRIVACY</Text></TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.dark,
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
        color: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxxl,
    },
    planCard: {
        backgroundColor: 'rgba(10, 133, 255, 0.08)',
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(10, 133, 255, 0.15)',
        marginBottom: Spacing.xxl,
        marginTop: Spacing.md,
    },
    planLabel: {
        fontSize: 12,
        fontWeight: Typography.weights.bold,
        color: Colors.primary,
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    planTitle: {
        fontSize: Typography.sizes.xxl,
        fontWeight: Typography.weights.bold,
        color: '#FFF',
        marginBottom: 8,
    },
    planSubtitle: {
        fontSize: Typography.sizes.md,
        color: Colors.text.onDark.secondary,
        marginRight: 60,
        lineHeight: 20,
    },
    planIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(10, 133, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: 0,
        top: 0,
    },
    subscribeButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.blue,
    },
    subscribeButtonText: {
        color: '#FFF',
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
        color: '#FFF',
    },
    currentBadge: {
        backgroundColor: '#1E202F',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.round,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    currentText: {
        fontSize: 12,
        color: Colors.text.onDark.secondary,
        fontWeight: Typography.weights.semibold,
    },
    optionCard: {
        backgroundColor: Colors.background.darkCard,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.glass.border,
    },
    popularOption: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(10, 133, 255, 0.05)',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    optionIconContainer: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: 'rgba(10, 133, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionInfo: {
        gap: 4,
    },
    optionAmount: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
        color: '#FFF',
    },
    optionDesc: {
        fontSize: Typography.sizes.sm,
        color: Colors.text.onDark.tertiary,
    },
    optionRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    optionPrice: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
        color: '#FFF',
    },
    buyNowText: {
        fontSize: 10,
        fontWeight: Typography.weights.bold,
        color: Colors.primary,
    },
    popularBadge: {
        position: 'absolute',
        top: -1,
        right: -1,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
        borderTopRightRadius: BorderRadius.xxl,
    },
    popularText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFF',
    },
    discountBadge: {
        position: 'absolute',
        top: 20,
        right: -10,
        backgroundColor: '#1E8D55',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        transform: [{ rotate: '90deg' }],
    },
    discountText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFF',
    },
    footerInfo: {
        marginTop: Spacing.xxxl,
        alignItems: 'center',
        gap: Spacing.xl,
    },
    secureBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.round,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    secureText: {
        fontSize: 10,
        fontWeight: Typography.weights.bold,
        color: Colors.text.onDark.tertiary,
        letterSpacing: 0.5,
    },
    legalLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
    },
    legalText: {
        fontSize: 9,
        fontWeight: Typography.weights.bold,
        color: Colors.text.onDark.tertiary,
        letterSpacing: 0.5,
    },
    legalDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    subscriptionCard: {
        backgroundColor: Colors.background.darkCard,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.glass.border,
    },
    subLeft: {
        gap: 4,
    },
    subType: {
        fontSize: Typography.sizes.lg,
        fontWeight: 'bold',
        color: '#FFF',
    },
    subSubtitle: {
        fontSize: Typography.sizes.xs,
        color: Colors.text.onDark.tertiary,
    },
    subRight: {
        alignItems: 'flex-end',
    },
    subPrice: {
        fontSize: Typography.sizes.xl,
        fontWeight: '900',
        color: '#FFF',
    },
    subCycle: {
        fontSize: 10,
        color: Colors.text.onDark.tertiary,
        fontWeight: 'bold',
    },
    saveBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#1E8D55',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    saveBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    trialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
        alignSelf: 'flex-start',
    },
    trialText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
});
