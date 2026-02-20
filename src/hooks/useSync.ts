import { useEffect } from 'react';
import { useLogsStore, useAuthStore } from '../store';
import { useNetwork } from './useNetwork';
import { glucoseService, carbService, insulinService } from '../services/supabase';

export const useSync = () => {
    const { isOffline } = useNetwork();
    const { isAuthenticated, user, isGuest } = useAuthStore();
    const {
        glucoseLogs, carbLogs, insulinLogs,
        setGlucoseLogs, setCarbLogs, setInsulinLogs
    } = useLogsStore();

    useEffect(() => {
        if (!isOffline && isAuthenticated && !isGuest && user) {
            syncPendingLogs();
        }
    }, [isOffline, isAuthenticated, isGuest]);

    const syncPendingLogs = async () => {
        const userId = user!.id;

        // 1. Sync Glucose Logs
        const pendingGlucose = glucoseLogs.filter(l => l.sync_status === 'local');
        if (pendingGlucose.length > 0) {
            console.log(`Syncing ${pendingGlucose.length} glucose logs...`);
            for (const log of pendingGlucose) {
                try {
                    await glucoseService.addLog(userId, log.glucose_value, log.reading_time);
                    // Update local log status
                    const updatedLogs = useLogsStore.getState().glucoseLogs.map(l =>
                        l.id === log.id ? { ...l, sync_status: 'synced' as const } : l
                    );
                    setGlucoseLogs(updatedLogs);
                } catch (e) {
                    console.error('Failed to sync glucose log:', e);
                }
            }
        }

        // 2. Sync Carb Logs
        const pendingCarbs = carbLogs.filter(l => l.sync_status === 'local');
        if (pendingCarbs.length > 0) {
            console.log(`Syncing ${pendingCarbs.length} carb logs...`);
            for (const log of pendingCarbs) {
                try {
                    await carbService.addLog(userId, log.food_name, log.estimated_carbs);
                    const updatedLogs = useLogsStore.getState().carbLogs.map(l =>
                        l.id === log.id ? { ...l, sync_status: 'synced' as const } : l
                    );
                    setCarbLogs(updatedLogs);
                } catch (e) {
                    console.error('Failed to sync carb log:', e);
                }
            }
        }

        // 3. Sync Insulin Logs
        const pendingInsulin = insulinLogs.filter(l => l.sync_status === 'local');
        if (pendingInsulin.length > 0) {
            console.log(`Syncing ${pendingInsulin.length} insulin logs...`);
            for (const log of pendingInsulin) {
                try {
                    // Assuming insulinService.addLog exists and takes these params
                    await insulinService.addLog(userId, log.units, log.type, log.timestamp);
                    const updatedLogs = useLogsStore.getState().insulinLogs.map(l =>
                        l.id === log.id ? { ...l, sync_status: 'synced' as const } : l
                    );
                    setInsulinLogs(updatedLogs);
                } catch (e) {
                    console.error('Failed to sync insulin log:', e);
                }
            }
        }
    };

    return { syncPendingLogs };
};
