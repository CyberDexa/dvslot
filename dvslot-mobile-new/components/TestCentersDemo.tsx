import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { supabaseApi, TestCenter } from '../services/supabase-api';

export default function TestCentersDemo() {
  const [testCenters, setTestCenters] = useState<TestCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalCenters: number;
    availableSlots: number;
    regionsCount: number;
  } | null>(null);

  const regions = [
    'Greater London',
    'South East',
    'West Midlands',
    'East Midlands',
    'North West',
    'Yorkshire',
    'North East',
    'South West',
    'Wales',
    'Scotland',
    'Northern Ireland',
    'East of England',
  ];

  const loadTestCenters = async (region?: string) => {
    setLoading(true);
    try {
      let response;
      if (region) {
        response = await supabaseApi.searchTestCenters({ region });
      } else {
        response = await supabaseApi.getAllTestCenters();
      }

      if (response.success) {
        setTestCenters(response.data || []);
        Alert.alert(
          'Test Centers Loaded',
          `✅ Successfully loaded ${response.data?.length || 0} test centers${region ? ` in ${region}` : ' across the UK'}`
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to load test centers');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await supabaseApi.getDatabaseStats();
      if (response.success) {
        setStats(response.data || null);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadTestCenters(selectedRegion || undefined),
      loadStats(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
    loadTestCenters();
  }, []);

  const handleRegionSelect = (region: string) => {
    if (selectedRegion === region) {
      setSelectedRegion(null);
      loadTestCenters();
    } else {
      setSelectedRegion(region);
      loadTestCenters(region);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>🎯 DVSlot Test Centers</Text>
          <Text style={styles.subtitle}>
            {selectedRegion ? `${selectedRegion} Region` : 'All UK Test Centers'}
          </Text>
          {stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                📊 {stats.totalCenters} Centers | 🎯 {stats.availableSlots} Slots | 🌍 {stats.regionsCount} Regions
              </Text>
            </View>
          )}
        </View>

        <View style={styles.regionFilters}>
          <Text style={styles.filterTitle}>Filter by Region:</Text>
          <View style={styles.regionGrid}>
            {regions.map((region) => (
              <TouchableOpacity
                key={region}
                style={[
                  styles.regionButton,
                  selectedRegion === region && styles.regionButtonActive,
                ]}
                onPress={() => handleRegionSelect(region)}
              >
                <Text
                  style={[
                    styles.regionButtonText,
                    selectedRegion === region && styles.regionButtonTextActive,
                  ]}
                >
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.testCentersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🏢 Test Centers {selectedRegion ? `in ${selectedRegion}` : 'Across UK'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Showing {testCenters.length} centers
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading test centers...</Text>
            </View>
          ) : (
            <View style={styles.centersList}>
              {testCenters.map((center) => (
                <View key={center.id} style={styles.centerCard}>
                  <View style={styles.centerHeader}>
                    <Text style={styles.centerName}>{center.name}</Text>
                    <View style={styles.regionBadge}>
                      <Text style={styles.regionBadgeText}>{center.region}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.centerAddress}>
                    📍 {center.address}, {center.postcode}
                  </Text>
                  
                  <Text style={styles.centerCity}>
                    🏙️ {center.city}
                  </Text>
                  
                  <View style={styles.centerInfo}>
                    <Text style={styles.coordinates}>
                      📍 {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
                    </Text>
                    <Text style={styles.phone}>
                      📞 {center.phone_number}
                    </Text>
                  </View>

                  {center.availability !== undefined && (
                    <View style={styles.availabilityContainer}>
                      <Text
                        style={[
                          styles.availabilityText,
                          center.availability === 0 ? styles.noAvailability : styles.hasAvailability,
                        ]}
                      >
                        {center.availability === 0
                          ? '❌ No slots available'
                          : `✅ ${center.availability} slots available`}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.viewSlotsButton}
                    onPress={() => 
                      Alert.alert(
                        'View Slots',
                        `Would you like to view available slots at ${center.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'View Slots', 
                            onPress: () => console.log(`View slots for ${center.id}`) 
                          }
                        ]
                      )
                    }
                  >
                    <Text style={styles.viewSlotsButtonText}>View Available Slots</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {testCenters.length === 0 && !loading && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>
                    😔 No test centers found{selectedRegion ? ` in ${selectedRegion}` : ''}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => onRefresh()}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
            </Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  regionFilters: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  regionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  regionButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  regionButtonTextActive: {
    color: '#fff',
  },
  testCentersSection: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  centersList: {
    gap: 16,
  },
  centerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  centerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  regionBadge: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  regionBadgeText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  centerAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  centerCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  centerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  coordinates: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  phone: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  availabilityContainer: {
    marginBottom: 12,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hasAvailability: {
    color: '#059669',
  },
  noAvailability: {
    color: '#DC2626',
  },
  viewSlotsButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSlotsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
  },
  refreshButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
