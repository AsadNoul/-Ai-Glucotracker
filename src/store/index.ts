import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, GlucoseLog, CarbLog, InsulinLog } from '../services/supabase';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setGuest: (isGuest: boolean) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isGuest: false,
            isLoading: true,
            setUser: (user) => set({ user, isAuthenticated: !!user, isGuest: false }),
            setGuest: (isGuest) => set({ isGuest, isAuthenticated: isGuest, user: isGuest ? { id: 'guest', email: 'guest@local', name: 'Guest User' } as any : null }),
            setLoading: (loading) => set({ isLoading: loading }),
            logout: () => set({ user: null, isAuthenticated: false, isGuest: false }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

interface LogsState {
    glucoseLogs: GlucoseLog[];
    carbLogs: CarbLog[];
    insulinLogs: InsulinLog[];
    setGlucoseLogs: (logs: GlucoseLog[]) => void;
    setCarbLogs: (logs: CarbLog[]) => void;
    setInsulinLogs: (logs: InsulinLog[]) => void;
    addGlucoseLog: (log: GlucoseLog) => void;
    addCarbLog: (log: CarbLog) => void;
    addInsulinLog: (log: InsulinLog) => void;
    clearLogs: () => void;
}

export const useLogsStore = create<LogsState>()(
    persist(
        (set) => ({
            glucoseLogs: [],
            carbLogs: [],
            insulinLogs: [],
            setGlucoseLogs: (logs) => set({ glucoseLogs: logs }),
            setCarbLogs: (logs) => set({ carbLogs: logs }),
            setInsulinLogs: (logs) => set({ insulinLogs: logs }),
            addGlucoseLog: (log) => set((state) => ({
                glucoseLogs: [log, ...state.glucoseLogs]
            })),
            addCarbLog: (log) => set((state) => ({
                carbLogs: [log, ...state.carbLogs]
            })),
            addInsulinLog: (log) => set((state) => ({
                insulinLogs: [log, ...state.insulinLogs]
            })),
            clearLogs: () => set({
                glucoseLogs: [],
                carbLogs: [],
                insulinLogs: []
            }),
        }),
        {
            name: 'logs-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

interface DailyStats {
    waterGlasses: number;
    weight: number | null;
}

interface SubscriptionState {
    isPremium: boolean;
    creditsRemaining: number;
    subscriptionType: string;
    setSubscription: (isPremium: boolean, creditsRemaining: number, type: string) => void;
    decrementCredit: () => void;
    setCredits: (credits: number) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set) => ({
            isPremium: false,
            creditsRemaining: 10,
            subscriptionType: 'free',
            setSubscription: (isPremium, creditsRemaining, type) => set({
                isPremium,
                creditsRemaining,
                subscriptionType: type
            }),
            decrementCredit: () => set((state) => ({
                creditsRemaining: state.isPremium ? -1 : Math.max(0, state.creditsRemaining - 1)
            })),
            setCredits: (credits) => set({ creditsRemaining: credits }),
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

interface SettingsState {
    notificationsEnabled: boolean;
    theme: 'light' | 'dark';
    glucoseUnit: 'mg/dL' | 'mmol/L';
    targetGlucoseMin: number;
    targetGlucoseMax: number;
    waterGoal: number;
    dailyStats: DailyStats;
    setNotifications: (enabled: boolean) => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setGlucoseUnit: (unit: 'mg/dL' | 'mmol/L') => void;
    setTargetRange: (min: number, max: number) => void;
    addWater: () => void;
    resetWater: () => void;
    setWeight: (weight: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            notificationsEnabled: true,
            theme: 'dark',
            glucoseUnit: 'mg/dL',
            targetGlucoseMin: 70,
            targetGlucoseMax: 180,
            waterGoal: 8,
            dailyStats: {
                waterGlasses: 0,
                weight: null,
            },
            setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
            setTheme: (theme) => set({ theme }),
            setGlucoseUnit: (unit) => set({ glucoseUnit: unit }),
            setTargetRange: (min, max) => set({ targetGlucoseMin: min, targetGlucoseMax: max }),
            addWater: () => set((state) => ({
                dailyStats: { ...state.dailyStats, waterGlasses: state.dailyStats.waterGlasses + 1 }
            })),
            resetWater: () => set((state) => ({
                dailyStats: { ...state.dailyStats, waterGlasses: 0 }
            })),
            setWeight: (weight) => set((state) => ({
                dailyStats: { ...state.dailyStats, weight }
            })),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
