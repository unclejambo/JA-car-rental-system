import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get income data based on period
export const getIncomeData = async (req, res) => {
  try {
    const { period, year, month, quarter } = req.query;
    
    let startDate, endDate, groupBy, labels = [];
    const currentYear = parseInt(year) || new Date().getFullYear();
    
    // Define date ranges based on period
    if (period === 'monthly') {
      const monthIndex = parseInt(month) || new Date().getMonth();
      startDate = new Date(currentYear, monthIndex, 1);
      endDate = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);
      
      // For monthly, group by day
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(`Day ${i}`);
      }
    } else if (period === 'quarterly') {
      const quarterNum = parseInt(quarter) || 1;
      const startMonth = (quarterNum - 1) * 3;
      startDate = new Date(currentYear, startMonth, 1);
      endDate = new Date(currentYear, startMonth + 3, 0, 23, 59, 59);
      
      // For quarterly, group by month
      labels = ['Month 1', 'Month 2', 'Month 3'];
    } else if (period === 'yearly') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
      
      // For yearly, group by month
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    // Query payments within the date range
    const payments = await prisma.payment.findMany({
      where: {
        paid_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        paid_date: true,
      },
    });

    // Group and aggregate data
    let data = [];
    let totalIncome = 0;

    if (period === 'monthly') {
      // Group by day
      data = new Array(labels.length).fill(0);
      payments.forEach(payment => {
        const day = payment.paid_date.getDate();
        data[day - 1] += payment.amount;
        totalIncome += payment.amount;
      });
    } else if (period === 'quarterly') {
      // Group by month within quarter
      data = new Array(3).fill(0);
      const startMonth = (parseInt(quarter) - 1) * 3;
      payments.forEach(payment => {
        const monthIndex = payment.paid_date.getMonth() - startMonth;
        if (monthIndex >= 0 && monthIndex < 3) {
          data[monthIndex] += payment.amount;
          totalIncome += payment.amount;
        }
      });
    } else if (period === 'yearly') {
      // Group by month
      data = new Array(12).fill(0);
      payments.forEach(payment => {
        const monthIndex = payment.paid_date.getMonth();
        data[monthIndex] += payment.amount;
        totalIncome += payment.amount;
      });
    }

    res.json({
      ok: true,
      data,
      labels,
      totalIncome,
    });
  } catch (error) {
    console.error('Error fetching income data:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch income data',
    });
  }
};

// Get expenses data based on period
export const getExpensesData = async (req, res) => {
  try {
    const { period, year, month, quarter } = req.query;
    
    let startDate, endDate, labels = [];
    const currentYear = parseInt(year) || new Date().getFullYear();
    
    // Define date ranges based on period (same logic as income)
    if (period === 'monthly') {
      const monthIndex = parseInt(month) || new Date().getMonth();
      startDate = new Date(currentYear, monthIndex, 1);
      endDate = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);
      
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(`Day ${i}`);
      }
    } else if (period === 'quarterly') {
      const quarterNum = parseInt(quarter) || 1;
      const startMonth = (quarterNum - 1) * 3;
      startDate = new Date(currentYear, startMonth, 1);
      endDate = new Date(currentYear, startMonth + 3, 0, 23, 59, 59);
      
      labels = ['Month 1', 'Month 2', 'Month 3'];
    } else if (period === 'yearly') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
      
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    // Query maintenance costs within the date range
    const maintenances = await prisma.maintenance.findMany({
      where: {
        maintenance_start_date: {
          gte: startDate,
          lte: endDate,
        },
        maintenance_cost: {
          not: null,
        },
      },
      select: {
        maintenance_cost: true,
        maintenance_start_date: true,
      },
    });

    // Group and aggregate data
    let data = [];
    let totalExpenses = 0;

    if (period === 'monthly') {
      data = new Array(labels.length).fill(0);
      maintenances.forEach(maintenance => {
        const day = maintenance.maintenance_start_date.getDate();
        data[day - 1] += maintenance.maintenance_cost;
        totalExpenses += maintenance.maintenance_cost;
      });
    } else if (period === 'quarterly') {
      data = new Array(3).fill(0);
      const startMonth = (parseInt(quarter) - 1) * 3;
      maintenances.forEach(maintenance => {
        const monthIndex = maintenance.maintenance_start_date.getMonth() - startMonth;
        if (monthIndex >= 0 && monthIndex < 3) {
          data[monthIndex] += maintenance.maintenance_cost;
          totalExpenses += maintenance.maintenance_cost;
        }
      });
    } else if (period === 'yearly') {
      data = new Array(12).fill(0);
      maintenances.forEach(maintenance => {
        const monthIndex = maintenance.maintenance_start_date.getMonth();
        data[monthIndex] += maintenance.maintenance_cost;
        totalExpenses += maintenance.maintenance_cost;
      });
    }

    res.json({
      ok: true,
      data,
      labels,
      totalMaintenance: totalExpenses,
    });
  } catch (error) {
    console.error('Error fetching expenses data:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch expenses data',
    });
  }
};

