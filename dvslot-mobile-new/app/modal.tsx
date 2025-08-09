import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, UserAlert } from '../services/api';
import { authService } from '../services/auth';

export default function AlertsModal() {
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated) {
        // Show demo alerts for guest users
        setAlerts([
          {
            id: 'demo-1',
            type: 'new_slot',
            title: 'New Slot Available',
            description: 'Test slot found at Croydon Test Centre - March 15, 2025',
            isActive: true,
            created: '2 hours ago'
          },
          {
            id: 'demo-2',
            type: 'cancellation',
            title: 'Cancellation Alert',
            description: 'Earlier slot available at Wimbledon - March 8, 2025',
            isActive: true,
            created: '5 hours ago'
          }
        ]);
        return;
      }

      // Load real alerts for authenticated users
      try {
        const response = await api.getUserAlerts();
        if (response.success && response.data) {
          setAlerts(response.data);
        } else {
          console.error('Failed to load alerts:', response.error);
          // Show empty state instead of demo data for authenticated users
          setAlerts([]);
        }
      } catch (apiError) {
        console.error('API Error loading alerts:', apiError);
        // Show empty state for authenticated users on API error
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotificationSettings = async (type: 'push' | 'email', value: boolean) => {
    setIsSaving(true);
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated) {
        // For guest users, just update local state
        if (type === 'push') setPushEnabled(value);
        if (type === 'email') setEmailEnabled(value);
        Alert.alert('Settings Updated', 'Sign in to save your preferences permanently.');
        return;
      }

      // Update settings via API for authenticated users
      const currentUser = authState.user;
      if (currentUser) {
        const updatedSettings = {
          ...currentUser.notificationSettings,
          pushNotifications: type === 'push' ? value : currentUser.notificationSettings.pushNotifications,
          emailNotifications: type === 'email' ? value : currentUser.notificationSettings.emailNotifications,
        };

        const result = await authService.updateProfile({
          notificationSettings: updatedSettings
        });

        if (result.success) {
          if (type === 'push') setPushEnabled(value);
          if (type === 'email') setEmailEnabled(value);
        } else {
          Alert.alert('Error', 'Failed to update notification settings');
        }
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const createNewAlert = async () => {
    Alert.alert(
      'Create New Alert',
      'Choose alert type:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'New Slots',
          onPress: () => {
            // In a real app, this would open a form to create a new slot alert
            Alert.alert('New Alert', 'Create new slot alert feature will be implemented');
          }
        },
        {
          text: 'Cancellations',
          onPress: () => {
            Alert.alert('New Alert', 'Create cancellation alert feature will be implemented');
          }
        }
      ]
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'new_slot': return '🆕';
      case 'cancellation': return '⏰';
      case 'price_drop': return '💰';
      default: return '🔔';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'new_slot': return '#10B981';
      case 'cancellation': return '#F59E0B';
      case 'price_drop': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🔔 Alerts</Text>
          <Text style={styles.subtitle}>Stay updated with test slot notifications</Text>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Get instant alerts on your phone
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(value) => updateNotificationSettings('push', value)}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              disabled={isSaving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts via email
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={(value) => updateNotificationSettings('email', value)}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              disabled={isSaving}
            />
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={createNewAlert}
            >
              <Text style={styles.addButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#3B82F6" />
              <Text style={styles.loadingText}>Loading alerts...</Text>
            </View>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertIconContainer}>
                    <Text style={styles.alertEmoji}>{getAlertIcon(alert.type)}</Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDescription}>{alert.description}</Text>
                    <Text style={styles.alertTime}>{alert.created}</Text>
                  </View>
                  <View
                    style={[
                      styles.alertStatus,
                      { backgroundColor: alert.isActive ? getAlertColor(alert.type) : '#9CA3AF' }
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Alerts Yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first alert to get notified about available test slots
              </Text>
              <TouchableOpacity 
                style={styles.createFirstAlertButton}
                onPress={createNewAlert}
              >
                <Text style={styles.createFirstAlertText}>Create Alert</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  createFirstAlertButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  createFirstAlertText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertEmoji: {
    fontSize: 18,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  alertStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 8,
  },
});
