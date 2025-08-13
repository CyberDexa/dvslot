import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function BackendLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      if (res.success) {
        Alert.alert('Connected', 'Alerts backend connected successfully');
        router.back();
      } else {
        Alert.alert('Login Failed', res.error || 'Please check your credentials');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to connect to alerts backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Alerts</Text>
            <Text style={styles.subtitle}>Sign in to the alerts backend to manage subscriptions</Text>
            <Text style={styles.emoji}>🔐</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.backToApp}>
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Text style={styles.backToAppText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  emoji: { fontSize: 44, marginTop: 8 },
  form: { marginTop: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  loginButtonDisabled: { backgroundColor: '#9ca3af' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backToApp: { alignItems: 'center', marginTop: 16 },
  backToAppText: { color: '#6b7280', fontSize: 14 },
});
