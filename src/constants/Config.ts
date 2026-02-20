// Supabase configuration
// Replace these with your actual Supabase project credentials
export const SUPABASE_URL = 'https://nfgnhrpwkgrhrtvxowjw.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZ25ocnB3a2dyaHJ0dnhvd2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzEzNjksImV4cCI6MjA4NzE0NzM2OX0.NHXRDUQN9VUiHGqpbYoS3wIl1RlD7xOTRCOf7KCzyPk';

// Google Sign-In configuration
export const GOOGLE_CONFIG = {
    webClientId: '1234567890-example.apps.googleusercontent.com', // Replace with your actual Web Client ID
    iosClientId: '1234567890-ios-example.apps.googleusercontent.com', // Replace with your actual iOS Client ID
    androidClientId: '1234567890-android-example.apps.googleusercontent.com', // Replace with your actual Android Client ID
};

// Admin configuration
export const ADMIN_EMAIL = 'admin@naulx.com'; // Replace with actual admin email

// RevenueCat configuration
// Replace with your actual RevenueCat API keys
export const REVENUECAT_API_KEY = {
    android: 'test_ZWnAAEMEYIfnqvSkmvomrBOpMXI',
    ios: 'test_ZWnAAEMEYIfnqvSkmvomrBOpMXI',
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
    FREE_DAILY_LIMIT: 5, // Increase to 5 for better trial feel
    PREMIUM_UNLIMITED: -1,
};

// Subscription tiers & Product IDs
export const SUBSCRIPTION_CONFIG = {
    ENTITLEMENT_ID: 'Premium',
    MONTHLY_PRODUCT_ID: 'gt_monthly_999_3dt',
    YEARLY_PRODUCT_ID: 'gt_yearly_8004_3dt',
    YEARLY_MARKETING_DAILY: '$0.22',
};

export const SUBSCRIPTION_TIERS = {
    FREE: 'free',
    PREMIUM: 'premium',
};
