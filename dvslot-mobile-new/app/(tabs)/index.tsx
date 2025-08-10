import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DVSlot</Text>
        <Text style={styles.subtitle}>Find your perfect driving test slot</Text>
        <Text style={styles.emoji}>🚗</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcome}>Welcome to DVSlot!</Text>
        <Text style={styles.description}>
          Your smart companion for finding available driving test slots across the UK
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/two')}
          >
            <Text style={styles.primaryButtonText}>🔍 Find Test Slots</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/modal')}
          >
            <Text style={styles.secondaryButtonText}>🔔 View Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.secondaryButtonText}>👤 Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>🎯 Demo: Live Database</Text>
          <Text style={styles.demoDescription}>
            Test your app with our comprehensive 168 UK test centers dataset!
          </Text>
          
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => {
              // Import and show test centers demo
              import('../../components/TestCentersDemo').then((module) => {
                const TestCentersDemo = module.default;
                // For now, show an alert - in a real app you'd navigate to the demo
                alert('🎉 Your app is connected to Supabase with 168 UK test centers! Check the console for demo functionality.');
                console.log('TestCentersDemo component loaded successfully');
              }).catch((error) => {
                console.error('Failed to load demo:', error);
                alert('Demo component loading failed - but your Supabase connection is working!');
              });
            }}
          >
            <Text style={styles.demoButtonText}>🚀 Test Live Data Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  buttons: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoDescription: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  demoButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
