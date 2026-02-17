import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow, getThemeColors } from '../constants/Theme';
import { useSettingsStore } from '../store';

interface Article {
    id: string;
    title: string;
    emoji: string;
    category: string;
    readTime: string;
    content: string[];
    color: string;
}

const ARTICLES: Article[] = [
    {
        id: '1', title: 'Understanding Your Blood Sugar', emoji: '🩸', category: 'Basics',
        readTime: '3 min', color: '#FF5252',
        content: [
            'Blood sugar (glucose) is your body\'s primary energy source. It comes from the food you eat, particularly carbohydrates.',
            'Normal fasting blood sugar is between 70-100 mg/dL. After meals, it may rise to 140 mg/dL but should return to normal within 2-3 hours.',
            'For people with diabetes, the target range is typically 70-180 mg/dL, but your doctor may set personalized targets.',
            'Consistently high blood sugar (hyperglycemia) can damage blood vessels, nerves, and organs over time.',
            'Low blood sugar (hypoglycemia) below 70 mg/dL can cause shakiness, confusion, and in severe cases, loss of consciousness.',
            'Monitoring your blood sugar regularly helps you understand how food, exercise, stress, and medication affect your levels.',
        ],
    },
    {
        id: '2', title: 'Carb Counting Made Simple', emoji: '🍞', category: 'Nutrition',
        readTime: '4 min', color: '#FF9800',
        content: [
            'Carbohydrates have the biggest impact on blood sugar. Learning to count them helps you manage glucose levels.',
            'One "carb serving" equals about 15 grams of carbohydrates. Most meals contain 3-5 carb servings (45-75g).',
            'Read nutrition labels: look at "Total Carbohydrate" per serving. Watch out for serving sizes — they may differ from what you eat.',
            'Common carb counts: 1 slice of bread ≈ 15g, 1 medium apple ≈ 25g, 1 cup rice ≈ 45g, 1 can soda ≈ 39g.',
            'Fiber is a carbohydrate that doesn\'t raise blood sugar. If a food has 5+ grams of fiber, subtract half the fiber from total carbs.',
            'Pair carbs with protein and healthy fats to slow digestion and prevent spikes. For example, apple + peanut butter instead of apple alone.',
            'The Glycemic Index (GI) ranks foods by how quickly they raise blood sugar. Choose low-GI foods (beans, whole grains, most vegetables) over high-GI foods (white bread, sugary drinks).',
        ],
    },
    {
        id: '3', title: 'Exercise & Blood Sugar', emoji: '🏃', category: 'Activity',
        readTime: '3 min', color: '#4CAF50',
        content: [
            'Exercise is one of the most powerful tools for managing diabetes. It helps your body use insulin more effectively.',
            'Aerobic exercise (walking, swimming, cycling) typically lowers blood sugar during and after the activity.',
            'Strength training (weights, resistance bands) improves insulin sensitivity over time, even when you\'re not exercising.',
            'Aim for at least 150 minutes of moderate exercise per week. Even 10-minute walks after meals can significantly reduce spikes.',
            'Check your blood sugar before and after exercise. If below 100 mg/dL before starting, eat a small snack (15g carbs).',
            'Stay hydrated! Dehydration can raise blood sugar levels. Drink water before, during, and after exercise.',
            'High-intensity exercise may temporarily raise blood sugar. This is normal and usually comes down within a few hours.',
        ],
    },
    {
        id: '4', title: 'Medications & Insulin Guide', emoji: '💊', category: 'Treatment',
        readTime: '5 min', color: '#7B61FF',
        content: [
            'Metformin is the most common first-line medication for Type 2 diabetes. It reduces glucose production in the liver and improves insulin sensitivity.',
            'Sulfonylureas (Glimepiride, Glipizide) stimulate the pancreas to produce more insulin. They can cause low blood sugar if you skip meals.',
            'SGLT2 inhibitors (Jardiance, Farxiga) help kidneys remove excess sugar through urine. They also have heart and kidney protection benefits.',
            'GLP-1 agonists (Ozempic, Trulicity) slow digestion, reduce appetite, and help the body produce insulin when needed. Given as weekly injections.',
            'Insulin types: Rapid-acting (Humalog, NovoLog) works in 15 minutes; Long-acting (Lantus, Levemir) provides 24-hour background coverage.',
            'Always take medications as prescribed. Never adjust insulin doses without consulting your healthcare provider.',
            'Store insulin properly: unopened vials in the refrigerator, opened vials at room temperature for up to 28 days.',
        ],
    },
    {
        id: '5', title: 'Handling Hypoglycemia', emoji: '⚠️', category: 'Emergency',
        readTime: '2 min', color: '#F44336',
        content: [
            'Hypoglycemia (low blood sugar below 70 mg/dL) is a medical situation that needs immediate attention.',
            'Symptoms include: shaking, sweating, fast heartbeat, dizziness, hunger, confusion, irritability, and blurred vision.',
            'Use the 15-15 Rule: Eat 15 grams of fast-acting carbs (4 glucose tablets, 4 oz juice, or 1 tbsp sugar). Wait 15 minutes and recheck.',
            'If still low after 15 minutes, repeat the treatment. Once blood sugar is above 70, eat a balanced snack to prevent another drop.',
            'Severe hypoglycemia (unable to eat or unconscious): This is an EMERGENCY. Someone should administer glucagon and call 911.',
            'Always carry fast-acting glucose with you. Tell friends and family how to help you during a low blood sugar episode.',
            'Common causes: too much insulin, skipping meals, unexpected exercise, or drinking alcohol on an empty stomach.',
        ],
    },
    {
        id: '6', title: 'Stress & Diabetes', emoji: '🧘', category: 'Wellness',
        readTime: '3 min', color: '#00BCD4',
        content: [
            'Stress hormones (cortisol, adrenaline) cause your liver to release stored glucose, raising blood sugar levels.',
            'Chronic stress can make blood sugar harder to control, even with proper diet and medication.',
            'Techniques that help: deep breathing (4-7-8 method), progressive muscle relaxation, meditation, and gentle yoga.',
            'Sleep is crucial. Poor sleep raises cortisol and insulin resistance. Aim for 7-9 hours of quality sleep each night.',
            'Social connection matters. Diabetes burnout is real. Join support groups, talk to loved ones, or consider counseling.',
            'Track your mood alongside glucose readings. You may notice patterns between stress and blood sugar spikes.',
            'Remember: it\'s okay to have imperfect days. Managing diabetes is a marathon, not a sprint.',
        ],
    },
    {
        id: '7', title: 'A1C: What It Means', emoji: '📊', category: 'Basics',
        readTime: '2 min', color: '#2196F3',
        content: [
            'A1C (HbA1c) measures your average blood sugar over the past 2-3 months. It reflects how well your diabetes is managed overall.',
            'A1C targets: Normal (<5.7%), Prediabetes (5.7-6.4%), Diabetes (6.5%+). Most people with diabetes aim for below 7%.',
            'Each 1% change in A1C equals roughly a 28 mg/dL change in average blood sugar. A1C of 7% ≈ average glucose of 154 mg/dL.',
            'A1C doesn\'t show daily highs and lows. You can have a "good" A1C but still have dangerous glucose fluctuations.',
            'Time in Range (TIR) is becoming an important metric alongside A1C. Aim for 70%+ of readings between 70-180 mg/dL.',
            'Get your A1C checked every 3-6 months. Use it as a trend indicator, not a report card.',
        ],
    },
    {
        id: '8', title: 'Smart Snacking Tips', emoji: '🥜', category: 'Nutrition',
        readTime: '3 min', color: '#8BC34A',
        content: [
            'Smart snacks combine protein + fiber + healthy fat to keep blood sugar stable between meals.',
            'Best snacks: almonds (1 oz = 6g carbs), cheese + whole grain crackers, Greek yogurt, celery + peanut butter, hard-boiled eggs.',
            'Avoid: fruit juice, candy, chips, white crackers, and granola bars (most have 20-30g of sugar).',
            'If you crave sweets, try: dark chocolate (1 oz = 13g carbs), berries with whipped cream, or sugar-free options.',
            'Bedtime snack can prevent overnight lows: try a small handful of nuts, cheese stick, or half a peanut butter sandwich.',
            'Post-exercise snack should include both carbs and protein to replenish glycogen and support muscle recovery.',
        ],
    },
];

