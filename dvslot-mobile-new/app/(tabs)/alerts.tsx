import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService, AuthState } from '../../services/auth-supabase';
import { supabaseApi, UserAlert } from '../../services/supabase-api';

export default function Alerts() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
      setLoading(false);
    });

    // Get initial state
    const initialState = authService.getAuthState();
    setAuthState(initialState);
    setLoading(false);

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authState?.isAuthenticated) {
      loadUserAlerts();
    }
  }, [authState?.isAuthenticated]);

  const loadUserAlerts = async () => {
    try {
      const response = await supabaseApi.getUserAlerts();
      if (response.success) {
        setUserAlerts(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (authState?.isAuthenticated) {
      await loadUserAlerts();
    }
    setRefreshing(false);
  };

  const handleDeleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await supabaseApi.deleteUserAlert(alertId);
            if (result.success) {
              setUserAlerts(prev => prev.filter(alert => alert.id !== alertId));
              Alert.alert('Success', 'Alert deleted successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete alert');
            }
          }
        }
      ]
    );
  };

  const toggleAlertStatus = async (alertId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activate' : 'deactivate';
    
    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Alert`,
      `Are you sure you want to ${actionText} this alert?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          onPress: async () => {
            // For now, just update locally since we don't have the backend API
            setUserAlerts(prev => 
              prev.map(alert => 
                alert.id === alertId 
                  ? { ...alert, status: newStatus as 'active' | 'inactive' }
                  : alert
              )
            );
            Alert.alert('Success', `Alert ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Not authenticated - show sign in prompt
  if (!authState?.isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.notAuthContainer}>
          <View style={styles.notAuthContent}>
            <Text style={styles.notAuthEmoji}>🔔</Text>
            <Text style={styles.notAuthTitle}>Sign In to View Alerts</Text>
            <Text style={styles.notAuthSubtitle}>
              Create an account to set up custom alerts for driving test slots and never miss an available appointment!
            </Text>

            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => router.push('../auth/login')}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => router.push('../auth/signup')}
              >
                <Text style={styles.signUpButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.features}>
              <Text style={styles.featuresTitle}>Alert Features:</Text>
              <Text style={styles.feature}>• 🎯 Get notified when slots become available</Text>
              <Text style={styles.feature}>• 📍 Set alerts for specific test centers</Text>
              <Text style={styles.feature}>• ⏰ Choose your preferred time slots</Text>
              <Text style={styles.feature}>• 📱 Push notifications and email alerts</Text>
              <Text style={styles.feature}>• 🔄 Automatic monitoring every 30 minutes</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Authenticated - show alerts
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔔 Your Alerts</Text>
          <Text style={styles.headerSubtitle}>
            {userAlerts.length > 0 
              ? `Managing ${userAlerts.length} alert${userAlerts.length === 1 ? '' : 's'}`
              : 'No alerts set up yet'
            }
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userAlerts.filter(alert => alert.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userAlerts.filter(alert => alert.status === 'inactive').length}
            </Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {new Set(userAlerts.map(alert => alert.test_center_id)).size}
            </Text>
            <Text style={styles.statLabel}>Centers</Text>
          </View>
        </View>

        {/* Create Alert CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Need More Alerts?</Text>
          <Text style={styles.ctaSubtitle}>
            Use the search page to find test slots and set up new alerts
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/two')}
          >
            <Text style={styles.ctaButtonText}>🔍 Search for Slots</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts List */}
        {userAlerts.length > 0 ? (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>All Alerts</Text>
            
            {userAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertStatus}>
                    <Text style={styles.alertStatusIcon}>
                      {alert.status === 'active' ? '🔔' : '⏸️'}
                    </Text>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertTitle}>Test Center Alert</Text>
                      <Text style={styles.alertSubtitle}>
                        {alert.status === 'active' ? 'Actively monitoring' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.alertActions}>
                    <TouchableOpacity
                      onPress={() => toggleAlertStatus(alert.id, alert.status)}
                      style={[
                        styles.actionButton,
                        alert.status === 'active' ? styles.pauseButton : styles.activateButton
                      ]}
                    >
                      <Text style={styles.actionButtonText}>
                        {alert.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleDeleteAlert(alert.id)}
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.alertDetails}>
                  <Text style={styles.alertDetailText}>
                    📍 Test Center ID: {alert.test_center_id}
                  </Text>
                  <Text style={styles.alertDetailText}>
                    📅 Created: {new Date(alert.created_at).toLocaleDateString()}
                  </Text>
                  {alert.updated_at && (
                    <Text style={styles.alertDetailText}>
                      🔄 Last updated: {new Date(alert.updated_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noAlertsSection}>
            <Text style={styles.noAlertsEmoji}>📭</Text>
            <Text style={styles.noAlertsTitle}>No Alerts Yet</Text>
            <Text style={styles.noAlertsText}>
              Create your first alert by searching for test slots and clicking the "Set Alert" button
            </Text>
            
            <TouchableOpacity
              style={styles.createAlertButton}
              onPress={() => router.push('/two')}
            >
              <Text style={styles.createAlertButtonText}>Create Your First Alert</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 How Alerts Work</Text>
          <Text style={styles.helpText}>• Alerts check for new slots every 30 minutes</Text>
          <Text style={styles.helpText}>• You'll get push notifications when slots are found</Text>
          <Text style={styles.helpText}>• Alerts run 24/7 automatically in the background</Text>
          <Text style={styles.helpText}>• Pause alerts anytime to stop notifications</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  ctaSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  alertsSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertStatusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  activateButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButtonText: {
    fontSize: 14,
  },
  alertDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  alertDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  noAlertsSection: {
    margin: 20,
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  noAlertsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noAlertsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createAlertButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  createAlertButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  // Not authenticated styles
  notAuthContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  notAuthContent: {
    alignItems: 'center',
  },
  notAuthEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  notAuthTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  notAuthSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  authButtons: {
    width: '100%',
    marginBottom: 30,
  },
  signInButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  features: {
    alignItems: 'flex-start',
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
});
