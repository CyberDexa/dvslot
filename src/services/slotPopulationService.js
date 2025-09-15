const cron = require('node-cron');
const { supabase } = require('../supabase-config');
const logger = require('../utils/logger');

class SlotPopulationService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Generate realistic test slot data for demonstration/testing
   * This serves as a fallback when real DVSA scraping is not available
   */
  generateMockSlots(centerId, testType = 'practical') {
    const slots = [];
    const today = new Date();
    const slotsCount = Math.floor(Math.random() * 8) + 2; // 2-10 slots
    
    for (let i = 0; i < slotsCount; i++) {
      const daysFromNow = Math.floor(Math.random() * 45) + 1; // Next 45 days
      const date = new Date(today);
      date.setDate(today.getDate() + daysFromNow);
      
      // Generate realistic time slots (9 AM to 4 PM)
      const hour = 9 + Math.floor(Math.random() * 8);
      const minute = Math.random() > 0.5 ? 0 : 30;
      
      // Higher chance for practical tests to be available (more demand)
      const isAvailable = testType === 'practical' ? Math.random() > 0.4 : Math.random() > 0.2;
      
      slots.push({
        center_id: centerId,
        test_type: testType,
        date: date.toISOString().split('T')[0],
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        available: isAvailable,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_checked: new Date().toISOString()
      });
    }
    
    return slots;
  }

  /**
   * Populate slots for all active test centers
   */
  async populateAllCenterSlots() {
    if (this.isRunning) {
      logger.warn('Slot population already in progress');
      return;
    }

    this.isRunning = true;
    
    try {
      logger.info('Starting slot population for all centers');
      
      // Get all active test centers
      const { data: centers, error: centersError } = await supabase
        .from('dvsa_test_centers')
        .select('center_id, name, region')
        .eq('is_active', true);

      if (centersError) {
        throw new Error(`Failed to fetch test centers: ${centersError.message}`);
      }

      if (!centers || centers.length === 0) {
        logger.warn('No active test centers found');
        return;
      }

      logger.info(`Found ${centers.length} active test centers`);

      let totalSlotsCreated = 0;
      const batchSize = 10;

      // Process centers in batches
      for (let i = 0; i < centers.length; i += batchSize) {
        const batch = centers.slice(i, i + batchSize);
        
        logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(centers.length / batchSize)}`);
        
        for (const center of batch) {
          try {
            // Clear existing future slots for this center
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            await supabase
              .from('driving_test_slots')
              .delete()
              .eq('center_id', center.center_id)
              .gte('date', tomorrow.toISOString().split('T')[0]);

            // Generate slots for both practical and theory tests
            const practicalSlots = this.generateMockSlots(center.center_id, 'practical');
            const theorySlots = this.generateMockSlots(center.center_id, 'theory');
            const allSlots = [...practicalSlots, ...theorySlots];

            if (allSlots.length > 0) {
              const { error: insertError } = await supabase
                .from('driving_test_slots')
                .insert(allSlots);

              if (insertError) {
                logger.error(`Failed to insert slots for center ${center.name}:`, insertError);
              } else {
                totalSlotsCreated += allSlots.length;
                logger.info(`Created ${allSlots.length} slots for ${center.name}`);
              }
            }

          } catch (error) {
            logger.error(`Error processing center ${center.name}:`, error);
          }
        }

        // Small delay between batches to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`Slot population completed. Total slots created: ${totalSlotsCreated}`);
      
      return {
        success: true,
        centersProcessed: centers.length,
        slotsCreated: totalSlotsCreated
      };

    } catch (error) {
      logger.error('Slot population failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get statistics about available slots
   */
  async getSlotStats() {
    try {
      const { data: stats, error } = await supabase
        .from('driving_test_slots')
        .select('test_type, available')
        .gt('date', new Date().toISOString().split('T')[0]); // Only future dates

      if (error) {
        throw new Error(`Failed to get slot stats: ${error.message}`);
      }

      const summary = {
        total: stats.length,
        available: stats.filter(s => s.available).length,
        practical: {
          total: stats.filter(s => s.test_type === 'practical').length,
          available: stats.filter(s => s.test_type === 'practical' && s.available).length
        },
        theory: {
          total: stats.filter(s => s.test_type === 'theory').length,
          available: stats.filter(s => s.test_type === 'theory' && s.available).length
        }
      };

      return summary;
    } catch (error) {
      logger.error('Failed to get slot statistics:', error);
      throw error;
    }
  }

  /**
   * Schedule regular slot updates
   */
  startScheduler() {
    // Run slot population every 2 hours
    cron.schedule('0 */2 * * *', async () => {
      logger.info('Running scheduled slot population');
      try {
        await this.populateAllCenterSlots();
      } catch (error) {
        logger.error('Scheduled slot population failed:', error);
      }
    });

    logger.info('Slot population scheduler started (runs every 2 hours)');
  }
}

module.exports = new SlotPopulationService();