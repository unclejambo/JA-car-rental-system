import prisma from "../config/prisma.js";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Generate fresh signed URL for car image if it exists
 */
const refreshCarImageUrl = async (carImgUrl) => {
  if (!carImgUrl) return null;
  
  try {
    // Extract the path from the existing URL
    // Format: https://...supabase.co/storage/v1/object/sign/licenses/car_img/filename?token=...
    const urlParts = carImgUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'licenses');
    
    if (bucketIndex === -1) return carImgUrl; // Return original if can't parse
    
    const encodedPath = urlParts.slice(bucketIndex + 1).join('/').split('?')[0]; // Remove query params
    
    // Decode URL encoding (e.g., %20 -> space)
    const path = decodeURIComponent(encodedPath);
    
    const { data: signedUrlData, error } = await supabase.storage
      .from('licenses')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiration
    
    if (error) {
      console.error('Error refreshing car image signed URL:', error);
      return carImgUrl; // Return original URL if refresh fails
    }
    
    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error parsing car image URL:', error);
    return carImgUrl; // Return original URL if parsing fails
  }
};

// @desc    Get dashboard statistics
// @route   GET /analytics/dashboard
// @access  Private/Admin/Staff
export const getDashboardStats = async (req, res) => {
  try {
    // Get counts for dashboard
    const [
      totalBookings,
      activeBookings,
      totalCustomers,
      totalCars,
      totalRevenue,
      pendingBookings
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          booking_status: { in: ['Confirmed', 'In Progress'] }
        }
      }),
      prisma.customer.count(),
      prisma.car.count(),
      prisma.payment.aggregate({
        _sum: { amount: true }
      }),
      prisma.booking.count({
        where: { booking_status: 'Pending' }
      })
    ]);

    res.json({
      totalBookings,
      activeBookings,
      totalCustomers,
      totalCars,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingBookings
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

// @desc    Get booking analytics
// @route   GET /analytics/bookings
// @access  Private/Admin/Staff
export const getBookingAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get booking trends
    const bookingTrends = await prisma.booking.groupBy({
      by: ['booking_status'],
      _count: { booking_id: true },
      where: {
        booking_date: { gte: startDate }
      }
    });

    // Get daily bookings for the period
    const dailyBookings = await prisma.booking.findMany({
      where: {
        booking_date: { gte: startDate }
      },
      select: {
        booking_date: true,
        booking_status: true
      }
    });

    res.json({
      trends: bookingTrends.map(trend => ({
        status: trend.booking_status,
        count: trend._count.booking_id
      })),
      daily: dailyBookings
    });
  } catch (error) {
    console.error("Error fetching booking analytics:", error);
    res.status(500).json({ error: "Failed to fetch booking analytics" });
  }
};

// @desc    Get revenue analytics
// @route   GET /analytics/revenue
// @access  Private/Admin/Staff
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30', year, month, quarter } = req.query;
    let startDate, endDate;

    // Calculate date range based on parameters
    if (year) {
      const selectedYear = parseInt(year);
      if (month !== undefined) {
        // Specific month in year
        const selectedMonth = parseInt(month);
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      } else if (quarter) {
        // Specific quarter in year
        const selectedQuarter = parseInt(quarter);
        const startMonth = (selectedQuarter - 1) * 3;
        startDate = new Date(selectedYear, startMonth, 1);
        endDate = new Date(selectedYear, startMonth + 3, 0, 23, 59, 59);
      } else {
        // Entire year
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      }
    } else {
      // Default to period in days from now
      const days = parseInt(period, 10) || 30;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      endDate = new Date();
    }
    
    // Validate the dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date calculation');
    }

    // Get revenue by payment method
    const revenueByMethod = await prisma.payment.groupBy({
      by: ['payment_method'],
      _sum: { amount: true },
      where: {
        paid_date: { 
          gte: startDate,
          lte: endDate,
          not: null // Exclude null paid_date
        }
      }
    });

    // Get revenue trend for the specified period
    const revenueData = await prisma.payment.findMany({
      where: {
        paid_date: { 
          gte: startDate,
          lte: endDate,
          not: null // Exclude null paid_date
        }
      },
      select: {
        amount: true,
        paid_date: true
      },
      orderBy: { paid_date: 'asc' }
    });

    const response = {
      byMethod: revenueByMethod.map(method => ({
        method: method.payment_method || 'Unknown',
        total: method._sum.amount || 0
      })),
      monthly: revenueData,
      dateRange: { startDate, endDate }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    
    // Send more detailed error information in development
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({ 
      error: "Failed to fetch revenue analytics", 
      details: isDev ? error.message : "Internal server error"
    });
  }
};

