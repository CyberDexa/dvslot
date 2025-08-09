const db = require('../config/database');

class AlertSubscription {
  static async findAll() {
    return await db('alert_subscriptions')
      .select('*')
      .orderBy('created_at', 'desc');
  }

  static async findById(subscriptionId) {
    return await db('alert_subscriptions')
      .where('subscription_id', subscriptionId)
      .first();
  }

  static async findByUserId(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [subscriptions, totalCount] = await Promise.all([
      db('alert_subscriptions')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      db('alert_subscriptions')
        .where('user_id', userId)
        .count('subscription_id as count')
        .first()
    ]);

    return {
      data: subscriptions,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount.count),
        pages: Math.ceil(totalCount.count / limit)
      }
    };
  }

  static async findActive() {
    return await db('alert_subscriptions')
      .where('is_active', true)
      .orderBy('created_at', 'desc');
  }

  static async findMatchingSubscriptions(testType, centerIds) {
    return await db('alert_subscriptions')
      .select(
        'alert_subscriptions.*',
        'users.email',
        'users.fcm_token',
        'user_preferences.notification_method',
        'user_preferences.email_notifications',
        'user_preferences.push_notifications'
      )
      .join('users', 'alert_subscriptions.user_id', 'users.user_id')
      .leftJoin('user_preferences', 'users.user_id', 'user_preferences.user_id')
      .where('alert_subscriptions.is_active', true)
      .where('users.is_active', true)
      .where(function() {
        this.where('alert_subscriptions.test_type', testType)
            .orWhere('alert_subscriptions.test_type', 'both');
      })
      .where(function() {
        // Check if any of the center IDs match the user's preferred centers
        centerIds.forEach(centerId => {
          this.orWhereRaw('JSON_CONTAINS(alert_subscriptions.preferred_centers, ?)', [JSON.stringify(centerId)]);
        });
      });
  }

  static async create(subscriptionData) {
    const [subscription] = await db('alert_subscriptions')
      .insert({
        ...subscriptionData,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('*');
    
    return subscription;
  }

  static async update(subscriptionId, updateData) {
    const [subscription] = await db('alert_subscriptions')
      .where('subscription_id', subscriptionId)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    return subscription;
  }

  static async delete(subscriptionId) {
    return await db('alert_subscriptions')
      .where('subscription_id', subscriptionId)
      .del();
  }

  static async deactivate(subscriptionId) {
    return await this.update(subscriptionId, { is_active: false });
  }

  static async activate(subscriptionId) {
    return await this.update(subscriptionId, { is_active: true });
  }

  static async findByLocationAndTestType(latitude, longitude, radius, testType) {
    return await db('alert_subscriptions')
      .select('*')
      .where('is_active', true)
      .where(function() {
        this.where('test_type', testType)
            .orWhere('test_type', 'both');
      })
      .whereRaw(`
        ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
          ST_SetSRID(ST_MakePoint(?, ?), 4326),
          ? * 1609.34
        )
      `, [longitude, latitude, radius]);
  }

  static async getUserSubscriptionCount(userId) {
    const result = await db('alert_subscriptions')
      .where('user_id', userId)
      .where('is_active', true)
      .count('subscription_id as count')
      .first();
    
    return parseInt(result.count);
  }

  static async getSubscriptionStats() {
    const stats = await db('alert_subscriptions')
      .select('test_type')
      .count('subscription_id as total')
      .sum('is_active as active')
      .groupBy('test_type');

    return stats;
  }

  static async cleanupExpiredSubscriptions() {
    // Deactivate subscriptions where date_to has passed
    return await db('alert_subscriptions')
      .where('date_to', '<', db.raw('CURRENT_DATE'))
      .where('is_active', true)
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });
  }
}

module.exports = AlertSubscription;
