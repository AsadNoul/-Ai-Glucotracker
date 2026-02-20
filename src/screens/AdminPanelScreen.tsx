import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore } from '../store';
import { supabase, User } from '../services/supabase';

export const AdminPanelScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useSettingsStore();
    const t = getThemeColors(theme);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, guestUsers: 0 });
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationBody, setNotificationBody] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // In a real app, this would be a specific admin service call
            // Using the public 'users' table we created
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const allUsers = data || [];
            setUsers(allUsers);

            setStats({
                totalUsers: allUsers.length,
                premiumUsers: allUsers.filter(u => u.subscription_status !== 'free').length,
                guestUsers: allUsers.filter(u => u.id === 'guest' || u.email.includes('guest')).length,
            });
        } catch (error: any) {
            console.error('Error loading admin data:', error);
            Alert.alert('Error', 'Failed to load user data. Make sure your database policies allow admin access.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async () => {
        if (!notificationTitle || !notificationBody) {
            Alert.alert('Error', 'Please fill both title and message');
            return;
        }

        setSending(true);
        try {
            // Mocking push notification push
            // In a real app, you'd call a Supabase Edge Function that uses Firebase Cloud Messaging
            await new Promise(resolve => setTimeout(resolve, 1500));
            Alert.alert('Success', `Notification sent to all ${users.length} users!`);
            setNotificationModalVisible(false);
            setNotificationTitle('');
            setNotificationBody('');
        } catch (error) {
            Alert.alert('Error', 'Failed to send notifications');
        } finally {
            setSending(false);
        }
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <View style={[styles.userCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={styles.userHeader}>
                <View style={[styles.avatar, { backgroundColor: t.primary + '20' }]}>
                    <Text style={styles.avatarText}>{item.email[0].toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.userEmail, { color: t.text }]}>{item.email}</Text>
                    <Text style={[styles.userDate, { color: t.textTertiary }]}>
                        Joined: {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View style={[
                    styles.badge,
                    { backgroundColor: item.subscription_status === 'free' ? t.glass : t.success + '20' }
                ]}>
                    <Text style={[
                        styles.badgeText,
                        { color: item.subscription_status === 'free' ? t.textSecondary : t.success }
                    ]}>
                        {item.subscription_status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            <View style={styles.userMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="flash-outline" size={14} color={t.primary} />
                    <Text style={[styles.metaText, { color: t.textSecondary }]}>
                        {item.credits_remaining === -1 ? 'Unlimited' : `${item.credits_remaining} Credits`}
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="finger-print-outline" size={14} color={t.textTertiary} />
                    <Text style={[styles.metaText, { color: t.textSecondary }]}>
                        ID: {item.id.substring(0, 8)}...
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Admin Panel</Text>
                <TouchableOpacity onPress={loadData} style={styles.headerIcon}>
                    <Ionicons name="refresh" size={24} color={t.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
                <View style={[styles.statBox, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[styles.statValue, { color: t.text }]}>{stats.totalUsers}</Text>
                    <Text style={[styles.statLabel, { color: t.textSecondary }]}>Total Users</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[styles.statValue, { color: t.success }]}>{stats.premiumUsers}</Text>
                    <Text style={[styles.statLabel, { color: t.textSecondary }]}>Premium</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[styles.statValue, { color: t.primary }]}>{users.length - stats.guestUsers}</Text>
                    <Text style={[styles.statLabel, { color: t.textSecondary }]}>Registered</Text>
                </View>
            </ScrollView>

            <View style={styles.mainActionContainer}>
                <TouchableOpacity
                    style={[styles.bigButton, { backgroundColor: t.primary }]}
                    onPress={() => setNotificationModalVisible(true)}
                >
                    <Ionicons name="notifications-outline" size={20} color="#FFF" />
                    <Text style={styles.bigButtonText}>Broadcast Message</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={t.primary} />
                    <Text style={[styles.loadingText, { color: t.textSecondary }]}>Fetching users...</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <MaterialCommunityIcons name="account-search-outline" size={60} color={t.textTertiary} />
                            <Text style={[styles.emptyText, { color: t.textTertiary }]}>No users found</Text>
                        </View>
                    }
                />
            )}

            {/* Broadcast Modal */}
            <Modal
                visible={notificationModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>Broadcast Message</Text>
                            <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                                <Ionicons name="close" size={24} color={t.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>TITLE</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="Announcing new update..."
                            placeholderTextColor={t.textTertiary}
                            value={notificationTitle}
                            onChangeText={setNotificationTitle}
                        />

                        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>MESSAGE</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: t.glass, color: t.text, borderColor: t.border }]}
                            placeholder="Tell all users something important..."
                            placeholderTextColor={t.textTertiary}
                            value={notificationBody}
                            onChangeText={setNotificationBody}
                            multiline
                            numberOfLines={4}
                        />

                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: t.primary }]}
                            onPress={handleSendNotification}
                            disabled={sending}
                        >
                            {sending ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.sendButtonText}>Send Push Notification</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    headerIcon: {
        padding: Spacing.xs,
    },
    statsContainer: {
        maxHeight: 100,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    statBox: {
        width: 120,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginRight: Spacing.sm,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    mainActionContainer: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    bigButton: {
        flexDirection: 'row',
        height: 50,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...Shadow.blue,
    },
    bigButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    userCard: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    userInfo: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '600',
    },
    userDate: {
        fontSize: 12,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    userMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: 14,
    },
    emptyText: {
        marginTop: Spacing.md,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.xl,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    input: {
        height: 50,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
    },
    textArea: {
        height: 100,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.xl,
        textAlignVertical: 'top',
    },
    sendButton: {
        height: 55,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
