import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const notificationService = {
    /**
     * Request notification permissions and get push token
     */
    registerForPushNotifications: async (): Promise<string | null> => {
        if (!Device.isDevice) {
            console.log('Push notifications only work on physical devices');
            return null;
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Permission not granted for notifications');
                return null;
            }

            const token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });

            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#4A90FF',
                });
            }

            return token.data;
        } catch (error) {
            console.error('Error registering for push notifications:', error);
            return null;
        }
    },

    /**
     * Schedule local notification
     */
    scheduleNotification: async (
        title: string,
        body: string,
        trigger: Notifications.NotificationTriggerInput
    ): Promise<string> => {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger,
        });
    },

    /**
     * Schedule daily reminder to log meals
     */
    scheduleMealReminders: async () => {
        // Cancel existing reminders
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Breakfast reminder (8 AM)
        await notificationService.scheduleNotification(
            'Time for breakfast! 🍳',
            'Don\'t forget to log your meal and carbs',
            {
                hour: 8,
                minute: 0,
                repeats: true,
            }
        );

        // Lunch reminder (12:30 PM)
        await notificationService.scheduleNotification(
            'Lunch time! 🥗',
            'Remember to log your meal',
            {
                hour: 12,
                minute: 30,
                repeats: true,
            }
        );

        // Dinner reminder (7 PM)
        await notificationService.scheduleNotification(
            'Dinner reminder 🍽️',
            'Log your evening meal',
            {
                hour: 19,
                minute: 0,
                repeats: true,
            }
        );
    },

    /**
     * Send glucose alert
     */
    sendGlucoseAlert: async (glucoseValue: number) => {
        let title = '';
        let body = '';

        if (glucoseValue < 70) {
            title = '🔽 Low Glucose Alert';
            body = `Your glucose is ${glucoseValue} mg/dL. Consume fast-acting carbs immediately!`;
        } else if (glucoseValue > 180) {
            title = '🔼 High Glucose Alert';
            body = `Your glucose is ${glucoseValue} mg/dL. Check your insulin and stay hydrated.`;
        } else {
            return; // Normal range, no alert needed
        }

        await notificationService.scheduleNotification(title, body, null);
    },

    /**
     * Send daily summary notification
     */
    scheduleDailySummary: async () => {
        await notificationService.scheduleNotification(
            '📊 Daily Summary Available',
            'Review your glucose trends and logging history',
            {
                hour: 21,
                minute: 0,
                repeats: true,
            }
        );
    },

    /**
     * Cancel all notifications
     */
    cancelAllNotifications: async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
    },

    /**
     * Get scheduled notifications
     */
    getScheduledNotifications: async () => {
        return await Notifications.getAllScheduledNotificationsAsync();
    },
};
