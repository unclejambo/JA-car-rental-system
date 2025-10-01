import prisma from "../config/prisma.js";

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
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get revenue by payment method
    const revenueByMethod = await prisma.payment.groupBy({
      by: ['payment_method'],
      _sum: { amount: true },
      where: {
        paid_date: { gte: startDate }
      }
    });

    // Get monthly revenue trend
    const monthlyRevenue = await prisma.payment.findMany({
      where: {
        paid_date: { gte: startDate }
      },
      select: {
        amount: true,
        paid_date: true
      },
      orderBy: { paid_date: 'asc' }
    });

    res.json({
      byMethod: revenueByMethod.map(method => ({
        method: method.payment_method || 'Unknown',
        total: method._sum.amount || 0
      })),
      monthly: monthlyRevenue
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({ error: "Failed to fetch revenue analytics" });
  }
};

// @desc    Get car utilization statistics
// @route   GET /analytics/cars/utilization
// @access  Private/Admin/Staff
export const getCarUtilization = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get car usage statistics
    const carUsage = await prisma.car.findMany({
      include: {
        bookings: {
          where: {
            start_date: { gte: startDate },
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

    const utilization = carUsage.map(car => ({
      carId: car.car_id,
      make: car.make,
      model: car.model,
      bookingCount: car.bookings.length,
      utilization: car.bookings.length > 0 ? (car.bookings.length / days * 100) : 0
    }));

    res.json(utilization);
  } catch (error) {
    console.error("Error fetching car utilization:", error);
    res.status(500).json({ error: "Failed to fetch car utilization" });
  }
};