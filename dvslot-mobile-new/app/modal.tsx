import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ModalScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Modal</Text>
			<Text style={styles.subtitle}>This is a placeholder modal screen.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		padding: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: '#6b7280',
	},
});

