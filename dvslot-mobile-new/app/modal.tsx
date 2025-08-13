import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Expo Router requires a default export React component
const Page: React.FC = () => {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Alerts</Text>
			<Text style={styles.subtitle}>This is a placeholder alerts modal.</Text>
		</View>
	);
};

export default Page;

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

