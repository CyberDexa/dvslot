const db = require('../config/database');

class UserPreference {
  static async findByUserId(userId) {
    return await db('user_preferences')
      .where('user_id', userId)
      .first();
  }

  static async create(preferenceData) {
    const [preference] = await db('user_preferences')
      .insert({
        ...preferenceData,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('*');
    
    return preference;
  }

  static async update(userId, updateData) {
    const [preference] = await db('user_preferences')
      .where('user_id', userId)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    return preference;
  }

  static async upsert(userId, preferenceData) {
    const existing = await this.findByUserId(userId);
    
    if (existing) {
      return await this.update(userId, preferenceData);
    } else {
      return await this.create({
        user_id: userId,
        ...preferenceData
      });
    }
  }

  static async delete(userId) {
    return await db('user_preferences')
      .where('user_id', userId)
      .del();
  }
}

module.exports = UserPreference;
