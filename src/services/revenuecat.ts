import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_API_KEY } from '../constants/Config';

export const RevenueCatService = {
    initialize: async () => {
        try {
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            if (Platform.OS === 'ios') {
                await Purchases.configure({ apiKey: REVENUECAT_API_KEY.ios });
            } else {
                await Purchases.configure({ apiKey: REVENUECAT_API_KEY.android });
            }
        } catch (e) {
            console.warn('RevenueCat initialization failed:', e);
        }
    },

    getOfferings: async () => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                return offerings.current.availablePackages;
            }
            return [];
        } catch (e) {
            console.error('Error fetching offerings:', e);
            return [];
        }
    },

    purchasePackage: async (pack: PurchasesPackage) => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            if (typeof customerInfo.entitlements.active['Premium'] !== 'undefined') {
                return { success: true, customerInfo };
            }
            return { success: false, error: 'Entitlement not found' };
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('Purchase error:', e);
            }
            return { success: false, error: e.message };
        }
    },

    restorePurchases: async () => {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return { success: true, customerInfo };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    getCustomerInfo: async () => {
        try {
            return await Purchases.getCustomerInfo();
        } catch (e) {
            console.error('Error getting customer info:', e);
            return null;
        }
    },
};
