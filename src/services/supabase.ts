import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/Config';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key);
    },
};

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: ExpoSecureStoreAdapter as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Database types
export interface User {
    id: string;
    email: string;
    subscription_status: 'free' | 'premium_monthly' | 'premium_yearly';
    credits_remaining: number;
    created_at: string;
}

export interface GlucoseLog {
    id: string;
    user_id: string;
    glucose_value: number;
    reading_time: string;
    notes?: string;
    created_at: string;
    sync_status?: 'synced' | 'pending' | 'local';
}

export interface CarbLog {
    id: string;
    user_id: string;
    food_name: string;
    estimated_carbs: number;
    photo_url?: string;
    created_at: string;
    sync_status?: 'synced' | 'pending' | 'local';
}

export interface InsulinLog {
    id: string;
    user_id: string;
    units: number;
    type: 'rapid' | 'long-acting' | 'mixed';
    timestamp: string;
    created_at: string;
    sync_status?: 'synced' | 'pending' | 'local';
}

// Auth service
export const authService = {
    signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        // Create user profile
        if (data.user) {
            await supabase.from('users').insert({
                id: data.user.id,
                email: data.user.email,
                subscription_status: 'free',
                credits_remaining: 3,
            });
        }

        return data;
    },

    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    getSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },
};

// User service
export const userService = {
    getProfile: async (userId: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    updateCredits: async (userId: string, credits: number) => {
        const { error } = await supabase
            .from('users')
            .update({ credits_remaining: credits })
            .eq('id', userId);

        if (error) throw error;
    },

    resetDailyCredits: async (userId: string, isFree: boolean) => {
        const credits = isFree ? 3 : -1; // -1 means unlimited for premium
        await userService.updateCredits(userId, credits);
    },

    updateSubscriptionStatus: async (userId: string, status: string) => {
        const { error } = await supabase
            .from('users')
            .update({ subscription_status: status })
            .eq('id', userId);

        if (error) throw error;
    },
};

// Glucose logs service
export const glucoseService = {
    addLog: async (userId: string, glucoseValue: number, readingTime: string, notes?: string) => {
        const { data, error } = await supabase
            .from('glucose_logs')
            .insert({
                user_id: userId,
                glucose_value: glucoseValue,
                reading_time: readingTime,
                notes,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getLogs: async (userId: string, limit: number = 30): Promise<GlucoseLog[]> => {
        const { data, error } = await supabase
            .from('glucose_logs')
            .select('*')
            .eq('user_id', userId)
            .order('reading_time', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    getLogsInDateRange: async (userId: string, startDate: string, endDate: string): Promise<GlucoseLog[]> => {
        const { data, error } = await supabase
            .from('glucose_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('reading_time', startDate)
            .lte('reading_time', endDate)
            .order('reading_time', { ascending: true });

        if (error) throw error;
        return data || [];
    },
};

// Carb logs service
export const carbService = {
    addLog: async (userId: string, foodName: string, estimatedCarbs: number, photoUrl?: string) => {
        const { data, error } = await supabase
            .from('carb_logs')
            .insert({
                user_id: userId,
                food_name: foodName,
                estimated_carbs: estimatedCarbs,
                photo_url: photoUrl,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getLogs: async (userId: string, limit: number = 30): Promise<CarbLog[]> => {
        const { data, error } = await supabase
            .from('carb_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },
};

// Insulin logs service
export const insulinService = {
    addLog: async (userId: string, units: number, type: 'rapid' | 'long-acting' | 'mixed', timestamp: string) => {
        const { data, error } = await supabase
            .from('insulin_logs')
            .insert({
                user_id: userId,
                units,
                type,
                timestamp,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getLogs: async (userId: string, limit: number = 30): Promise<InsulinLog[]> => {
        const { data, error } = await supabase
            .from('insulin_logs')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },
};

// Storage service for photo uploads
export const storageService = {
    uploadPhoto: async (userId: string, photoUri: string): Promise<string> => {
        try {
            const response = await fetch(photoUri);
            const blob = await response.blob();
            const fileName = `${userId}/${Date.now()}.jpg`;

            const { data, error } = await supabase.storage
                .from('food-photos')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('food-photos')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw error;
        }
    },
};
