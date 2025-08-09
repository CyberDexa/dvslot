const db = require('../config/database');

class UserAlert {
  static async findAll() {
    return await db('user_alerts')
      .select(
        'user_alerts.*',
        'users.email',
        'users.first_name',
        'users.last_name',
        'driving_test_slots.test_type',
        'driving_test_slots.date',
        'driving_test_slots.time',
        'dvsa_test_centers.name as center_name',
        'dvsa_test_centers.postcode'
      )
      .join('users', 'user_alerts.user_id', 'users.user_id')
      .join('driving_test_slots', 'user_alerts.slot_id', 'driving_test_slots.slot_id')
      .join('dvsa_test_centers', 'driving_test_slots.center_id', 'dvsa_test_centers.center_id')
      .orderBy('user_alerts.created_at', 'desc');
  }

  static async findById(alertId) {
    return await db('user_alerts')
      .select(
        'user_alerts.*',
        'users.email',
        'users.first_name',
        'users.last_name',
        'driving_test_slots.test_type',
        'driving_test_slots.date',
        'driving_test_slots.time',
        'dvsa_test_centers.name as center_name',
        'dvsa_test_centers.postcode'
      )
      .join('users', 'user_alerts.user_id', 'users.user_id')
      .join('driving_test_slots', 'user_alerts.slot_id', 'driving_test_slots.slot_id')
      .join('dvsa_test_centers', 'driving_test_slots.center_id', 'dvsa_test_centers.center_id')
      .where('user_alerts.alert_id', alertId)
      .first();
  }

