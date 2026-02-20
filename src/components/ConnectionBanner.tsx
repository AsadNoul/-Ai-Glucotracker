import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../hooks/useNetwork';
import { Spacing } from '../constants/Theme';

import { useSettingsStore } from '../store';

export const ConnectionBanner = () => {
    const { isOffline } = useNetwork();
    const { theme } = useSettingsStore();
    const isDark = theme === 'dark';

    if (!isOffline) return null;

    return (
        <View style={[
            styles.container,
            { backgroundColor: isDark ? '#FF9800' : '#FFF3E0' }
        ]}>
            <View style={styles.content}>
                <Ionicons
                    name="cloud-offline"
                    size={16}
                    color={isDark ? '#FFF' : '#E65100'}
                />
                <Text style={[
                    styles.text,
                    { color: isDark ? '#FFF' : '#E65100' }
                ]}>
                    Offline Mode: Logs will be saved locally and synced later.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    },
});
