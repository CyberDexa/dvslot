const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Validation failed',
        details: 'Please check the provided data and try again.',
        validation_errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      }
    });
  }
  
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('first_name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('First name is required and must be less than 255 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Last name is required and must be less than 255 characters'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('First name must be less than 255 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Last name must be less than 255 characters'),
  handleValidationErrors
];

// User preferences validation
const validateUserPreferences = [
  body('notification_radius')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Notification radius must be between 1 and 100 miles'),
  body('notification_method')
    .optional()
    .isIn(['email', 'push', 'both'])
    .withMessage('Notification method must be email, push, or both'),
  body('preferred_test_types')
    .optional()
    .isArray()
    .withMessage('Preferred test types must be an array'),
  body('preferred_test_types.*')
    .isIn(['practical', 'theory'])
    .withMessage('Test types must be practical or theory'),
  body('email_notifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('push_notifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  handleValidationErrors
];

// Alert subscription validation
const validateAlertSubscription = [
  body('test_type')
    .isIn(['practical', 'theory', 'both'])
    .withMessage('Test type must be practical, theory, or both'),
  body('location')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Location is required'),
  body('radius')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 miles'),
  body('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  body('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  handleValidationErrors
];

// Appointment search validation
const validateAppointmentSearch = [
  body('test_type')
    .isIn(['practical', 'theory'])
    .withMessage('Test type must be practical or theory'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Location must be less than 255 characters'),
  body('radius')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 miles'),
  body('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  body('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateUserPreferences,
  validateAlertSubscription,
  validateAppointmentSearch
};