// @desc    Get car utilization statistics
// @route   GET /analytics/cars/utilization
// @access  Private/Admin/Staff
// @desc    Get top customers analytics
// @route   GET /analytics/customers/top
// @access  Private/Admin/Staff
export const getTopCustomers = async (req, res) => {
  try {
    const { period = '30', year, month, quarter } = req.query;
    let startDate, endDate;

    // Calculate date range based on parameters
    if (year) {
      const selectedYear = parseInt(year);
      if (month !== undefined) {
        // Specific month in year
        const selectedMonth = parseInt(month);
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      } else if (quarter) {
        // Specific quarter in year
        const selectedQuarter = parseInt(quarter);
        const startMonth = (selectedQuarter - 1) * 3;
        startDate = new Date(selectedYear, startMonth, 1);
        endDate = new Date(selectedYear, startMonth + 3, 0, 23, 59, 59);
      } else {
        // Entire year
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      }
    } else {
      // Default to period in days from now
      const days = parseInt(period);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      endDate = new Date();
    }

    // Get customer booking counts
    const customerBookings = await prisma.customer.findMany({
      include: {
        bookings: {
          where: {
            start_date: { gte: startDate, lte: endDate },
            booking_status: { in: ['Confirmed', 'Completed', 'In Progress'] }
          },
          select: {
            booking_id: true
          }
        }
      }
    });

    const topCustomers = customerBookings
      .map(customer => ({
        customerId: customer.customer_id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        fullName: `${customer.first_name} ${customer.last_name}`,
        bookingCount: customer.bookings.length
      }))
      .filter(customer => customer.bookingCount > 0) // Only customers with bookings
      .sort((a, b) => b.bookingCount - a.bookingCount); // Sort by booking count descending

    res.json(topCustomers);
  } catch (error) {
    console.error("Error fetching top customers:", error);
    
    // Send more detailed error information in development
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({ 
      error: "Failed to fetch top customers", 
      details: isDev ? error.message : "Internal server error"
    });
  }
};

export const getCarUtilization = async (req, res) => {
  try {
    const { period = '30', year, month, quarter } = req.query;
    let startDate, endDate;

    // Calculate date range based on parameters
    if (year) {
      const selectedYear = parseInt(year);
      if (isNaN(selectedYear) || selectedYear < 2000 || selectedYear > 2100) {
        throw new Error('Invalid year parameter');
      }
      
      if (month !== undefined) {
        // Specific month in year
        const selectedMonth = parseInt(month);
        if (isNaN(selectedMonth) || selectedMonth < 0 || selectedMonth > 11) {
          throw new Error('Invalid month parameter (0-11)');
        }
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      } else if (quarter) {
        // Specific quarter in year
        const selectedQuarter = parseInt(quarter);
        if (isNaN(selectedQuarter) || selectedQuarter < 1 || selectedQuarter > 4) {
          throw new Error('Invalid quarter parameter (1-4)');
        }
        const startMonth = (selectedQuarter - 1) * 3;
        startDate = new Date(selectedYear, startMonth, 1);
        endDate = new Date(selectedYear, startMonth + 3, 0, 23, 59, 59);
      } else {
        // Entire year
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      }
    } else {
      // Default to period in days from now
      const days = parseInt(period);
      if (isNaN(days) || days <= 0) {
        throw new Error('Invalid period parameter');
      }
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      endDate = new Date();
    }
    
    // Validate calculated dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date calculation');
    }

    // Get car usage statistics - select all car fields including car_img_url
    const carUsage = await prisma.car.findMany({
      select: {
        car_id: true,
        make: true,
        model: true,
        car_img_url: true,
        year: true,
        car_type: true,
        bookings: {
          where: {
            start_date: { gte: startDate, lte: endDate },
            booking_status: { in: ['Confirmed', 'Completed', 'In Progress'] }
          },
          select: {
            booking_id: true,
            start_date: true,
            end_date: true
          }
        }
      }
    });

    // Calculate the number of days in the date range for utilization calculation
    const rangeDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

    const utilization = await Promise.all(carUsage.map(async (car) => {
      // Refresh signed URL if car image exists
      const refreshedImgUrl = car.car_img_url ? await refreshCarImageUrl(car.car_img_url) : null;
      
      return {
        carId: car.car_id,
        make: car.make,
        model: car.model,
        carImgUrl: refreshedImgUrl,
        year: car.year,
        carType: car.car_type,
        bookingCount: car.bookings.length,
        utilization: car.bookings.length > 0 ? (car.bookings.length / rangeDays * 100) : 0
      };
    }));

    // Sort by booking count descending to show top cars first
    utilization.sort((a, b) => b.bookingCount - a.bookingCount);

    // Log the top car for debugging
    if (utilization.length > 0) {
      console.log('📊 Top Car:', {
        make: utilization[0].make,
        model: utilization[0].model,
        carImgUrl: utilization[0].carImgUrl ? 'URL refreshed' : 'No image',
        hasImage: !!utilization[0].carImgUrl
      });
    }

    res.json(utilization);
  } catch (error) {
    console.error("Error fetching car utilization:", error);
    
    // Send more detailed error information in development
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({ 
      error: "Failed to fetch car utilization", 
      details: isDev ? error.message : "Internal server error"
    });
  }
};

