const db = require('../config/database');

class User {
  static async findAll() {
    return await db('users')
      .select('user_id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at', 'is_active', 'last_login')
      .where('is_active', true);
  }

  static async findById(userId) {
    return await db('users')
      .select('user_id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at', 'is_active', 'role_id', 'fcm_token', 'last_login')
      .where('user_id', userId)
      .first();
  }

  static async findByEmail(email) {
    return await db('users')
      .select('*')
      .where('email', email.toLowerCase())
      .first();
  }

  static async create(userData) {
    const [user] = await db('users')
      .insert({
        ...userData,
        email: userData.email.toLowerCase(),
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning(['user_id', 'email', 'first_name', 'last_name', 'created_at', 'is_active']);
    
    return user;
  }

  static async update(userId, updateData) {
    const [user] = await db('users')
      .where('user_id', userId)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      })
      .returning(['user_id', 'email', 'first_name', 'last_name', 'updated_at', 'is_active']);
    
    return user;
  }

  static async updateLastLogin(userId) {
    return await db('users')
      .where('user_id', userId)
      .update({
        last_login: db.fn.now(),
        updated_at: db.fn.now()
      });
  }

  static async updateFCMToken(userId, fcmToken) {
    return await db('users')
      .where('user_id', userId)
      .update({
        fcm_token: fcmToken,
        updated_at: db.fn.now()
      });
  }

  static async deactivate(userId) {
    return await db('users')
      .where('user_id', userId)
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });
  }

  static async getWithPreferences(userId) {
    return await db('users')
      .select(
        'users.user_id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.created_at',
        'users.is_active',
        'user_preferences.notification_radius',
        'user_preferences.notification_method',
        'user_preferences.preferred_test_types',
        'user_preferences.preferred_test_centers',
        'user_preferences.email_notifications',
        'user_preferences.push_notifications'
      )
      .leftJoin('user_preferences', 'users.user_id', 'user_preferences.user_id')
      .where('users.user_id', userId)
      .first();
  }

  static async getUsersForAlert(testType, centerIds) {
    return await db('users')
      .select(
        'users.user_id',
        'users.email',
        'users.fcm_token',
        'user_preferences.notification_method',
        'user_preferences.email_notifications',
        'user_preferences.push_notifications'
      )
      .join('user_preferences', 'users.user_id', 'user_preferences.user_id')
      .join('alert_subscriptions', 'users.user_id', 'alert_subscriptions.user_id')
      .where('users.is_active', true)
      .where('alert_subscriptions.is_active', true)
      .where(function() {
        this.where('alert_subscriptions.test_type', testType)
            .orWhere('alert_subscriptions.test_type', 'both');
      })
      .whereIn('alert_subscriptions.preferred_centers', centerIds);
  }
}

module.exports = User;
