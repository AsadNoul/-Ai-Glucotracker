import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AddLogScreen } from '../screens/AddLogScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreditsStoreScreen } from '../screens/CreditsStoreScreen';
import { ScanMealScreen } from '../screens/ScanMealScreen';
import { LogbookScreen } from '../screens/LogbookScreen';
import { MedicationScreen } from '../screens/MedicationScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { MoodScreen } from '../screens/MoodScreen';
import { EducationScreen } from '../screens/EducationScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { Colors, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore } from '../store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app screens
const MainTabs = () => {
    const { theme } = useSettingsStore();
    const t = getThemeColors(theme);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: t.card,
                    borderTopWidth: 1,
                    borderTopColor: t.border,
                    height: 85,
                    paddingBottom: 25,
                    paddingTop: 10,
                    ...Shadow.medium,
                },
                tabBarActiveTintColor: t.primary,
                tabBarInactiveTintColor: t.textTertiary,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: -5,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons name={focused ? "view-grid" : "view-grid-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="AddLog"
                component={AddLogScreen}
                options={{
                    tabBarLabel: 'Log',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons name={focused ? "silverware-fork-knife" : "silverware-fork-knife"} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Insights"
                component={InsightsScreen}
                options={{
                    tabBarLabel: 'Insights',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons name={focused ? "chart-timeline-variant" : "chart-timeline-variant-shimmer"} size={26} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

// Root Navigator
export const AppNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: Colors.background.dark },
            }}
        >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="CreditsStore" component={CreditsStoreScreen} />
            <Stack.Screen name="ScanMeal" component={ScanMealScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="Logbook" component={LogbookScreen} />
            <Stack.Screen name="Medication" component={MedicationScreen} />
            <Stack.Screen name="Activity" component={ActivityScreen} />
            <Stack.Screen name="Mood" component={MoodScreen} />
            <Stack.Screen name="Education" component={EducationScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
        </Stack.Navigator>
    );
};

