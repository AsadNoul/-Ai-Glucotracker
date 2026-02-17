import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function App() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>GlucoTrack AI</Text>
            <Text style={styles.subtitle}>Loading...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f1923',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#888',
        fontSize: 16,
        marginTop: 10,
    },
});

registerRootComponent(App);
