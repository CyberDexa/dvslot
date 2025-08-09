import { validateEmail, validatePassword, validatePostcode } from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require minimum length', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should require uppercase letter', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require number', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });

  describe('validatePostcode', () => {
    it('should validate UK postcodes', () => {
      expect(validatePostcode('M1 1AA')).toBe(true);
      expect(validatePostcode('M60 1NW')).toBe(true);
      expect(validatePostcode('CR0 2YR')).toBe(true);
      expect(validatePostcode('DN55 1PT')).toBe(true);
      expect(validatePostcode('W1A 0AX')).toBe(true);
      expect(validatePostcode('EC1A 1BB')).toBe(true);
    });

    it('should validate postcodes without space', () => {
      expect(validatePostcode('M11AA')).toBe(true);
      expect(validatePostcode('M601NW')).toBe(true);
      expect(validatePostcode('CR02YR')).toBe(true);
    });

    it('should reject invalid postcodes', () => {
      expect(validatePostcode('123456')).toBe(false);
      expect(validatePostcode('INVALID')).toBe(false);
      expect(validatePostcode('')).toBe(false);
      expect(validatePostcode('M')).toBe(false);
      expect(validatePostcode('M1')).toBe(false);
    });
  });
});
