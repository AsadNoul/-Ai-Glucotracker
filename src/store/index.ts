import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, GlucoseLog, CarbLog, InsulinLog } from '../services/supabase';

export interface VitalEntry {
    id: string;
    type: 'blood_pressure' | 'weight' | 'heart_rate';
    values: { systolic?: number; diastolic?: number; weight?: number; heartRate?: number };
    timestamp: string;
    notes?: string;
}


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
    vitals: VitalEntry[];
    setGlucoseLogs: (logs: GlucoseLog[]) => void;
    setCarbLogs: (logs: CarbLog[]) => void;
    setInsulinLogs: (logs: InsulinLog[]) => void;
    setVitals: (vitals: VitalEntry[]) => void;
    addGlucoseLog: (log: GlucoseLog) => void;
    addCarbLog: (log: CarbLog) => void;
    addInsulinLog: (log: InsulinLog) => void;
    addVital: (vital: VitalEntry) => void;
    clearLogs: () => void;
}


export const useLogsStore = create<LogsState>()(
    persist(
        (set) => ({
            glucoseLogs: [],
            carbLogs: [],
            insulinLogs: [],
            vitals: [],
            setGlucoseLogs: (logs) => set({ glucoseLogs: logs }),
            setCarbLogs: (logs) => set({ carbLogs: logs }),
            setInsulinLogs: (logs) => set({ insulinLogs: logs }),
            setVitals: (vitals) => set({ vitals }),
            addGlucoseLog: (log) => set((state) => ({
                glucoseLogs: [{ ...log, sync_status: log.sync_status || 'local' }, ...state.glucoseLogs]
            })),
            addCarbLog: (log) => set((state) => ({
                carbLogs: [{ ...log, sync_status: log.sync_status || 'local' }, ...state.carbLogs]
            })),
            addInsulinLog: (log) => set((state) => ({
                insulinLogs: [{ ...log, sync_status: log.sync_status || 'local' }, ...state.insulinLogs]
            })),
            addVital: (log) => set((state) => ({
                vitals: [log, ...state.vitals]
            })),
            clearLogs: () => set({
                glucoseLogs: [],
                carbLogs: [],
                insulinLogs: [],
                vitals: [],
            }),
        }),

        {
            name: 'logs-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);


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

// ─── Emergency Contact ──────────────────────────────────────────────
export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
}

interface SettingsState {
    notificationsEnabled: boolean;
    theme: 'light' | 'dark';
    glucoseUnit: 'mg/dL' | 'mmol/L';
    targetGlucoseMin: number;
    targetGlucoseMax: number;
    waterGoal: number;
    waterIntake: number;
    carbGoal: number;
    // Health profile
    diabetesType: 'type1' | 'type2' | 'gestational' | 'prediabetes' | 'none';
    age: number;
    weight: number;
    weightUnit: 'kg' | 'lbs';
    // Reminders
    reminderMealEnabled: boolean;
    reminderGlucoseEnabled: boolean;
    reminderWaterEnabled: boolean;
    // Emergency
    emergencyContacts: EmergencyContact[];
    // Setters
    setNotifications: (enabled: boolean) => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setGlucoseUnit: (unit: 'mg/dL' | 'mmol/L') => void;
    setTargetRange: (min: number, max: number) => void;
    addWater: (ml: number) => void;
    resetWater: () => void;
    setCarbGoal: (goal: number) => void;
    setDiabetesType: (type: 'type1' | 'type2' | 'gestational' | 'prediabetes' | 'none') => void;
    setAge: (age: number) => void;
    setWeight: (weight: number, unit: 'kg' | 'lbs') => void;
    setReminder: (key: 'reminderMealEnabled' | 'reminderGlucoseEnabled' | 'reminderWaterEnabled', value: boolean) => void;
    addEmergencyContact: (contact: EmergencyContact) => void;
    removeEmergencyContact: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            notificationsEnabled: true,
            theme: 'dark',
            glucoseUnit: 'mg/dL',
            targetGlucoseMin: 70,
            targetGlucoseMax: 180,
            waterGoal: 2000,
            waterIntake: 0,
            carbGoal: 150,
            diabetesType: 'none',
            age: 0,
            weight: 0,
            weightUnit: 'kg',
            reminderMealEnabled: false,
            reminderGlucoseEnabled: false,
            reminderWaterEnabled: false,
            emergencyContacts: [],
            setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
            setTheme: (theme) => set({ theme }),
            setGlucoseUnit: (unit) => set({ glucoseUnit: unit }),
            setTargetRange: (min, max) => set({ targetGlucoseMin: min, targetGlucoseMax: max }),
            addWater: (ml) => set((state) => ({ waterIntake: state.waterIntake + ml })),
            resetWater: () => set({ waterIntake: 0 }),
            setCarbGoal: (goal) => set({ carbGoal: goal }),
            setDiabetesType: (type) => set({ diabetesType: type }),
            setAge: (age) => set({ age }),
            setWeight: (weight, unit) => set({ weight, weightUnit: unit }),
            setReminder: (key, value) => set({ [key]: value }),
            addEmergencyContact: (contact) => set((state) => ({
                emergencyContacts: [...state.emergencyContacts, contact]
            })),
            removeEmergencyContact: (id) => set((state) => ({
                emergencyContacts: state.emergencyContacts.filter(c => c.id !== id)
            })),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// ─── Medication Store ───────────────────────────────────────────────
export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    type: 'oral' | 'injection' | 'insulin' | 'supplement' | 'other';
    timeOfDay: string[];
    notes?: string;
    active: boolean;
    createdAt: string;
}

export interface MedicationLog {
    id: string;
    medicationId: string;
    medicationName: string;
    dosage: string;
    taken: boolean;
    takenAt: string;
    skippedReason?: string;
}

interface MedicationState {
    medications: Medication[];
    medicationLogs: MedicationLog[];
    addMedication: (med: Medication) => void;
    removeMedication: (id: string) => void;
    toggleMedication: (id: string) => void;
    addMedicationLog: (log: MedicationLog) => void;
}

export const useMedicationStore = create<MedicationState>()(
    persist(
        (set) => ({
            medications: [],
            medicationLogs: [],
            addMedication: (med) => set((state) => ({
                medications: [...state.medications, med]
            })),
            removeMedication: (id) => set((state) => ({
                medications: state.medications.filter(m => m.id !== id)
            })),
            toggleMedication: (id) => set((state) => ({
                medications: state.medications.map(m =>
                    m.id === id ? { ...m, active: !m.active } : m
                )
            })),
            addMedicationLog: (log) => set((state) => ({
                medicationLogs: [log, ...state.medicationLogs]
            })),
        }),
        {
            name: 'medication-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// ─── Activity Store ─────────────────────────────────────────────────
export interface ActivityLog {
    id: string;
    type: string;
    emoji: string;
    duration: number; // minutes
    intensity: 'light' | 'moderate' | 'vigorous';
    caloriesBurned: number;
    notes?: string;
    glucoseBefore?: number;
    glucoseAfter?: number;
    createdAt: string;
}

interface ActivityState {
    activityLogs: ActivityLog[];
    addActivity: (log: ActivityLog) => void;
    removeActivity: (id: string) => void;
}

export const useActivityStore = create<ActivityState>()(
    persist(
        (set) => ({
            activityLogs: [],
            addActivity: (log) => set((state) => ({
                activityLogs: [log, ...state.activityLogs]
            })),
            removeActivity: (id) => set((state) => ({
                activityLogs: state.activityLogs.filter(a => a.id !== id)
            })),
        }),
        {
            name: 'activity-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// ─── Mood Store ─────────────────────────────────────────────────────
export interface MoodEntry {
    id: string;
    mood: 'great' | 'good' | 'okay' | 'low' | 'bad';
    emoji: string;
    energyLevel: number; // 1-5
    stressLevel: number; // 1-5
    sleepQuality: number; // 1-5
    symptoms: string[];
    notes?: string;
    glucoseAtTime?: number;
    createdAt: string;
}

interface MoodState {
    moodEntries: MoodEntry[];
    addMoodEntry: (entry: MoodEntry) => void;
    removeMoodEntry: (id: string) => void;
}

export const useMoodStore = create<MoodState>()(
    persist(
        (set) => ({
            moodEntries: [],
            addMoodEntry: (entry) => set((state) => ({
                moodEntries: [entry, ...state.moodEntries]
            })),
            removeMoodEntry: (id) => set((state) => ({
                moodEntries: state.moodEntries.filter(e => e.id !== id)
            })),
        }),
        {
            name: 'mood-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
