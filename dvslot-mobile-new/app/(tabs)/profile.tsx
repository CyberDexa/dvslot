import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService, AuthState } from '../../services/auth';
import { api, UserProfile } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddCenterModal, setShowAddCenterModal] = useState(false);
  const [newCenterName, setNewCenterName] = useState('');
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    // Initialize auth service and get current user
    const initializeAuth = async () => {
      try {
        const currentState = await authService.initialize();
        setAuthState(currentState);
        
        if (currentState.user) {
          setEditedProfile(currentState.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // For demo purposes, set up a guest user
        await authService.guestLogin();
        setAuthState(authService.getAuthState());
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = authService.addListener((newState) => {
      setAuthState(newState);
      if (newState.user) {
        setEditedProfile(newState.user);
      }
    });

    return unsubscribe;
  }, []);

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    setIsSaving(true);
    try {
      const result = await authService.updateProfile(editedProfile);
      
      if (result.success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Network error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (authState.user) {
      setEditedProfile(authState.user);
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              // Navigate to login screen (you may want to implement this)
              Alert.alert('Logged out', 'You have been logged out successfully');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          }
        }
      ]
    );
  };

  const updateNotificationSetting = async (key: keyof NonNullable<UserProfile['notificationSettings']>, value: boolean) => {
    // Always update the editedProfile state for immediate UI feedback
    setEditedProfile(prev => ({
      ...prev,
      notificationSettings: {
        pushNotifications: prev.notificationSettings?.pushNotifications ?? false,
        emailNotifications: prev.notificationSettings?.emailNotifications ?? false,
        smsNotifications: prev.notificationSettings?.smsNotifications ?? false,
        [key]: value
      }
    }));

    // If we're not in edit mode, immediately save the changes
    if (!isEditing) {
      try {
        const currentUser = authState.user;
        if (currentUser) {
          const updatedSettings = {
            pushNotifications: currentUser.notificationSettings?.pushNotifications ?? false,
            emailNotifications: currentUser.notificationSettings?.emailNotifications ?? false,
            smsNotifications: currentUser.notificationSettings?.smsNotifications ?? false,
            [key]: value
          };

          const result = await authService.updateProfile({
            notificationSettings: updatedSettings
          });

          if (!result.success) {
            // Revert the state if the update failed
            setEditedProfile(prev => ({
              ...prev,
              notificationSettings: {
                pushNotifications: prev.notificationSettings?.pushNotifications ?? false,
                emailNotifications: prev.notificationSettings?.emailNotifications ?? false,
                smsNotifications: prev.notificationSettings?.smsNotifications ?? false,
                [key]: !value // revert the change
              }
            }));
            Alert.alert('Error', result.message || 'Failed to update notification settings');
          }
        }
      } catch (error) {
        console.error('Error updating notification settings:', error);
        // Revert the state if there was an error
        setEditedProfile(prev => ({
          ...prev,
          notificationSettings: {
            pushNotifications: prev.notificationSettings?.pushNotifications ?? false,
            emailNotifications: prev.notificationSettings?.emailNotifications ?? false,
            smsNotifications: prev.notificationSettings?.smsNotifications ?? false,
            [key]: !value // revert the change
          }
        }));
        Alert.alert('Error', 'Network error occurred while updating settings');
      }
    }
  };

  const handleContactSupport = async () => {
    Alert.alert(
      'Contact Support',
      'How would you like to get help?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email Support', 
          onPress: () => {
            // In a real app, this would open the email client
            Alert.alert('Support', 'Please email us at support@dvslot.com');
          }
        },
        {
          text: 'Submit Feedback',
          onPress: () => {
            // Navigate to feedback form or show modal
            Alert.alert('Feedback', 'Thank you for wanting to provide feedback!');
          }
        }
      ]
    );
  };

  const handleAddTestCenter = () => {
    if (!isEditing) return;
    setShowAddCenterModal(true);
  };

  const handleConfirmAddCenter = () => {
    if (!newCenterName.trim()) return;
    
    setEditedProfile((prev) => ({
      ...prev,
      preferredTestCenters: [
        ...(prev.preferredTestCenters || []),
        newCenterName.trim(),
      ],
    }));
    
    setNewCenterName('');
    setShowAddCenterModal(false);
  };

  const handleRemoveTestCenter = (centerName: string) => {
    if (!isEditing) return;
    
    setEditedProfile((prev) => ({
      ...prev,
      preferredTestCenters: (prev.preferredTestCenters || []).filter(
        (center) => center !== centerName
      ),
    }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedTitle}>Not Signed In</Text>
          <Text style={styles.notAuthenticatedText}>
            Please sign in to view and manage your profile.
          </Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => {
              // Navigate to auth screen
              router.push('/auth');
            }}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const user = authState.user;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileField}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.name || ''}
                onChangeText={(text) => setEditedProfile(prev => ({...prev, name: text}))}
              />
            ) : (
              <Text style={styles.fieldValue}>{user.name}</Text>
            )}
          </View>

          <View style={styles.profileField}>
            <Text style={styles.fieldLabel}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.email || ''}
                onChangeText={(text) => setEditedProfile(prev => ({...prev, email: text}))}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.fieldValue}>{user.email}</Text>
            )}
          </View>

          <View style={styles.profileField}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.phone || ''}
                onChangeText={(text) => setEditedProfile(prev => ({...prev, phone: text}))}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{user.phone || 'Not provided'}</Text>
            )}
          </View>

          <View style={styles.profileField}>
            <Text style={styles.fieldLabel}>License Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.licenseNumber || ''}
                onChangeText={(text) => setEditedProfile(prev => ({...prev, licenseNumber: text}))}
              />
            ) : (
              <Text style={styles.fieldValue}>{user.licenseNumber || 'Not provided'}</Text>
            )}
          </View>

          {isEditing && (
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Get instant alerts on your device
              </Text>
            </View>
            <Switch
              value={isEditing 
                ? (editedProfile.notificationSettings?.pushNotifications ?? false)
                : (user.notificationSettings?.pushNotifications ?? false)
              }
              onValueChange={(value) => {
                updateNotificationSetting('pushNotifications', value);
              }}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive updates via email
              </Text>
            </View>
            <Switch
              value={isEditing 
                ? (editedProfile.notificationSettings?.emailNotifications ?? false)
                : (user.notificationSettings?.emailNotifications ?? false)
              }
              onValueChange={(value) => {
                updateNotificationSetting('emailNotifications', value);
              }}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>SMS Notifications</Text>
              <Text style={styles.settingDescription}>
                Get text message alerts
              </Text>
            </View>
            <Switch
              value={isEditing 
                ? (editedProfile.notificationSettings?.smsNotifications ?? false)
                : (user.notificationSettings?.smsNotifications ?? false)
              }
              onValueChange={(value) => {
                updateNotificationSetting('smsNotifications', value);
              }}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            />
          </View>
        </View>

        {/* Test Centers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Test Centers</Text>
          {(isEditing ? editedProfile.preferredTestCenters : user.preferredTestCenters) && 
           (isEditing ? editedProfile.preferredTestCenters : user.preferredTestCenters)!.length > 0 ? (
            (isEditing ? editedProfile.preferredTestCenters : user.preferredTestCenters)!.map((center, index) => (
              <View key={index} style={styles.testCenterItem}>
                <Text style={styles.testCenterName}>📍 {center}</Text>
                {isEditing && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditedProfile((prev) => ({
                        ...prev,
                        preferredTestCenters: (prev.preferredTestCenters || []).filter(
                          (c) => c !== center
                        ),
                      }));
                    }}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No preferred test centers added</Text>
            </View>
          )}
          <TouchableOpacity 
            style={[styles.addCenterButton, !isEditing && styles.disabledButton]}
            onPress={() => {
              if (!isEditing) {
                Alert.alert('Edit Mode Required', 'Please tap "Edit Profile" to add test centers.');
                return;
              }
              
              // For now, use predefined options until we implement a custom input modal
              Alert.alert(
                'Add Test Center',
                'Select a test center to add:',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Birmingham South',
                    onPress: () => {
                      setEditedProfile((prev) => ({
                        ...prev,
                        preferredTestCenters: [
                          ...(prev.preferredTestCenters || []),
                          'Birmingham South',
                        ],
                      }));
                    },
                  },
                  {
                    text: 'London Central',
                    onPress: () => {
                      setEditedProfile((prev) => ({
                        ...prev,
                        preferredTestCenters: [
                          ...(prev.preferredTestCenters || []),
                          'London Central',
                        ],
                      }));
                    },
                  },
                  {
                    text: 'Manchester',
                    onPress: () => {
                      setEditedProfile((prev) => ({
                        ...prev,
                        preferredTestCenters: [
                          ...(prev.preferredTestCenters || []),
                          'Manchester',
                        ],
                      }));
                    },
                  },
                ]
              );
            }}
            disabled={!isEditing}
          >
            <Text style={styles.addCenterText}>+ Add Test Center</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Info */}
        {user.subscription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionType}>
                {user.subscription.type.charAt(0).toUpperCase() + user.subscription.type.slice(1)} Plan
              </Text>
              {user.subscription.expiresAt && (
                <Text style={styles.subscriptionExpiry}>
                  Expires: {new Date(user.subscription.expiresAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/modal')}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionText}>Manage Alerts</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/two')}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>Search Test Slots</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Statistics', 'Feature coming soon!')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>View Statistics</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Contact Support</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DVSlot v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 DVSlot. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginHorizontal: -16,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  editButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  profileField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  testCenterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  testCenterName: {
    fontSize: 16,
    color: '#1F2937',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  addCenterButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  addCenterText: {
    color: '#6B7280',
    fontSize: 16,
  },
  subscriptionInfo: {
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  subscriptionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  subscriptionExpiry: {
    fontSize: 14,
    color: '#0284C7',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  actionArrow: {
    fontSize: 16,
    color: '#6B7280',
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  removeButton: {
    padding: 4,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