  static async findByUserId(userId, page = 1, limit = 20, sentOnly = false) {
    const offset = (page - 1) * limit;

    let baseQuery = db('user_alerts')
      .select(
        'user_alerts.*',
        'driving_test_slots.test_type',
        'driving_test_slots.date',
        'driving_test_slots.time',
        'driving_test_slots.available',
        'dvsa_test_centers.name as center_name',
        'dvsa_test_centers.postcode',
        'dvsa_test_centers.region'
      )
      .join('driving_test_slots', 'user_alerts.slot_id', 'driving_test_slots.slot_id')
      .join('dvsa_test_centers', 'driving_test_slots.center_id', 'dvsa_test_centers.center_id')
      .where('user_alerts.user_id', userId);

    if (sentOnly) {
      baseQuery = baseQuery.where('user_alerts.sent', true);
    }

    const [alerts, totalCount] = await Promise.all([
      baseQuery
        .clone()
        .orderBy('user_alerts.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      baseQuery
        .clone()
        .count('user_alerts.alert_id as count')
        .first()
    ]);

    return {
      data: alerts,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount.count),
        pages: Math.ceil(totalCount.count / limit)
      }
    };
  }

  static async create(alertData) {
    const [alert] = await db('user_alerts')
      .insert({
        ...alertData,
        created_at: db.fn.now()
      })
      .returning('*');
    
    return alert;
  }

  static async markSent(alertId, messageContent = null) {
    const [alert] = await db('user_alerts')
      .where('alert_id', alertId)
      .update({
        sent: true,
        sent_at: db.fn.now(),
        message_content: messageContent
      })
      .returning('*');
    
    return alert;
  }

  static async markClicked(alertId) {
    const [alert] = await db('user_alerts')
      .where('alert_id', alertId)
      .update({
        user_clicked: true,
        clicked_at: db.fn.now()
      })
      .returning('*');
    
    return alert;
  }

  static async bulkCreate(alertsData) {
    return await db.transaction(async (trx) => {
      const insertPromises = alertsData.map(alert => 
        trx('user_alerts')
          .insert({
            ...alert,
            created_at: trx.fn.now()
          })
      );
      
      return await Promise.all(insertPromises);
    });
  }

  static async getPendingAlerts() {
    return await db('user_alerts')
      .select(
        'user_alerts.*',
        'users.email',
        'users.fcm_token',
        'user_preferences.notification_method',
        'user_preferences.email_notifications',
        'user_preferences.push_notifications',
        'driving_test_slots.test_type',
        'driving_test_slots.date',
        'driving_test_slots.time',
        'dvsa_test_centers.name as center_name',
        'dvsa_test_centers.postcode',
        'dvsa_test_centers.region'
      )
      .join('users', 'user_alerts.user_id', 'users.user_id')
      .leftJoin('user_preferences', 'users.user_id', 'user_preferences.user_id')
      .join('driving_test_slots', 'user_alerts.slot_id', 'driving_test_slots.slot_id')
      .join('dvsa_test_centers', 'driving_test_slots.center_id', 'dvsa_test_centers.center_id')
      .where('user_alerts.sent', false)
      .where('users.is_active', true)
      .orderBy('user_alerts.created_at', 'asc');
  }

  static async getUserStats(userId) {
    const stats = await db('user_alerts')
      .select(
        db.raw('COUNT(*) as total_alerts'),
        db.raw('SUM(CASE WHEN sent THEN 1 ELSE 0 END) as sent_alerts'),
        db.raw('SUM(CASE WHEN user_clicked THEN 1 ELSE 0 END) as clicked_alerts'),
        db.raw('SUM(CASE WHEN sent AND sent_at >= NOW() - INTERVAL \'7 days\' THEN 1 ELSE 0 END) as alerts_last_7_days'),
        db.raw('SUM(CASE WHEN sent AND sent_at >= NOW() - INTERVAL \'30 days\' THEN 1 ELSE 0 END) as alerts_last_30_days')
      )
      .where('user_id', userId)
      .first();

    return {
      total_alerts: parseInt(stats.total_alerts),
      sent_alerts: parseInt(stats.sent_alerts),
      clicked_alerts: parseInt(stats.clicked_alerts),
      alerts_last_7_days: parseInt(stats.alerts_last_7_days),
      alerts_last_30_days: parseInt(stats.alerts_last_30_days),
      click_through_rate: stats.sent_alerts > 0 ? (stats.clicked_alerts / stats.sent_alerts * 100).toFixed(2) + '%' : '0%'
    };
  }

  static async getSystemStats() {
    const stats = await db('user_alerts')
      .select(
        db.raw('COUNT(*) as total_alerts'),
        db.raw('SUM(CASE WHEN sent THEN 1 ELSE 0 END) as sent_alerts'),
        db.raw('SUM(CASE WHEN user_clicked THEN 1 ELSE 0 END) as clicked_alerts'),
        db.raw('COUNT(DISTINCT user_id) as unique_users'),
        db.raw('AVG(CASE WHEN sent_at IS NOT NULL THEN EXTRACT(EPOCH FROM (sent_at - created_at)) ELSE NULL END) as avg_send_time_seconds')
      )
      .first();

    return {
      total_alerts: parseInt(stats.total_alerts),
      sent_alerts: parseInt(stats.sent_alerts),
      clicked_alerts: parseInt(stats.clicked_alerts),
      unique_users: parseInt(stats.unique_users),
      click_through_rate: stats.sent_alerts > 0 ? (stats.clicked_alerts / stats.sent_alerts * 100).toFixed(2) + '%' : '0%',
      avg_send_time_seconds: parseFloat(stats.avg_send_time_seconds) || 0
    };
  }

  static async cleanupOldAlerts(daysToKeep = 90) {
    return await db('user_alerts')
      .where('created_at', '<', db.raw(`NOW() - INTERVAL '${daysToKeep} days'`))
      .del();
  }

  static async findRecentBySlot(slotId, hours = 1) {
    return await db('user_alerts')
      .where('slot_id', slotId)
      .where('created_at', '>=', db.raw(`NOW() - INTERVAL '${hours} hours'`))
      .orderBy('created_at', 'desc');
  }

  static async checkAlertExists(userId, slotId) {
    const alert = await db('user_alerts')
      .where('user_id', userId)
      .where('slot_id', slotId)
      .first();
    
    return !!alert;
  }
}

module.exports = UserAlert;
