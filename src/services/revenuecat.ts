import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_API_KEY, SUBSCRIPTION_TIERS } from '../constants/Config';
import { userService } from './supabase';

export const revenueCatService = {
    /**
     * Initialize RevenueCat SDK
     */
    initialize: async (userId: string) => {
        try {
            const apiKey = Platform.OS === 'android'
                ? REVENUECAT_API_KEY.android
                : REVENUECAT_API_KEY.ios;

            Purchases.configure({ apiKey, appUserID: userId });
            console.log('RevenueCat initialized for user:', userId);
        } catch (error) {
            console.error('RevenueCat initialization error:', error);
            throw error;
        }
    },

    /**
     * Get available subscription offerings
     */
    getOfferings: async (): Promise<PurchasesOffering | null> => {
        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current;
        } catch (error) {
            console.error('Error fetching offerings:', error);
            return null;
        }
    },

    /**
     * Purchase a package
     */
    purchasePackage: async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            return customerInfo;
        } catch (error: any) {
            if (error.userCancelled) {
                throw new Error('Purchase cancelled');
            }
            console.error('Purchase error:', error);
            throw error;
        }
    },

    /**
     * Restore purchases
     */
    restorePurchases: async (): Promise<CustomerInfo> => {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (error) {
            console.error('Restore purchases error:', error);
            throw error;
        }
    },

    /**
     * Check if user has premium subscription
     */
    checkPremiumStatus: async (): Promise<boolean> => {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return customerInfo.entitlements.active['Premium'] !== undefined;
        } catch (error) {
            console.error('Error checking premium status:', error);
            return false;
        }
    },

    /**
     * Sync RevenueCat subscription status with Supabase
     */
    syncSubscriptionStatus: async (userId: string): Promise<void> => {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const isPremium = customerInfo.entitlements.active['Premium'] !== undefined;

            let subscriptionStatus = SUBSCRIPTION_TIERS.FREE;

            if (isPremium) {
                // Determine if monthly or yearly based on product identifier
                const entitlement = customerInfo.entitlements.active['Premium'];
                const productId = entitlement.productIdentifier;

                if (productId.includes('monthly')) {
                    subscriptionStatus = SUBSCRIPTION_TIERS.PREMIUM_MONTHLY;
                } else if (productId.includes('yearly')) {
                    subscriptionStatus = SUBSCRIPTION_TIERS.PREMIUM_YEARLY;
                }
            }

            // Update Supabase
            await userService.updateSubscriptionStatus(userId, subscriptionStatus);

            // Update credits: unlimited for premium, 3 for free
            await userService.updateCredits(userId, isPremium ? -1 : 3);
        } catch (error) {
            console.error('Error syncing subscription status:', error);
            throw error;
        }
    },

    /**
     * Get subscription info for display
     */
    getSubscriptionInfo: async (): Promise<{
        isPremium: boolean;
        expirationDate?: string;
        productId?: string;
    }> => {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const premiumEntitlement = customerInfo.entitlements.active['Premium'];

            if (premiumEntitlement) {
                return {
                    isPremium: true,
                    expirationDate: premiumEntitlement.expirationDate || undefined,
                    productId: premiumEntitlement.productIdentifier,
                };
            }

            return { isPremium: false };
        } catch (error) {
            console.error('Error getting subscription info:', error);
            return { isPremium: false };
        }
    },
};
