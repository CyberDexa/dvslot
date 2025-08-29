import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { api } from '../../services/api';
import { productionApi, TestCenter as ProductionTestCenter, TestSlot as ProductionTestSlot, SearchFilters as ProductionSearchFilters } from '../../services/productionApi';
import { useRouter } from 'expo-router';

interface SearchResult {
  testCenters: ProductionTestCenter[];
  testSlots: ProductionTestSlot[];
  totalResults: number;
}

export default function Search() {
  const router = useRouter();
  const [postcode, setPostcode] = useState('');
  const [radius, setRadius] = useState(25);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  const radiusOptions = [
    { label: '5 miles', value: 5 },
    { label: '10 miles', value: 10 },
    { label: '25 miles', value: 25 },
    { label: '50 miles', value: 50 },
  ];

  const handleSearch = async () => {
    if (!postcode.trim()) {
      Alert.alert('Error', 'Please enter a postcode');
      return;
    }
    
    // Basic postcode validation (UK format)
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode.trim())) {
      Alert.alert('Invalid Postcode', 'Please enter a valid UK postcode (e.g., SW1A 1AA)');
      return;
    }

    setIsSearching(true);
    setSearchResults(null);

    try {
      const searchFilters: ProductionSearchFilters = {
        postcode: postcode.trim().toUpperCase(),
        radius,
        dateRange: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        testType: 'practical', // Default to practical tests
      };

      console.log('🔍 Searching for test slots...', searchFilters);

      // Use Production API with 318 UK centers
      const testCentersResponse = await productionApi.searchTestCenters(searchFilters);
      const availableSlotsResponse = await productionApi.getAvailableSlots(searchFilters);

      if (testCentersResponse.success && availableSlotsResponse.success) {
        const results: SearchResult = {
          testCenters: testCentersResponse.data || [],
          testSlots: availableSlotsResponse.data || [],
          totalResults: (testCentersResponse.data?.length || 0) + (availableSlotsResponse.data?.length || 0),
        };

        setSearchResults(results);
        setLastSearchQuery(`${postcode.trim().toUpperCase()} within ${radius} miles`);

        // Check if we're showing fallback/demo data
        const isDemoData = testCentersResponse.message?.includes('demo') || 
                          testCentersResponse.message?.includes('Demo') ||
                          availableSlotsResponse.message?.includes('demo') ||
                          availableSlotsResponse.message?.includes('Demo') ||
                          testCentersResponse.message?.includes('temporarily unavailable') ||
                          availableSlotsResponse.message?.includes('temporarily unavailable');

        if (results.totalResults === 0) {
          Alert.alert(
            'No Results Found', 
            `No test slots found for ${postcode.trim().toUpperCase()} within ${radius} miles. Try:\n\n• Increasing your search radius\n• Checking a different postcode\n• Setting up an alert to be notified when slots become available`
          );
        } else if (isDemoData) {
          // Show special message for demo/fallback data
          Alert.alert(
            '⚠️ Demo Data Shown', 
            `Showing ${results.testCenters.length} demo centers and ${results.testSlots.length} sample slots.\n\n${testCentersResponse.message || availableSlotsResponse.message}\n\nPlease try again later for live data from our 318 UK centers database.`,
            [
              { text: 'OK', style: 'default' },
              { text: 'Retry', onPress: () => handleSearch() }
            ]
          );
        } else {
          Alert.alert('Search Complete', `Found ${results.testCenters.length} test centers and ${results.testSlots.length} available slots from our 318 UK centers database!`);
        }
      } else {
        // Handle API errors
        const errorMessage = testCentersResponse.error || availableSlotsResponse.error || 'Unknown error occurred';
        Alert.alert('Search Failed', `Unable to search for test slots: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to our services at the moment. Please check your internet connection and try again.\n\nIf the problem persists, the service may be temporarily unavailable.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Retry', onPress: () => handleSearch() }
        ]
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSetAlert = async (slot: ProductionTestSlot) => {
    try {
      await api.restoreAuthFromStorage();
      if (!(api as any).authToken) {
        Alert.alert(
          'Connect Alerts',
          'Sign in to the alerts backend to create and manage alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Connect', onPress: () => router.push('../auth/backend-login') },
          ]
        );
        return;
      }
      const payload = {
        test_type: (slot.test_type as any) || 'practical',
        location: (postcode || '').trim().toUpperCase(),
        radius,
        preferred_centers: slot.center_id ? [Number(slot.center_id)] : [],
        date_from: slot.date,
        date_to: slot.date,
        preferred_times: slot.time ? [slot.time] : [],
      } as any;
      const res = await api.createAlert(payload);
      if (res.success) {
        Alert.alert('Alert Created', 'We will notify you when similar slots are detected.');
      } else {
        Alert.alert('Failed', res.error || 'Could not create alert');
      }
    } catch (e) {
      Alert.alert('Error', 'Unexpected error while creating alert');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Search Test Slots</Text>
          <Text style={styles.subtitle}>Find available driving test slots near you</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postcode</Text>
            <TextInput
              style={styles.input}
              value={postcode}
              onChangeText={setPostcode}
              placeholder="Enter your postcode (e.g., SW1A 1AA)"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Search Radius</Text>
            <View style={styles.radiusContainer}>
              {radiusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radiusButton,
                    radius === option.value && styles.radiusButtonActive
                  ]}
                  onPress={() => setRadius(option.value)}
                >
                  <Text style={[
                    styles.radiusButtonText,
                    radius === option.value && styles.radiusButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search Test Slots</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Search Tips</Text>
          <Text style={styles.tip}>• Enter your full postcode for best results</Text>
          <Text style={styles.tip}>• Increase radius for more options</Text>
          <Text style={styles.tip}>• Set up alerts for automatic notifications</Text>
        </View>

        {searchResults && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                📍 Results for {lastSearchQuery}
              </Text>
              <Text style={styles.resultsSubtitle}>
                Found {searchResults.totalResults} results
              </Text>
              <Text style={styles.freshnessNote}>
                Data auto-refreshed every few minutes. Some DVSA site differences may occur; we filter for updates in the last 2 hours.
              </Text>
            </View>

            {searchResults.testCenters.length > 0 && (
              <View style={styles.testCentersSection}>
                <Text style={styles.sectionTitle}>🏢 Test Centres</Text>
                {searchResults.testCenters.map((center) => (
                  <View key={center.id} style={styles.testCenterCard}>
                    <View style={styles.testCenterHeader}>
                      <Text style={styles.testCenterName}>{center.name}</Text>
                      <Text style={styles.testCenterDistance}>
                        {center.region}
                      </Text>
                    </View>
                    <Text style={styles.testCenterAddress}>
                      {center.address}, {center.postcode}
                    </Text>
                    <Text style={styles.testCenterCity}>
                      📍 {center.city}, {center.region}
                    </Text>
                    <View style={styles.availabilityRow}>
                      <Text style={[
                        styles.availabilityText,
                        center.availability === 0 && styles.noAvailability
                      ]}>
                        {center.availability === 0 
                          ? '❌ No slots available' 
                          : `✅ ${center.availability} slots available`
                        }
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {searchResults.testSlots.length > 0 && (
              <View style={styles.testSlotsSection}>
                <Text style={styles.sectionTitle}>📅 Available Test Slots</Text>
                {searchResults.testSlots.map((slot) => (
                  <View key={slot.id} style={styles.testSlotCard}>
                    <View style={styles.slotHeader}>
                      <Text style={styles.slotCenter}>{slot.center_name}</Text>
                      <Text style={styles.slotPrice}>£62</Text>
                    </View>
                    <View style={styles.slotDetails}>
                      <Text style={styles.slotDate}>
                        📅 {new Date(slot.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.slotTime}>🕐 {slot.time}</Text>
                      <Text style={styles.slotType}>🚗 {slot.test_type}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.alertButton}
                      onPress={() => handleSetAlert(slot)}
                    >
                      <Text style={styles.alertButtonText}>🔔 Set Alert</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {searchResults.testCenters.length === 0 && searchResults.testSlots.length === 0 && (
              <View style={styles.noResultsSection}>
                <Text style={styles.noResultsTitle}>😔 No Results Found</Text>
                <Text style={styles.noResultsText}>
                  This is common with DVSA test slots! Try:
                </Text>
                <Text style={styles.noResultsTip}>• Expanding your search radius</Text>
                <Text style={styles.noResultsTip}>• Searching a different postcode area</Text>
                <Text style={styles.noResultsTip}>• Setting up an alert for when slots become available</Text>
              </View>
            )}
          </View>
        )}
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
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
  },
  radiusContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  radiusButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  radiusButtonTextActive: {
    color: '#fff',
  },
  searchButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tips: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  // Search Results Styles
  resultsSection: {
    margin: 20,
  },
  resultsHeader: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  freshnessNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  testCentersSection: {
    marginBottom: 20,
  },
  testSlotsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  testCenterCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  testCenterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testCenterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  testCenterDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  testCenterAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  testCenterCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  noAvailability: {
    color: '#EF4444',
  },
  testSlotCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotCenter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  slotPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  slotDetails: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  slotDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  slotTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  slotType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  alertButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  noResultsSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  noResultsTip: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
});
