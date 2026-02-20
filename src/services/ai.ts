export interface GlucoseReading {
    value: number;
    time: string;
}

export interface CarbLog {
    name: string;
    carbs: number;
    time: string;
}

export const AIService = {
    /**
     * Analyzes glucose trends to predict the next reading
     */
    predictNextReading: (recentReadings: GlucoseReading[], recentCarbs: CarbLog[]) => {
        if (recentReadings.length < 2) return null;

        const latest = recentReadings[0];
        const prev = recentReadings[1];

        // Simple linear trend
        let trend = (latest.value - prev.value);

        // Carb impact prediction (simplified)
        // Assume 1g carb raises glucose by ~2-5 mg/dL depending on GI
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const recentCarbTotal = recentCarbs
            .filter(c => new Date(c.time) > oneHourAgo)
            .reduce((sum, c) => sum + c.carbs, 0);

        const carbImpact = recentCarbTotal * 1.5; // Estimated impact coefficient

        const prediction = Math.round(latest.value + trend + carbImpact);

        return {
            predictedValue: Math.max(40, Math.min(400, prediction)),
            trend: trend > 2 ? 'rising' : trend < -2 ? 'falling' : 'stable',
            timestamp: new Date(now.getTime() + 30 * 60 * 1000).toISOString() // 30 min prediction
        };
    },

    /**
     * Identifies patterns in the user's data (e.g., "Always high after Friday dinner")
     */
    identifyPatterns: (glucoseLogs: any[], carbLogs: any[]) => {
        const insights = [];

        // Peak Time Analysis
        const morningHighs = glucoseLogs.filter(l => {
            const h = new Date(l.reading_time).getHours();
            return h >= 5 && h < 9 && l.glucose_value > 140;
        });

        if (morningHighs.length >= 3) {
            insights.push({
                type: 'pattern',
                title: 'Dawn Phenomenon Detected',
                description: 'You tend to have higher readings in the early morning. This is common and often related to overnight hormone changes.',
                impact: 'high'
            });
        }

        // Post-Meal Spike Analysis
        const spikes = [];
        carbLogs.forEach(meal => {
            const mealTime = new Date(meal.created_at);
            const peakTime = new Date(mealTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours post

            const postMealLog = glucoseLogs.find(l => {
                const logTime = new Date(l.reading_time);
                return logTime > mealTime && logTime <= peakTime && l.glucose_value > 180;
            });

            if (postMealLog) {
                spikes.push(meal.food_name);
            }
        });

        if (spikes.length > 0) {
            const commonTrigger = spikes[0]; // Simplified: just take the first
            insights.push({
                type: 'trigger',
                title: 'Spike Trigger Identified',
                description: `We noticed a spike after eating ${commonTrigger}. Consider a smaller portion or pairing it with fiber.`,
                impact: 'medium'
            });
        }

        return insights;
    },

    /**
     * Suggests a glycemic-friendly alternative
     */
    getSuggestion: (foodName: string) => {
        const substitutes: { [key: string]: string } = {
            'White Rice': 'Brown Rice or Cauliflower Rice',
            'White Bread': 'Whole Grain or Sourdough',
            'Soda': 'Sparkling Water with Lemon',
            'Pasta': 'Zucchini Noodles or Chickpea Pasta',
            'Fruit Juice': 'Whole Fruit (e.g., Apple or Berries)'
        };

        return substitutes[foodName] || null;
    }
};
