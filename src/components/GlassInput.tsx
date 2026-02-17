import React from 'react';
import {
    TextInput,
    Text,
    View,
    StyleSheet,
    TextInputProps
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../constants/Theme';

interface GlassInputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({
    label,
    error,
    icon,
    style,
    ...props
}) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={[
                styles.inputContainer,
                error ? styles.inputError : null
            ]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}

                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={Colors.text.onDark.tertiary}
                    keyboardAppearance="dark"
                    {...props}
                />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 11,
        fontWeight: Typography.weights.bold,
        color: Colors.text.onDark.tertiary,
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.darkCard,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        height: 56,
        borderWidth: 1,
        borderColor: Colors.glass.border,
    },
    inputError: {
        borderColor: '#FF5252',
    },
    iconContainer: {
        marginRight: Spacing.md,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: Typography.sizes.md,
        height: '100%',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },
});