// Get refunds data based on period
export const getRefundsData = async (req, res) => {
  try {
    const { period, year, month, quarter } = req.query;
    
    let startDate, endDate, labels = [];
    const currentYear = parseInt(year) || new Date().getFullYear();
    
    // Define date ranges based on period (same logic as expenses)
    if (period === 'monthly') {
      const monthIndex = parseInt(month) || new Date().getMonth();
      startDate = new Date(currentYear, monthIndex, 1);
      endDate = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);
      
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(`Day ${i}`);
      }
    } else if (period === 'quarterly') {
      const quarterNum = parseInt(quarter) || 1;
      const startMonth = (quarterNum - 1) * 3;
      startDate = new Date(currentYear, startMonth, 1);
      endDate = new Date(currentYear, startMonth + 3, 0, 23, 59, 59);
      
      labels = ['Month 1', 'Month 2', 'Month 3'];
    } else if (period === 'yearly') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
      
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    // Query refunds within the date range
    const refunds = await prisma.refund.findMany({
      where: {
        refund_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        refund_amount: true,
        refund_date: true,
      },
    });

    // Group and aggregate data
    let data = [];
    let totalRefunds = 0;

    if (period === 'monthly') {
      data = new Array(labels.length).fill(0);
      refunds.forEach(refund => {
        const day = refund.refund_date.getDate();
        data[day - 1] += refund.refund_amount;
        totalRefunds += refund.refund_amount;
      });
    } else if (period === 'quarterly') {
      data = new Array(3).fill(0);
      const startMonth = (parseInt(quarter) - 1) * 3;
      refunds.forEach(refund => {
        const monthIndex = refund.refund_date.getMonth() - startMonth;
        if (monthIndex >= 0 && monthIndex < 3) {
          data[monthIndex] += refund.refund_amount;
          totalRefunds += refund.refund_amount;
        }
      });
    } else if (period === 'yearly') {
      data = new Array(12).fill(0);
      refunds.forEach(refund => {
        const monthIndex = refund.refund_date.getMonth();
        data[monthIndex] += refund.refund_amount;
        totalRefunds += refund.refund_amount;
      });
    }

    res.json({
      ok: true,
      data,
      labels,
      totalRefunds,
    });
  } catch (error) {
    console.error('Error fetching refunds data:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch refunds data',
    });
  }
};

// Get top cars data based on period
export const getTopCarsData = async (req, res) => {
  try {
    const { period, year, month, quarter } = req.query;
    
    let startDate, endDate;
    const currentYear = parseInt(year) || new Date().getFullYear();
    
    // Define date ranges
    if (period === 'monthly') {
      const monthIndex = parseInt(month) || new Date().getMonth();
      startDate = new Date(currentYear, monthIndex, 1);
      endDate = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);
    } else if (period === 'quarterly') {
      const quarterNum = parseInt(quarter) || 1;
      const startMonth = (quarterNum - 1) * 3;
      startDate = new Date(currentYear, startMonth, 1);
      endDate = new Date(currentYear, startMonth + 3, 0, 23, 59, 59);
    } else if (period === 'yearly') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    }

    // Query bookings within date range and group by car
    const topCars = await prisma.booking.groupBy({
      by: ['car_id'],
      where: {
        booking_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        booking_id: true,
      },
      orderBy: {
        _count: {
          booking_id: 'desc',
        },
      },
      take: 6, // Top 6 cars
    });

    // Get car details for the top cars
    const carIds = topCars.map(car => car.car_id);
    const carDetails = await prisma.car.findMany({
      where: {
        car_id: {
          in: carIds,
        },
      },
      select: {
        car_id: true,
        make: true,
        model: true,
      },
    });

    // Map the data
    const labels = [];
    const data = [];
    
    topCars.forEach(carData => {
      const car = carDetails.find(c => c.car_id === carData.car_id);
      if (car) {
        labels.push(`${car.make} ${car.model}`);
        data.push(carData._count.booking_id);
      }
    });

    res.json({
      ok: true,
      data,
      labels,
    });
  } catch (error) {
    console.error('Error fetching top cars data:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch top cars data',
    });
  }
};

