// Integration Tests for DVSlot API
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db/database';
import { redisClient } from '../src/services/redis';

describe('DVSlot API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Set up test database
    await pool.query('BEGIN');
    
    // Clean up existing test data
    await pool.query('DELETE FROM users WHERE email LIKE \'%@test.com\'');
    
    // Start Redis client
    await redisClient.connect();
  });

  afterAll(async () => {
    // Clean up
    await pool.query('ROLLBACK');
    await redisClient.quit();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+447700900123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@test.com');
      
      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'Test123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should not login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Test Centers', () => {
    it('should get all test centers', async () => {
      const response = await request(app)
        .get('/api/test-centers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search test centers by location', async () => {
      const response = await request(app)
        .get('/api/test-centers/search')
        .query({ location: 'London', radius: 10 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get specific test center', async () => {
      // First get all centers to get an ID
      const centersResponse = await request(app)
        .get('/api/test-centers')
        .set('Authorization', `Bearer ${authToken}`);

      if (centersResponse.body.length > 0) {
        const centerId = centersResponse.body[0].id;
        
        const response = await request(app)
          .get(`/api/test-centers/${centerId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', centerId);
      }
    });
  });

  describe('Alerts and Subscriptions', () => {
    it('should create a new alert subscription', async () => {
      // First get a test center
      const centersResponse = await request(app)
        .get('/api/test-centers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(centersResponse.body.length).toBeGreaterThan(0);
      const centerId = centersResponse.body[0].id;

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          testCenterId: centerId,
          testType: 'car',
          preferredDates: [
            '2024-06-01',
            '2024-06-02',
            '2024-06-03'
          ],
          maxDistance: 25,
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('active', true);
    });

    it('should get user subscriptions', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should update subscription', async () => {
      // Get user subscriptions first
      const subscriptionsResponse = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(subscriptionsResponse.body.length).toBeGreaterThan(0);
      const subscriptionId = subscriptionsResponse.body[0].id;

      const response = await request(app)
        .put(`/api/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          active: false,
          maxDistance: 50
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('active', false);
      expect(response.body).toHaveProperty('maxDistance', 50);
    });

    it('should delete subscription', async () => {
      // Create a new subscription to delete
      const centersResponse = await request(app)
        .get('/api/test-centers')
        .set('Authorization', `Bearer ${authToken}`);

      const centerId = centersResponse.body[0].id;

      const createResponse = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          testCenterId: centerId,
          testType: 'car',
          preferredDates: ['2024-06-01'],
          maxDistance: 25
        });

      const subscriptionId = createResponse.body.id;

      const deleteResponse = await request(app)
        .delete(`/api/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Available Slots', () => {
    it('should get available slots for test center', async () => {
      const centersResponse = await request(app)
        .get('/api/test-centers')
        .set('Authorization', `Bearer ${authToken}`);

      const centerId = centersResponse.body[0].id;

      const response = await request(app)
        .get(`/api/test-centers/${centerId}/slots`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-06-01',
          endDate: '2024-06-30',
          testType: 'car'
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication for slots endpoint', async () => {
      const response = await request(app)
        .get('/api/test-centers/1/slots');

      expect(response.status).toBe(401);
    });
  });

  describe('User Profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@test.com');
      expect(response.body).toHaveProperty('firstName', 'Test');
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          phoneNumber: '+447700900456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('firstName', 'Updated');
      expect(response.body).toHaveProperty('lastName', 'Name');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 102; i++) {
        requests.push(
          request(app)
            .get('/api/test-centers')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(requests);
      
      // Should get rate limited after 100 requests
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });
});
