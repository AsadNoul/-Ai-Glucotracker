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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/Theme';
import { useSubscriptionStore } from '../store';

export const CreditsStoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const {
        creditsRemaining,
        isPremium,
        setCredits,
        setSubscription
    } = useSubscriptionStore();

    const handleBuy = (amount: number, price: string) => {
        Alert.alert(
            'Confirm Purchase',
            `Purchase ${amount.toLocaleString()} credits for ${price}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        setCredits(creditsRemaining + amount);
                        Alert.alert('Success', `${amount.toLocaleString()} credits added to your account!`);
                    }
                }
            ]
        );
    };

    const handleSubscribe = () => {
        Alert.alert(
            'Go Premium',
            'Upgrade to Premium for unlimited scans and advanced insights for $9.99/mo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Upgrade',
                    onPress: () => {
                        setSubscription(true, -1, 'premium_monthly');
                        Alert.alert('Welcome to Premium!', 'You now have unlimited access to all features.');
                    }
                }
            ]
        );
    };

    const CreditOption = ({ amount, price, description, popular, discount }: any) => (
        <TouchableOpacity
            style={[styles.optionCard, popular && styles.popularOption]}
            onPress={() => handleBuy(amount, price)}
        >
            <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                    <MaterialCommunityIcons
                        name={amount >= 2000 ? "lightning-bolt-circle" : "lightning-bolt"}
                        size={24}
                        color={Colors.primary}
                    />
                </View>
                <View style={styles.optionInfo}>
                    <Text style={styles.optionAmount}>{amount.toLocaleString()} Credits</Text>
                    <Text style={styles.optionDesc}>{description}</Text>
                </View>
            </View>
            <View style={styles.optionRight}>
                <Text style={styles.optionPrice}>{price}</Text>
                <Text style={styles.buyNowText}>BUY NOW</Text>
            </View>
            {popular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                </View>
            )}
            {discount && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>SAVE {discount}</Text>
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
                <View style={styles.planCard}>
                    <Text style={styles.planLabel}>YOUR PLAN</Text>
                    <View style={styles.planHeader}>
                        <View>
                            <Text style={styles.planTitle}>{isPremium ? 'Premium Plan' : 'Free Tier'}</Text>
                            <Text style={styles.planSubtitle}>
                                {isPremium
                                    ? 'Enjoy unlimited AI scans and advanced features.'
                                    : 'Upgrade to Premium for unlimited tracking and advanced AI insights.'}
                            </Text>
                        </View>
                        <View style={styles.planIconCircle}>
                            <MaterialCommunityIcons name="star-circle" size={32} color={Colors.primary} />
                        </View>
                    </View>

                    {!isPremium && (
                        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
                            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Purchase Credits</Text>
                    <View style={styles.currentBadge}>
                        <Text style={styles.currentText}>Current: {creditsRemaining}</Text>
                    </View>
                </View>

                <CreditOption
                    amount={100}
                    price="$4.99"
                    description="Essential monitoring"
                />

                <CreditOption
                    amount={500}
                    price="$19.99"
                    description="Most active users"
                    popular
                />

                <CreditOption
                    amount={2000}
                    price="$59.99"
                    description="Power user bundle"
                    discount="30%"
                />

                <View style={styles.footerInfo}>
                    <View style={styles.secureBox}>
                        <Ionicons name="lock-closed" size={14} color={Colors.text.onDark.tertiary} />
                        <Text style={styles.secureText}>SECURE BILLING BY REVENUECAT</Text>
                    </View>

                    <View style={styles.legalLinks}>
                        <TouchableOpacity><Text style={styles.legalText}>RESTORE PURCHASES</Text></TouchableOpacity>
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
});