// Get top customers data based on period
export const getTopCustomersData = async (req, res) => {
  try {
    const { period, year, month, quarter } = req.query;
    
    let startDate, endDate;
    const currentYear = parseInt(year) || new Date().getFullYear();
    
    // Define date ranges
    if (period === 'monthly') {
      const monthIndex = parseInt(month) || new Date().getMonth();
      startDate = new Date(currentYear, monthIndex, 1);
      endDate = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);
    } else if (period === 'quarterly') {
      const quarterNum = parseInt(quarter) || 1;
      const startMonth = (quarterNum - 1) * 3;
      startDate = new Date(currentYear, startMonth, 1);
      endDate = new Date(currentYear, startMonth + 3, 0, 23, 59, 59);
    } else if (period === 'yearly') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    }

    // Query bookings within date range and group by customer
    const topCustomers = await prisma.booking.groupBy({
      by: ['customer_id'],
      where: {
        booking_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        booking_id: true,
      },
      orderBy: {
        _count: {
          booking_id: 'desc',
        },
      },
      take: 6, // Top 6 customers
    });

    // Get customer details for the top customers
    const customerIds = topCustomers.map(customer => customer.customer_id);
    const customerDetails = await prisma.customer.findMany({
      where: {
        customer_id: {
          in: customerIds,
        },
      },
      select: {
        customer_id: true,
        first_name: true,
        last_name: true,
      },
    });

    // Map the data
    const labels = [];
    const data = [];
    
    topCustomers.forEach(customerData => {
      const customer = customerDetails.find(c => c.customer_id === customerData.customer_id);
      if (customer) {
        labels.push(`${customer.first_name} ${customer.last_name}`);
        data.push(customerData._count.booking_id);
      }
    });

    res.json({
      ok: true,
      data,
      labels,
    });
  } catch (error) {
    console.error('Error fetching top customers data:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch top customers data',
    });
  }
};

// Get available years for dropdown
export const getAvailableYears = async (req, res) => {
  try {
    // Get years from payments, bookings, maintenance, and refunds
    const paymentYears = await prisma.payment.findMany({
      where: {
        paid_date: {
          not: null,
        },
      },
      select: {
        paid_date: true,
      },
    });

    const bookingYears = await prisma.booking.findMany({
      select: {
        booking_date: true,
      },
    });

    const maintenanceYears = await prisma.maintenance.findMany({
      where: {
        maintenance_start_date: {
          not: null,
        },
      },
      select: {
        maintenance_start_date: true,
      },
    });

    const refundYears = await prisma.refund.findMany({
      where: {
        refund_date: {
          not: null,
        },
      },
      select: {
        refund_date: true,
      },
    });

    // Extract unique years
    const years = new Set();
    
    paymentYears.forEach(payment => {
      if (payment.paid_date) {
        years.add(payment.paid_date.getFullYear());
      }
    });
    
    bookingYears.forEach(booking => {
      years.add(booking.booking_date.getFullYear());
    });

    maintenanceYears.forEach(maintenance => {
      if (maintenance.maintenance_start_date) {
        years.add(maintenance.maintenance_start_date.getFullYear());
      }
    });

    refundYears.forEach(refund => {
      if (refund.refund_date) {
        years.add(refund.refund_date.getFullYear());
      }
    });

    // Convert to sorted array
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    // If no data, return current year
    if (sortedYears.length === 0) {
      sortedYears.push(new Date().getFullYear());
    }

    res.json({
      ok: true,
      years: sortedYears,
    });
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch available years',
    });
  }
};