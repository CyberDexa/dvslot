import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService, AuthState, UserProfile } from '../../services/auth-supabase';
import { supabaseApi, UserAlert } from '../../services/supabase-api';
import { shadowPresets } from '../../utils/shadows';

export default function Profile() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    testCentersWatching: 0,
    slotsFound: 0,
  });
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone_number: '',
  });

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
      if (state.user) {
        setProfileForm({
          full_name: state.user.full_name || '',
          phone_number: state.user.phone_number || '',
        });
      }
      setLoading(false);
    });

    // Get initial state
    const initialState = authService.getAuthState();
    setAuthState(initialState);
    if (initialState.user) {
      setProfileForm({
        full_name: initialState.user.full_name || '',
        phone_number: initialState.user.phone_number || '',
      });
    }
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
        const alerts = response.data || [];
        setUserAlerts(alerts);
        
        // Calculate stats
        const activeAlerts = alerts.filter(alert => alert.status === 'active');
        const testCenters = new Set(alerts.map(alert => alert.test_center_id));
        
        setStats({
          totalAlerts: alerts.length,
          activeAlerts: activeAlerts.length,
          testCentersWatching: testCenters.size,
          slotsFound: Math.floor(Math.random() * 50) + 10, // Placeholder - replace with real data
        });
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

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await authService.signOut();
            setLoading(false);
            
            if (result.success) {
              router.replace('/auth/login');
            } else {
              Alert.alert('Error', result.error || 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.full_name.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setLoading(true);
    const result = await authService.updateProfile({
      full_name: profileForm.full_name,
      phone_number: profileForm.phone_number,
    });
    setLoading(false);

    if (result.success) {
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
            <Text style={styles.notAuthEmoji}>👤</Text>
            <Text style={styles.notAuthTitle}>Sign In Required</Text>
            <Text style={styles.notAuthSubtitle}>
              Create an account or sign in to access your profile, alerts, and premium features
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
              <Text style={styles.featuresTitle}>What you'll get:</Text>
              <Text style={styles.feature}>• 🔔 Custom alert notifications</Text>
              <Text style={styles.feature}>• 💾 Save favorite test centers</Text>
              <Text style={styles.feature}>• 📊 Track your search history</Text>
              <Text style={styles.feature}>• ⚡ Faster slot monitoring</Text>
              <Text style={styles.feature}>• 🎯 Priority access to new slots</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Authenticated - show profile
  const user = authState.user!;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👤 Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your DVSlot account</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your DVSlot Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalAlerts}</Text>
              <Text style={styles.statLabel}>Total Alerts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeAlerts}</Text>
              <Text style={styles.statLabel}>Active Alerts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.testCentersWatching}</Text>
              <Text style={styles.statLabel}>Test Centers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.slotsFound}</Text>
              <Text style={styles.statLabel}>Slots Found</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.actionButtonIcon}>🔍</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Search for Slots</Text>
              <Text style={styles.actionButtonSubtitle}>Find available driving test slots</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/two')}
          >
            <Text style={styles.actionButtonIcon}>⚙️</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Manage Alerts</Text>
              <Text style={styles.actionButtonSubtitle}>View and edit your active alerts</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.actionButtonIcon}>📍</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Test Centers</Text>
              <Text style={styles.actionButtonSubtitle}>Browse test centers near you</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            {!editingProfile && (
              <TouchableOpacity
                onPress={() => setEditingProfile(true)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userInitial}>
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </Text>
            </View>

            {editingProfile ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={profileForm.full_name}
                    onChangeText={(text) => setProfileForm(prev => ({ ...prev, full_name: text }))}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={profileForm.phone_number}
                    onChangeText={(text) => setProfileForm(prev => ({ ...prev, phone_number: text }))}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditingProfile(false);
                      setProfileForm({
                        full_name: user.full_name || '',
                        phone_number: user.phone_number || '',
                      });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdateProfile}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user.full_name || 'Name not set'}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.phone_number && (
                  <Text style={styles.userPhone}>📞 {user.phone_number}</Text>
                )}
                <View style={styles.userRole}>
                  <Text style={styles.roleText}>
                    {user.is_premium ? '⭐ Premium User' : '👤 Free User'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Alerts ({userAlerts.length})</Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Create Alert', 'Use the search page to create new alerts by searching for test slots')}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {userAlerts.length > 0 ? (
            <View style={styles.alertsList}>
              {userAlerts.map((alert) => (
                <View key={alert.id} style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertStatus}>
                      {alert.status === 'active' ? '🔔' : '⏸️'}
                    </Text>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertTitle}>
                        Test Center Alert
                      </Text>
                      <Text style={styles.alertDate}>
                        Created {new Date(alert.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteAlert(alert.id)}
                      style={styles.deleteAlertButton}
                    >
                      <Text style={styles.deleteAlertButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noAlerts}>
              <Text style={styles.noAlertsText}>
                📭 No alerts yet. Search for test slots to create your first alert!
              </Text>
            </View>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          {!user.is_premium && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => Alert.alert('Premium Features', 'Premium features coming soon! Get priority access to new slots and advanced notifications.')}
            >
              <Text style={styles.upgradeButtonText}>⭐ Upgrade to Premium</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>🚪 Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DVSlot v1.0.0 • Built with Supabase
          </Text>
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
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  features: {
    width: '100%',
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
    textAlign: 'center',
  },
  feature: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 6,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    ...shadowPresets.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userInfo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  userRole: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  editForm: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertStatus: {
    fontSize: 20,
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
  alertDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteAlertButton: {
    padding: 8,
  },
  deleteAlertButtonText: {
    fontSize: 16,
  },
  noAlerts: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Stats Section Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    minWidth: 140,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Quick Actions Styles
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtonArrow: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 8,
  },
});
