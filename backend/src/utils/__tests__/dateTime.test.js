/**
 * Test file for Philippine Timezone utilities
 * Run with: node backend/src/utils/__tests__/dateTime.test.js
 */

import {
  toPhilippineTime,
  toUTC,
  getNowPhilippineTime,
  formatPhilippineDate,
  formatPhilippineDateTime,
  parsePhilippineDateString,
  calculateDaysDifference,
  isDateInPast,
  isToday,
  addDays,
  startOfDay,
  endOfDay
} from '../dateTime.js';
// Test 1: Convert UTC to Philippine Time
const utcDate = new Date('2025-01-15T00:00:00Z'); // Midnight UTC
const phTime = toPhilippineTime(utcDate);
// Test 2: Get current Philippine time
const now = getNowPhilippineTime();
// Test 3: Format Philippine Date
const testDate = new Date('2025-01-15T16:30:00Z'); // 4:30 PM UTC = 12:30 AM+1 Philippine
// Test 4: Parse Philippine Date String
const dateString = '2025-01-15';
const parsedDate = parsePhilippineDateString(dateString);
// Test 5: Calculate Days Difference
const startDate = new Date('2025-01-15T00:00:00Z');
const endDate = new Date('2025-01-18T00:00:00Z');
const days = calculateDaysDifference(startDate, endDate);
// Test 6: Check if date is in past
const pastDate = new Date('2024-01-01T00:00:00Z');
const futureDate = new Date('2026-01-01T00:00:00Z');
// Test 7: Check if date is today
const today = new Date();
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
// Test 8: Add Days
const baseDate = new Date('2025-01-15T00:00:00Z');
const added = addDays(baseDate, 5);
// Test 9: Start/End of Day
const someDate = new Date('2025-01-15T12:30:45Z');
const start = startOfDay(someDate);
const end = endOfDay(someDate);