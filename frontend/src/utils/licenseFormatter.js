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