// @desc    Get available years from payment and booking data
// @route   GET /analytics/years
// @access  Private/Admin/Staff
export const getAvailableYears = async (req, res) => {
  try {
    // Get years from different date sources
    const [paymentDates, bookingDates, futurBookings] = await Promise.all([
      // Payment dates (when money was actually received)
      prisma.payment.findMany({
        where: { paid_date: { not: null } },
        select: { paid_date: true }
      }),
      
      // Booking dates (when bookings were made)
      prisma.booking.findMany({
        select: { booking_date: true, start_date: true, end_date: true }
      }),
      
      // Future bookings that might have payments
      prisma.booking.findMany({
        where: {
          start_date: { gt: new Date() } // Future bookings
        },
        select: { start_date: true, end_date: true }
      })
    ]);

    // Extract unique years from all date sources
    const yearsSet = new Set();
    
    // Add years from payment dates
    paymentDates.forEach(payment => {
      if (payment.paid_date) {
        yearsSet.add(new Date(payment.paid_date).getFullYear());
      }
    });
    
    // Add years from booking dates and booking periods
    bookingDates.forEach(booking => {
      if (booking.booking_date) yearsSet.add(new Date(booking.booking_date).getFullYear());
      if (booking.start_date) yearsSet.add(new Date(booking.start_date).getFullYear());
      if (booking.end_date) yearsSet.add(new Date(booking.end_date).getFullYear());
    });
    
    // Add years from future bookings
    futurBookings.forEach(booking => {
      if (booking.start_date) yearsSet.add(new Date(booking.start_date).getFullYear());
      if (booking.end_date) yearsSet.add(new Date(booking.end_date).getFullYear());
    });

    const currentYear = new Date().getFullYear();
    
    // Always include current year and next year for upcoming payments
    yearsSet.add(currentYear);
    yearsSet.add(currentYear + 1);
    
    // Ensure we have a reasonable range
    const minYear = Math.min(...yearsSet, 2020);
    const maxYear = Math.max(...yearsSet, currentYear + 1);
    
    // Generate complete year range
    const years = [];
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year);
    }

    console.log(`Available years calculated: ${years.length} years from ${minYear} to ${maxYear}`);
    res.json(years.sort((a, b) => b - a)); // Most recent first
    
  } catch (error) {
    console.error("Error fetching available years:", error);
    
    // Robust fallback that extends into future
    const currentYear = new Date().getFullYear();
    const fallbackYears = [];
    for (let year = 2020; year <= currentYear + 2; year++) {
      fallbackYears.push(year);
    }
    
    console.log(`Using fallback years: ${fallbackYears.length} years`);
    res.json(fallbackYears.sort((a, b) => b - a));
  }
};