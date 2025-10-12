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

console.log('🧪 Testing Philippine Timezone Utilities\n');

// Test 1: Convert UTC to Philippine Time
console.log('Test 1: UTC to Philippine Time');
const utcDate = new Date('2025-01-15T00:00:00Z'); // Midnight UTC
const phTime = toPhilippineTime(utcDate);
console.log('  UTC:', utcDate.toISOString());
console.log('  Philippine:', phTime.toISOString());
console.log('  Expected: 8 hours ahead\n');

// Test 2: Get current Philippine time
console.log('Test 2: Current Philippine Time');
const now = getNowPhilippineTime();
console.log('  Current PH Time:', now.toISOString());
console.log('  Local Time:', new Date().toISOString());
console.log('  Difference should be ~8 hours\n');

// Test 3: Format Philippine Date
console.log('Test 3: Format Philippine Date');
const testDate = new Date('2025-01-15T16:30:00Z'); // 4:30 PM UTC = 12:30 AM+1 Philippine
console.log('  UTC:', testDate.toISOString());
console.log('  Formatted:', formatPhilippineDate(testDate));
console.log('  DateTime:', formatPhilippineDateTime(testDate));
console.log('');

// Test 4: Parse Philippine Date String
console.log('Test 4: Parse Philippine Date String');
const dateString = '2025-01-15';
const parsedDate = parsePhilippineDateString(dateString);
console.log('  Input:', dateString);
console.log('  Parsed (UTC for storage):', parsedDate?.toISOString());
console.log('  Should be 2025-01-14T16:00:00Z (UTC)');
console.log('');

// Test 5: Calculate Days Difference
console.log('Test 5: Calculate Days Difference');
const startDate = new Date('2025-01-15T00:00:00Z');
const endDate = new Date('2025-01-18T00:00:00Z');
const days = calculateDaysDifference(startDate, endDate);
console.log('  Start:', startDate.toISOString());
console.log('  End:', endDate.toISOString());
console.log('  Days:', days);
console.log('');

// Test 6: Check if date is in past
console.log('Test 6: Is Date In Past');
const pastDate = new Date('2024-01-01T00:00:00Z');
const futureDate = new Date('2026-01-01T00:00:00Z');
console.log('  Past date (2024-01-01):', isDateInPast(pastDate));
console.log('  Future date (2026-01-01):', isDateInPast(futureDate));
console.log('');

// Test 7: Check if date is today
console.log('Test 7: Is Today');
const today = new Date();
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
console.log('  Today:', isToday(today));
console.log('  Yesterday:', isToday(yesterday));
console.log('');

// Test 8: Add Days
console.log('Test 8: Add Days');
const baseDate = new Date('2025-01-15T00:00:00Z');
const added = addDays(baseDate, 5);
console.log('  Base:', baseDate.toISOString());
console.log('  +5 days:', added.toISOString());
console.log('');

// Test 9: Start/End of Day
console.log('Test 9: Start/End of Day');
const someDate = new Date('2025-01-15T12:30:45Z');
const start = startOfDay(someDate);
const end = endOfDay(someDate);
console.log('  Original:', someDate.toISOString());
console.log('  Start of day:', start.toISOString());
console.log('  End of day:', end.toISOString());
console.log('');

console.log('✅ All tests completed!\n');
console.log('💡 Tips:');
console.log('  - Database stores in UTC (timestamptz)');
console.log('  - Application converts to Philippine time for display');
console.log('  - Always use utility functions for consistency');
console.log('  - Philippine timezone is UTC+8 (no DST)');
