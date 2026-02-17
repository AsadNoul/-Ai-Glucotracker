import { userService } from './supabase';

/**
 * AI Carb Estimation Service
 * This is a placeholder implementation that simulates AI food recognition
 * In production, replace this with actual ML API (Google Vision AI, Clarifai, etc.)
 */

interface CarbEstimationResult {
    foodName: string;
    estimatedCarbs: number;
    confidence: number;
    suggestions: string[];
}

export const aiService = {
    /**
     * Simulate AI carb estimation from image
     * In production: Call actual ML API with image data
     */
    estimateCarbsFromImage: async (imageUri: string): Promise<CarbEstimationResult> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate random carb estimation
        // In production, this would call your ML model
        const foodSamples = [
            { name: 'Rice Bowl', carbs: 45, suggestions: ['Consider brown rice for lower GI', 'Measure portions accurately'] },
            { name: 'Apple', carbs: 25, suggestions: ['Great fiber content', 'Pair with protein'] },
            { name: 'Pasta', carbs: 38, suggestions: ['Choose whole grain options', 'Watch portion size'] },
            { name: 'Bread Slice', carbs: 15, suggestions: ['Whole grain is better', 'Check for added sugars'] },
            { name: 'Banana', carbs: 27, suggestions: ['Good potassium source', 'Eat with nuts'] },
            { name: 'Oatmeal', carbs: 28, suggestions: ['Steel-cut oats are best', 'Add cinnamon for blood sugar'] },
            { name: 'Potato', carbs: 37, suggestions: ['Sweet potato is lower GI', 'Let cool before eating'] },
        ];

        const randomFood = foodSamples[Math.floor(Math.random() * foodSamples.length)];
        const variance = Math.random() * 10 - 5; // +/- 5 carbs variance

        return {
            foodName: randomFood.name,
            estimatedCarbs: Math.round(randomFood.carbs + variance),
            confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
            suggestions: randomFood.suggestions,
        };
    },

    /**
     * Check if user has credits available
     */
    checkCredits: async (userId: string): Promise<boolean> => {
        const profile = await userService.getProfile(userId);
        if (!profile) return false;

        // Premium users have unlimited credits (-1)
        if (profile.credits_remaining === -1) return true;

        return profile.credits_remaining > 0;
    },

    /**
     * Consume one AI credit
     */
    useCredit: async (userId: string): Promise<number> => {
        const profile = await userService.getProfile(userId);
        if (!profile) throw new Error('User profile not found');

        // Premium users don't consume credits
        if (profile.credits_remaining === -1) return -1;

        // Decrement credit
        const newCredits = Math.max(0, profile.credits_remaining - 1);
        await userService.updateCredits(userId, newCredits);

        return newCredits;
    },

    /**
     * Get smart meal suggestions based on time of day
     */
    getMealSuggestions: (timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string[] => {
        const suggestions = {
            breakfast: [
                'Steel-cut oatmeal with berries',
                'Greek yogurt with nuts',
                'Whole grain toast with avocado',
                'Vegetable omelet',
            ],
            lunch: [
                'Quinoa salad with grilled chicken',
                'Lentil soup with vegetables',
                'Mixed greens with lean protein',
                'Whole grain wrap with turkey',
            ],
            dinner: [
                'Grilled salmon with vegetables',
                'Chicken stir-fry with brown rice',
                'Zucchini noodles with lean meat',
                'Baked cod with sweet potato',
            ],
            snack: [
                'Apple with almond butter',
                'Handful of mixed nuts',
                'Celery with hummus',
                'Greek yogurt',
            ],
        };

        return suggestions[timeOfDay] || suggestions.snack;
    },

    /**
     * Analyze glucose trends and provide insights
     * This is a simple algorithm - in production, use ML models
     */
    analyzeTrends: (glucoseReadings: { value: number; time: string }[]): {
        average: number;
        timeInRange: number;
        hypoEvents: number;
        hyperEvents: number;
        insights: string[];
    } => {
        if (glucoseReadings.length === 0) {
            return {
                average: 0,
                timeInRange: 0,
                hypoEvents: 0,
                hyperEvents: 0,
                insights: ['No data available yet. Start logging your glucose readings!'],
            };
        }

        const values = glucoseReadings.map(r => r.value);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;

        const inRange = values.filter(v => v >= 70 && v <= 180).length;
        const timeInRange = (inRange / values.length) * 100;

        const hypoEvents = values.filter(v => v < 70).length;
        const hyperEvents = values.filter(v => v > 180).length;

        const insights: string[] = [];

        if (timeInRange >= 70) {
            insights.push('✅ Excellent control! Keep up the good work.');
        } else if (timeInRange >= 50) {
            insights.push('⚠️ Good progress. Focus on reducing spikes and lows.');
        } else {
            insights.push('❗ Consider discussing these readings with your healthcare provider.');
        }

        if (hypoEvents > 0) {
            insights.push(`🔽 ${hypoEvents} low reading${hypoEvents > 1 ? 's' : ''} detected. Carry fast-acting carbs.`);
        }

        if (hyperEvents > values.length * 0.3) {
            insights.push('🔼 Frequent high readings. Review carb portions and timing.');
        }

        if (average > 180) {
            insights.push('📊 Average is elevated. Consider adjusting meal plan or medication.');
        }

        return {
            average: Math.round(average),
            timeInRange: Math.round(timeInRange),
            hypoEvents,
            hyperEvents,
            insights,
        };
    },
};
