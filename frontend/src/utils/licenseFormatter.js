/**
 * Format a driver's license number to Philippine format: NXX-YY-ZZZZZZ
 * @param {string} value - The input value
 * @returns {string} - Formatted license number
 */
export const formatPhilippineLicense = (value) => {
  if (!value) return '';
  
  // Remove all non-alphanumeric characters
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Apply the format: NXX-YY-ZZZZZZ
  let formatted = '';
  
  if (cleaned.length > 0) {
    // First 3 characters (NXX - region and issuance batch code)
    formatted = cleaned.substring(0, 3);
  }
  
  if (cleaned.length >= 4) {
    // Add dash and next 2 characters (YY - issuance year)
    formatted += '-' + cleaned.substring(3, 5);
  }
  
  if (cleaned.length >= 6) {
    // Add dash and last 6 characters (ZZZZZZ - unique identifier)
    formatted += '-' + cleaned.substring(5, 11);
  }
  
  return formatted;
};

/**
 * Validate Philippine driver's license format
 * @param {string} license - The license number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePhilippineLicense = (license) => {
  if (!license) return false;
  
  // Format: NXX-YY-ZZZZZZ
  // N: Letter (A-Z)
  // X: Digit (0-9)
  // Y: Digit (0-9)
  // Z: Digit (0-9)
  const regex = /^[A-Z][0-9]{2}-[0-9]{2}-[0-9]{6}$/;
  
  return regex.test(license);
};

/**
 * Format a Philippine phone number to +63XXXXXXXXXX format
 * Accepts various input formats:
 * - 09XXXXXXXXX (11 digits starting with 0)
 * - 9XXXXXXXXX (10 digits)
 * - +639XXXXXXXXX (with country code)
 * - 639XXXXXXXXX (with country code, no +)
 * @param {string} value - The input phone number
 * @returns {string} - Formatted phone number (digits only, no formatting characters)
 */
export const formatPhilippinePhone = (value) => {
  if (!value) return '';
  
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Handle different input formats
  let digits = cleaned;
  
  // If starts with 63 (country code), remove it
  if (digits.startsWith('63')) {
    digits = digits.substring(2);
  }
  
  // If starts with 0, remove it
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  // Limit to 10 digits (9XXXXXXXXX)
  digits = digits.substring(0, 10);
  
  return digits;
};

/**
 * Validate Philippine phone number format
 * Valid format: 9XXXXXXXXX (10 digits starting with 9)
 * @param {string} phone - The phone number to validate (should be the formatted version)
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePhilippinePhone = (phone) => {
  if (!phone) return false;
  
  // Must be exactly 10 digits starting with 9
  const regex = /^9[0-9]{9}$/;
  
  return regex.test(phone);
};

/**
 * Display Philippine phone number in a readable format
 * @param {string} phone - The phone number (10 digits starting with 9)
 * @returns {string} - Formatted display string (+63 9XX XXX XXXX)
 */
export const displayPhilippinePhone = (phone) => {
  if (!phone || phone.length !== 10) return phone;
  
  // Format as: +63 9XX XXX XXXX
  return `+63 ${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6, 10)}`;
};

/**
 * Get validation error message for Philippine license
 * @param {string} license - The license number to validate
 * @returns {string|null} - Error message or null if valid
 */
export const getLicenseValidationError = (license) => {
  if (!license || license.trim() === '') {
    return 'License number is required';
  }
  
  if (!validatePhilippineLicense(license)) {
    return 'Invalid license format. Expected: NXX-YY-ZZZZZZ (e.g., N01-23-456789)';
  }
  
  return null;
};