const CATEGORIES = ['All', 'Basics', 'Nutrition', 'Activity', 'Treatment', 'Emergency', 'Wellness'];

export const EducationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useSettingsStore();
    const t = getThemeColors(theme);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    const filteredArticles = selectedCategory === 'All'
        ? ARTICLES
        : ARTICLES.filter(a => a.category === selectedCategory);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: t.glass }]}>
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text }]}>Learn</Text>
                <View style={{ width: 42 }} />
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={styles.catContent}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat}
                        style={[styles.catChip, selectedCategory === cat && { backgroundColor: t.primary }]}
                        onPress={() => setSelectedCategory(cat)}>
                        <Text style={[styles.catText, { color: selectedCategory === cat ? '#FFF' : t.textSecondary }]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Featured Card */}
                <TouchableOpacity
                    style={[styles.featuredCard, { backgroundColor: '#7B61FF15', borderColor: '#7B61FF30' }]}
                    onPress={() => setSelectedArticle(ARTICLES[4])}
                >
                    <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={[styles.featuredBadgeText, { color: '#FFD700' }]}>ESSENTIAL READING</Text>
                    </View>
                    <Text style={[styles.featuredTitle, { color: t.text }]}>⚠️ Handling Hypoglycemia</Text>
                    <Text style={[styles.featuredDesc, { color: t.textSecondary }]}>
                        Know the 15-15 Rule and what to do in an emergency. This could save your life.
                    </Text>
                    <View style={styles.featuredMeta}>
                        <Ionicons name="time-outline" size={14} color={t.textTertiary} />
                        <Text style={[styles.featuredMetaText, { color: t.textTertiary }]}>2 min read</Text>
                    </View>
                </TouchableOpacity>

                {/* Article Grid */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>
                    📚 {selectedCategory === 'All' ? 'ALL ARTICLES' : selectedCategory.toUpperCase()} ({filteredArticles.length})
                </Text>

                {filteredArticles.map(article => (
                    <TouchableOpacity key={article.id}
                        style={[styles.articleCard, { backgroundColor: t.card, borderColor: t.border }]}
                        onPress={() => setSelectedArticle(article)}>
                        <View style={[styles.articleIconBox, { backgroundColor: article.color + '15' }]}>
                            <Text style={styles.articleEmoji}>{article.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.articleTitle, { color: t.text }]}>{article.title}</Text>
                            <View style={styles.articleMeta}>
                                <View style={[styles.catTag, { backgroundColor: article.color + '15' }]}>
                                    <Text style={[styles.catTagText, { color: article.color }]}>{article.category}</Text>
                                </View>
                                <Text style={[styles.readTime, { color: t.textTertiary }]}>{article.readTime}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={t.textTertiary} />
                    </TouchableOpacity>
                ))}

                {/* Diabetes Myths */}
                <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: Spacing.xl }]}>💡 QUICK FACTS</Text>
                {[
                    { myth: '"Sugar causes diabetes"', fact: 'Type 1 is autoimmune. Type 2 involves genetics, weight, and lifestyle — not just sugar intake.' },
                    { myth: '"You can\'t eat fruit"', fact: 'Fruits are fine! Choose whole fruits over juice. Berries, apples, and pears are low-GI options.' },
                    { myth: '"Insulin means you failed"', fact: 'Insulin is a tool, not a failure. Many people need it because diabetes is progressive.' },
                    { myth: '"Only old people get it"', fact: 'Type 2 is increasingly common in young adults and teens. Type 1 can start at any age.' },
                ].map((item, i) => (
                    <View key={i} style={[styles.mythCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Text style={[styles.mythLabel, { color: t.error }]}>❌ MYTH: {item.myth}</Text>
                        <Text style={[styles.factLabel, { color: '#4CAF50' }]}>✅ FACT: {item.fact}</Text>
                    </View>
                ))}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Article Reader Modal */}
            <Modal animationType="slide" transparent visible={!!selectedArticle} onRequestClose={() => setSelectedArticle(null)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                <Text style={{ fontSize: 28 }}>{selectedArticle?.emoji}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.modalCat, { color: selectedArticle?.color }]}>{selectedArticle?.category.toUpperCase()}</Text>
                                    <Text style={[styles.modalTitle, { color: t.text }]} numberOfLines={2}>{selectedArticle?.title}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedArticle(null)}>
                                <Ionicons name="close-circle" size={28} color={t.textTertiary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {selectedArticle?.content.map((para, i) => (
                                <View key={i} style={styles.paraBullet}>
                                    <View style={[styles.paraDot, { backgroundColor: selectedArticle.color }]} />
                                    <Text style={[styles.paraText, { color: t.text }]}>{para}</Text>
                                </View>
                            ))}
                            <View style={[styles.disclaimer, { backgroundColor: t.glass }]}>
                                <Ionicons name="information-circle" size={16} color={t.textTertiary} />
                                <Text style={[styles.disclaimerText, { color: t.textTertiary }]}>
                                    This information is for educational purposes only. Consult your healthcare provider for personalized medical advice.
                                </Text>
                            </View>
                        </ScrollView>
                        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: t.primary }]} onPress={() => setSelectedArticle(null)}>
                            <Text style={styles.doneBtnText}>Done Reading</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    backBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    catRow: { maxHeight: 44, marginBottom: Spacing.sm },
    catContent: { paddingHorizontal: Spacing.xl, gap: 8 },
    catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.round },
    catText: { fontSize: 12, fontWeight: 'bold' },
    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
    // Featured
    featuredCard: { padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, marginBottom: Spacing.xl },
    featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    featuredBadgeText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
    featuredTitle: { fontSize: Typography.sizes.xl, fontWeight: 'bold', marginBottom: 6 },
    featuredDesc: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
    featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    featuredMetaText: { fontSize: 11 },
    // Section
    sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: Spacing.md },
    // Articles
    articleCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 8, gap: Spacing.md },
    articleIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    articleEmoji: { fontSize: 24 },
    articleTitle: { fontSize: Typography.sizes.md, fontWeight: '600', marginBottom: 4 },
    articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    catTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.round },
    catTagText: { fontSize: 9, fontWeight: 'bold' },
    readTime: { fontSize: 10 },
    // Myths
    mythCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 8, gap: 6 },
    mythLabel: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
    factLabel: { fontSize: 13, lineHeight: 20 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, maxHeight: '90%', borderWidth: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.xl },
    modalCat: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
    modalTitle: { fontSize: Typography.sizes.lg, fontWeight: 'bold', marginTop: 2 },
    modalBody: { marginBottom: Spacing.lg },
    paraBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.lg },
    paraDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
    paraText: { flex: 1, fontSize: Typography.sizes.md, lineHeight: 22 },
    disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
    disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
    doneBtn: { height: 50, borderRadius: BorderRadius.xl, justifyContent: 'center', alignItems: 'center' },
    doneBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
