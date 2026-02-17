// Theme colors and design tokens for CarbTrack (Premium UI)
export const Colors = {
    // Branding
    primary: '#0A85FF',
    secondary: '#1A2332',
    accent: '#7B61FF',

    // Backgrounds
    background: {
        dark: '#0A0B0F',
        darkCard: '#1A1B2E',
        light: '#F2F7FA',
        lightCard: '#FFFFFF',
    },

    // Status
    status: {
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#FF5252',
        info: '#0A85FF',
    },

    // Text
    text: {
        onDark: {
            primary: '#FFFFFF',
            secondary: '#A0A0B0',
            tertiary: '#6B6B7B',
        },
        onLight: {
            primary: '#121318',
            secondary: '#505060',
            tertiary: '#808090',
        }
    },

    // Glass/Transparency
    glass: {
        white: 'rgba(255, 255, 255, 0.1)',
        dark: 'rgba(0, 0, 0, 0.2)',
        border: 'rgba(255, 255, 255, 0.15)',
    }
};

export type ThemeType = 'light' | 'dark';

export const getThemeColors = (theme: ThemeType) => {
    const isDark = theme === 'dark';
    return {
        background: isDark ? Colors.background.dark : Colors.background.light,
        card: isDark ? Colors.background.darkCard : Colors.background.lightCard,
        text: isDark ? Colors.text.onDark.primary : Colors.text.onLight.primary,
        textSecondary: isDark ? Colors.text.onDark.secondary : Colors.text.onLight.secondary,
        textTertiary: isDark ? Colors.text.onDark.tertiary : Colors.text.onLight.tertiary,
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        glass: isDark ? Colors.glass.white : 'rgba(0, 0, 0, 0.03)',
        primary: Colors.primary,
        secondary: Colors.secondary,
        accent: Colors.accent,
        success: Colors.status.success,
        error: Colors.status.error,
        warning: Colors.status.warning,
    };
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

export const BorderRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 25,
    round: 999,
};

export const Typography = {
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        xxxl: 32,
        huge: 40,
    },
    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
};

export const Shadow = {
    light: {
        shadowColor: 'rgba(0, 0, 0, 0.04)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
    },
    medium: {
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 4,
    },
    dark: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 8,
    },
    blue: {
        shadowColor: '#0A85FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    }
};

