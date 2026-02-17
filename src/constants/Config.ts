// Supabase configuration
// Replace these with your actual Supabase project credentials
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';

// RevenueCat configuration
// Replace with your actual RevenueCat API keys
export const REVENUECAT_API_KEY = {
    android: 'your-android-key-here',
    ios: 'your-ios-key-here',
};

// Firebase configuration
// Replace with your actual Firebase config
export const FIREBASE_CONFIG = {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-app-id',
};

// Credit system constants
export const CREDITS = {
    FREE_DAILY_LIMIT: 3,
    PREMIUM_UNLIMITED: -1, // -1 means unlimited
};

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
    FREE: 'free',
    PREMIUM_MONTHLY: 'premium_monthly',
    PREMIUM_YEARLY: 'premium_yearly',
};
