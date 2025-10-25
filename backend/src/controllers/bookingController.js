import prisma from "../config/prisma.js";
import {
  sendBookingSuccessNotification,
  sendBookingConfirmationNotification,
  sendPaymentReceivedNotification,
  sendCancellationApprovedNotification,
  sendAdminNewBookingNotification,
  sendAdminCancellationRequestNotification,
  sendCancellationDeniedNotification,
  sendAdminPaymentCompletedNotification,
  sendAdminExtensionRequestNotification,
  sendExtensionApprovedNotification,
  sendExtensionRejectedNotification,
  sendDriverAssignedNotification,
  sendDriverBookingConfirmedNotification,
} from "../utils/notificationService.js";
import {
  getPaginationParams,
  getSortingParams,
  buildPaginationResponse,
  getSearchParam,
} from "../utils/pagination.js";
import {
  validateBookingDates,
  getUnavailablePeriods,
} from "../utils/bookingUtils.js";

// @desc    Get all bookings with pagination (Admin)
// @route   GET /bookings?page=1&pageSize=10&sortBy=booking_date&sortOrder=desc&search=john&status=Pending
// @access  Private/Admin
export const getBookings = async (req, res) => {
  try {
    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, "booking_id", "desc");
    const search = getSearchParam(req);

    // Build where clause for filtering
    const where = {
      // Filter to show only Pending, Confirmed, and In Progress bookings
      // Exclude Completed and Cancelled bookings
      booking_status: {
        in: ["Pending", "Confirmed", "In Progress"],
      },
    };

    // Search filter (customer name or car model)
    if (search) {
      where.OR = [
        { customer: { first_name: { contains: search, mode: "insensitive" } } },
        { customer: { last_name: { contains: search, mode: "insensitive" } } },
        { car: { make: { contains: search, mode: "insensitive" } } },
        { car: { model: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Status filter (if provided, it will override the default filter)
    if (req.query.status) {
      where.booking_status = req.query.status;
    }

    // Payment status filter
    if (req.query.payment_status) {
      where.payment_status = req.query.payment_status;
    }

    // Get total count
    const total = await prisma.booking.count({ where });

    // Get paginated bookings
    const bookings = await prisma.booking.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true, year: true } },
        payments: { select: { amount: true } },
        extensions: {
          orderBy: { extension_id: "desc" },
          take: 1, // Get the latest extension only
          select: {
            extension_id: true,
            extension_status: true,
            approve_time: true,
          },
        },
      },
    });

    // Update balances in database and shape response
    const shaped = await Promise.all(
      bookings.map(async ({ customer, car, payments, extensions, ...rest }) => {
        const totalPaid =
          payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) ||
          0;
        const remainingBalance = (rest.total_amount || 0) - totalPaid;

        // Update the balance in the database if it's different
        if (rest.balance !== remainingBalance) {
          await prisma.booking.update({
            where: { booking_id: rest.booking_id },
            data: { balance: remainingBalance },
          });
        }

        // Get latest extension info
        const latestExtension = extensions?.[0] || null;

        return {
          ...rest,
          balance: remainingBalance,
          customer_name: `${customer?.first_name ?? ""} ${
            customer?.last_name ?? ""
          }`.trim(),
          car_model: [car?.make, car?.model].filter(Boolean).join(" "),
          total_paid: totalPaid,
          remaining_balance: remainingBalance,
          latest_extension: latestExtension, // Include extension info
        };
      })
    );

    res.json(buildPaginationResponse(shaped, total, page, pageSize));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true, year: true } },
        driver: { select: { first_name: true } },
        payments: { select: { amount: true } },
      },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const { customer, car, driver, payments, ...rest } = booking;

    const totalPaid =
      payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const remainingBalance = (rest.total_amount || 0) - totalPaid;

    // Update the balance in the database if it's different
    if (rest.balance !== remainingBalance) {
      await prisma.booking.update({
        where: { booking_id: rest.booking_id },
        data: { balance: remainingBalance },
      });
    }

    const shaped = {
      ...rest,
      balance: remainingBalance, // Use the calculated balance
      customer_name: `${customer?.first_name ?? ""} ${
        customer?.last_name ?? ""
      }`.trim(),
      car_model: [car?.make, car?.model].filter(Boolean).join(" "),
      driver_name: driver && driver.first_name ? driver.first_name : null,
      total_paid: totalPaid,
      remaining_balance: remainingBalance,
    };

    res.json(shaped);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

// @desc    Create a booking request (for customers)
// @route   POST /bookings
// @access  Private/Customer
export const createBookingRequest = async (req, res) => {
  try {
    const {
      car_id,
      customer_id,
      booking_date,
      purpose,
      start_date,
      end_date,
      pickup_time,
      pickup_loc,
      dropoff_loc,
      isSelfDriver,
      drivers_id,
      booking_type, // 'deliver' or 'pickup'
      delivery_location,
    } = req.body;
    // Validate required fields
    if (!car_id || !customer_id || !start_date || !end_date || !purpose) {
      return res.status(400).json({
        error:
          "Missing required fields: car_id, customer_id, start_date, end_date, purpose",
      });
    }

    // Check if car exists and is available
    const car = await prisma.car.findUnique({
      where: { car_id: parseInt(car_id) },
    });

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    // Create the booking
    const newBooking = await prisma.booking.create({
      data: {
        car_id: parseInt(car_id),
        customer_id: parseInt(customer_id),
        booking_date: new Date(booking_date || new Date()),
        purpose,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        pickup_time: pickup_time 
          ? (() => {
              // If pickup_time is a time string (HH:MM), combine with start_date in Philippine timezone
              if (typeof pickup_time === 'string' && pickup_time.includes(':') && !pickup_time.includes('T')) {
                const [hours, minutes] = pickup_time.split(':');
                const dateStr = start_date.split('T')[0]; // Get YYYY-MM-DD
                // Create ISO string with Philippine timezone offset (+08:00)
                const isoString = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000+08:00`;
                return new Date(isoString);
              }
              // Otherwise treat as full datetime
              return new Date(pickup_time);
            })()
          : new Date(start_date),
        pickup_loc: pickup_loc || delivery_location,
        dropoff_loc,
        isSelfDriver: Boolean(isSelfDriver),
        drivers_id: isSelfDriver
          ? null
          : drivers_id
          ? parseInt(drivers_id)
          : null,
        booking_status: "Pending", // Admin needs to approve
        payment_status: "Pending",
        total_amount: null, // Will be calculated by admin
        isExtend: false,
        isCancel: false,
        isRelease: false,
        isReturned: false,
      },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            rent_price: true,
          },
        },
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
    res.status(201).json({
      message: "Booking request submitted successfully",
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create booking request" });
  }
};

export const createBooking = async (req, res) => {
  try {
    // Extract customer_id from token
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        error: "Customer authentication required",
        tokenData: req.user,
      });
    }

    // Verify this is a customer
    if (req.user?.role !== "customer") {
      return res.status(403).json({
        error: "Only customers can create bookings",
        currentRole: req.user?.role,
      });
    }

    const {
      car_id,
      booking_date,
      purpose,
      start_date,
      end_date,
      pickup_time,
      pickup_loc,
      dropoff_time,
      dropoff_loc,
      rental_fee,
      total_amount,
      isSelfDriver,
      drivers_id,
      booking_type,
      delivery_location,
      // Frontend specific fields
      startDate,
      endDate,
      pickupTime,
      dropoffTime,
      deliveryType,
      deliveryLocation,
      pickupLocation,
      dropoffLocation,
      totalCost,
      isSelfDrive,
      selectedDriver,
    } = req.body;

    // Map frontend data to backend schema
    const startDateTime = new Date(start_date || startDate);
    const endDateTime = new Date(end_date || endDate);

    // Handle time fields - combine date with time for DateTime fields in Philippine timezone
    const pickupTimeStr = pickup_time || pickupTime || "09:00";
    const dropoffTimeStr = dropoff_time || dropoffTime || "17:00";

    // Create ISO string with Philippine timezone offset (+08:00)
    // This explicitly tells PostgreSQL timestamptz: "This time is in Philippine timezone"
    const [pickupHour, pickupMinute] = pickupTimeStr.split(":");
    const startDateStr = (start_date || startDate).split('T')[0]; // Get YYYY-MM-DD
    const pickupISOString = `${startDateStr}T${String(pickupHour).padStart(2, '0')}:${String(pickupMinute).padStart(2, '0')}:00.000+08:00`;
    const pickupDateTime = new Date(pickupISOString);

    const [dropoffHour, dropoffMinute] = dropoffTimeStr.split(":");
    const endDateStr = (end_date || endDate).split('T')[0]; // Get YYYY-MM-DD
    const dropoffISOString = `${endDateStr}T${String(dropoffHour).padStart(2, '0')}:${String(dropoffMinute).padStart(2, '0')}:00.000+08:00`;
    const dropoffDateTime = new Date(dropoffISOString);

    // Handle driver selection properly
    const driverId = drivers_id || selectedDriver;
    const finalDriverId =
      driverId && driverId !== "null" && driverId !== ""
        ? parseInt(driverId)
        : null;

    const bookingData = {
      customer_id: parseInt(customerId),
      car_id: parseInt(car_id),
      booking_date: booking_date ? new Date(booking_date) : new Date(),
      purpose: purpose || "Not specified",
      start_date: startDateTime,
      end_date: endDateTime,
      pickup_time: pickupDateTime,
      pickup_loc:
        pickup_loc ||
        pickupLocation ||
        deliveryLocation ||
        "JA Car Rental Office",
      dropoff_time: dropoffDateTime,
      dropoff_loc: dropoff_loc || dropoffLocation || "JA Car Rental Office",
      total_amount: Math.round(
        parseFloat(total_amount || totalCost || rental_fee || 0)
      ),
      payment_status: "Unpaid", // Changed from "pending" to "Unpaid"
      booking_status: "Pending", // Changed from "pending" to "Pending"
      isSelfDriver:
        isSelfDriver !== undefined
          ? isSelfDriver
          : isSelfDrive !== undefined
          ? isSelfDrive
          : true,
      drivers_id: finalDriverId,
      isExtend: false,
      isCancel: false,
      isRelease: false,
      isReturned: false,
      isPay: false,
      balance: Math.round(
        parseFloat(total_amount || totalCost || rental_fee || 0)
      ), // Balance equals total_amount by default
      isDeliver: deliveryType === "delivery",
      deliver_loc:
        deliveryType === "delivery" ? deliveryLocation || pickup_loc : null,
    };

    // Booking data processed successfully

    // Validate that customer exists
    const customerExists = await prisma.customer.findUnique({
      where: { customer_id: parseInt(customerId) },
    });

    if (!customerExists) {
      return res.status(404).json({
        error: "Customer not found",
        customer_id: customerId,
      });
    }

    // Validate that car exists
    const carExists = await prisma.car.findUnique({
      where: { car_id: parseInt(car_id) },
    });

    if (!carExists) {
      return res.status(404).json({
        error: "Car not found",
        car_id: car_id,
      });
    }

    // ✨ NEW: Check for date conflicts with existing bookings + maintenance periods
    const existingBookings = await prisma.booking.findMany({
      where: {
        car_id: parseInt(car_id),
        booking_status: {
          in: ["Pending", "Confirmed", "In Progress"],
        },
        isCancel: false,
      },
      select: {
        booking_id: true,
        start_date: true,
        end_date: true,
        booking_status: true,
        payment_status: true,
      },
    });
    const dateValidation = validateBookingDates(
      startDateTime,
      endDateTime,
      existingBookings,
      1
    );

    if (!dateValidation.isValid) {
      return res.status(409).json({
        error: "Date conflict",
        message: dateValidation.message,
        conflicts: dateValidation.conflicts.map((c) => ({
          start_date: c.start_date,
          end_date: c.end_date,
          reason: c.reason,
          booking_id: c.booking_id,
        })),
        suggestion:
          "Please choose different dates that don't overlap with existing bookings or maintenance periods.",
      });
    }
    // Validate driver if specified
    if (finalDriverId) {
      const driverExists = await prisma.driver.findUnique({
        where: { drivers_id: finalDriverId },
      });

      if (!driverExists) {
        return res.status(404).json({
          error: "Driver not found",
          driver_id: finalDriverId,
        });
      }
    }

    const newBooking = await prisma.booking.create({
      data: bookingData,
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
          },
        },
        car: {
          select: { make: true, model: true, year: true, license_plate: true },
        },
        driver: {
          select: {
            drivers_id: true,
            first_name: true,
            last_name: true,
            contact_no: true,
          },
        },
      },
    });

    // ✨ UPDATED: Only update car status to 'Rented' if booking starts today or is in the past
    // This allows advance bookings to coexist without blocking the car immediately
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingStart = new Date(startDateTime);
    bookingStart.setHours(0, 0, 0, 0);

    if (bookingStart <= today) {
      // Booking starts today or earlier - mark car as rented immediately
      try {
        await prisma.car.update({
          where: { car_id: parseInt(car_id) },
          data: { car_status: "Rented" },
        });
      } catch (carUpdateError) {
        // Don't fail the booking creation if car status update fails
      }
    } else {
    }

    // Create an initial payment record for the booking
    // This represents the amount due that customer needs to pay
    try {
      await prisma.payment.create({
        data: {
          booking_id: newBooking.booking_id,
          customer_id: parseInt(customerId),
          description: "User Booked the Car",
          amount: 0, // No payment made yet - customer hasn't paid anything
          payment_method: null, // Will be filled when customer pays
          paid_date: null, // Will be filled when customer pays
          balance: bookingData.total_amount, // Full amount initially unpaid
        },
      });
      // Payment record created successfully
    } catch (paymentError) {
      // Don't fail the booking creation if payment record fails
    }

    // Update driver booking_status if driver is assigned
    if (newBooking.drivers_id) {
      try {
        await prisma.driver.update({
          where: { drivers_id: newBooking.drivers_id },
          data: { booking_status: 1 }, // 1 = booking exists but not confirmed
        });
      } catch (driverUpdateError) {
        // Don't fail the booking creation if driver status update fails
      }

      // Send driver assignment notification (SMS only)
      if (newBooking.driver) {
        try {
          await sendDriverAssignedNotification(
            newBooking,
            {
              drivers_id: newBooking.driver.drivers_id,
              first_name: newBooking.driver.first_name,
              last_name: newBooking.driver.last_name,
              contact_no: newBooking.driver.contact_no,
            },
            {
              first_name: newBooking.customer.first_name,
              last_name: newBooking.customer.last_name,
              contact_no: newBooking.customer.contact_no,
            },
            {
              make: newBooking.car.make,
              model: newBooking.car.model,
              year: newBooking.car.year,
              license_plate: newBooking.car.license_plate,
            }
          );
        } catch (driverNotificationError) {
          // Don't fail the booking creation if driver notification fails
        }
      }
    }

    // Send booking success notification to customer
    try {
      await sendBookingSuccessNotification(
        newBooking,
        {
          customer_id: newBooking.customer_id,
          first_name: newBooking.customer.first_name,
          last_name: newBooking.customer.last_name,
          email: newBooking.customer.email,
          contact_no: newBooking.customer.contact_no,
        },
        {
          make: newBooking.car.make,
          model: newBooking.car.model,
          year: newBooking.car.year,
          license_plate: newBooking.car.license_plate,
        }
      );
    } catch (notificationError) {
      // Don't fail the booking creation if notification fails
    }

    // Send new booking notification to admin/staff
    try {
      await sendAdminNewBookingNotification(
        newBooking,
        {
          customer_id: newBooking.customer_id,
          first_name: newBooking.customer.first_name,
          last_name: newBooking.customer.last_name,
          email: newBooking.customer.email,
          contact_no: newBooking.customer.contact_no,
        },
        {
          make: newBooking.car.make,
          model: newBooking.car.model,
          year: newBooking.car.year,
          license_plate: newBooking.car.license_plate,
        }
      );
    } catch (adminNotificationError) {
      // Don't fail the booking creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: newBooking,
    });
  } catch (error) {
    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Duplicate booking constraint violation",
        details: error.message,
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        error:
          "Foreign key constraint failed - invalid car_id, customer_id, or driver_id",
        details: error.message,
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Record not found",
        details: error.message,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to create booking",
      details: error.message,
      code: error.code || "UNKNOWN_ERROR",
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const {
      customer_id,
      car_id,
      booking_date,
      purpose,
      start_date,
      end_date,
      pickup_time,
      pickup_loc,
      dropoff_time,
      dropoff_loc,
      refunds,
      isSelfDriver,
      isExtend,
      new_end_date,
      isCancel,
      total_amount,
      payment_status,
      isRelease,
      isReturned,
      booking_status,
      drivers_id,
      admin_id,
    } = req.body;

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        customer_id,
        car_id,
        booking_date,
        purpose,
        start_date,
        end_date,
        pickup_time,
        pickup_loc,
        dropoff_time,
        dropoff_loc,
        refunds,
        isSelfDriver,
        isExtend,
        new_end_date,
        isCancel,
        total_amount,
        payment_status,
        isRelease,
        isReturned,
        booking_status,
        drivers_id,
        admin_id,
        // Note: extensions, payments, releases, transactions are handled through relations
      },
    });

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: "Failed to update booking" });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    // Get the booking to find the car_id before deleting
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      select: { car_id: true },
    });

    // Delete the booking
    await prisma.booking.delete({ where: { booking_id: bookingId } });

    // Update car status back to 'Available' after booking is deleted
    if (booking?.car_id) {
      try {
        await prisma.car.update({
          where: { car_id: booking.car_id },
          data: { car_status: "Available" },
        });
      } catch (carUpdateError) {
      }
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete booking" });
  }
};

// @desc    Get customer's own bookings
// @route   GET /bookings/my-bookings/list
// @access  Private (Customer)
// @desc    Get customer's own bookings with pagination
// @route   GET /bookings/my-bookings?page=1&pageSize=10&status=Confirmed
// @access  Private/Customer
export const getMyBookings = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
    }

    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, "booking_date", "desc");

    // Build where clause
    const where = { customer_id: parseInt(customerId) };

    // Status filter
    if (req.query.status) {
      where.booking_status = req.query.status;
    }

    // Payment status filter
    if (req.query.payment_status) {
      where.payment_status = req.query.payment_status;
    }

    // Get total count
    const total = await prisma.booking.count({ where });

    // Get paginated bookings
    const bookings = await prisma.booking.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            license_plate: true,
            car_img_url: true,
          },
        },
        driver: {
          select: {
            first_name: true,
            last_name: true,
            driver_license_no: true,
          },
        },
        payments: {
          select: {
            payment_id: true,
            amount: true,
            paid_date: true,
            payment_method: true,
            balance: true,
          },
        },
      },
    });

    const shaped = bookings.map(
      ({ customer, car, driver, payments, ...rest }) => ({
        ...rest,
        customer_name: `${customer?.first_name ?? ""} ${
          customer?.last_name ?? ""
        }`.trim(),
        car_details: {
          make: car?.make,
          model: car?.model,
          year: car?.year,
          license_plate: car?.license_plate,
          image_url: car?.car_img_url,
          display_name: `${car?.make} ${car?.model} (${car?.year})`,
        },
        driver_details: driver
          ? {
              name: `${driver.first_name} ${driver.last_name}`,
              license: driver.driver_license_no,
            }
          : null,
        payment_info: payments || [],
        total_paid:
          payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) ||
          0,
        has_outstanding_balance:
          payments?.some((payment) => (payment.balance || 0) > 0) || false,
      })
    );

    res.json(buildPaginationResponse(shaped, total, page, pageSize));
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch your bookings",
      details: error.message,
    });
  }
};

// @desc    Cancel customer's own booking
// @route   PUT /bookings/:id/cancel
// @access  Private (Customer - own bookings only)
export const cancelMyBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
    }

    // Find the booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { car: { select: { make: true, model: true, year: true } } },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customer_id !== parseInt(customerId)) {
      return res
        .status(403)
        .json({ error: "You can only cancel your own bookings" });
    }

    // Check if booking can be cancelled
    if (booking.booking_status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    if (booking.isCancel) {
      return res
        .status(400)
        .json({ error: "Cancellation request already pending admin approval" });
    }

    if (
      booking.booking_status === "ongoing" ||
      booking.booking_status === "in progress"
    ) {
      return res
        .status(400)
        .json({ error: "Cannot cancel an ongoing booking" });
    }

    if (booking.booking_status === "completed") {
      return res
        .status(400)
        .json({ error: "Cannot cancel a completed booking" });
    }

    // Set isCancel flag to true - waiting for admin confirmation
    // Do NOT change booking_status to cancelled yet
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        isCancel: true,
        // booking_status remains unchanged until admin confirms
      },
      include: {
        car: {
          select: { make: true, model: true, year: true, license_plate: true },
        },
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
          },
        },
      },
    });

    // Send cancellation request notification to admin/staff
    try {
      await sendAdminCancellationRequestNotification(
        updatedBooking,
        {
          customer_id: updatedBooking.customer_id,
          first_name: updatedBooking.customer.first_name,
          last_name: updatedBooking.customer.last_name,
          email: updatedBooking.customer.email,
          contact_no: updatedBooking.customer.contact_no,
        },
        {
          make: updatedBooking.car.make,
          model: updatedBooking.car.model,
          year: updatedBooking.car.year,
          license_plate: updatedBooking.car.license_plate,
        }
      );
    } catch (adminNotificationError) {
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: `Cancellation request for ${updatedBooking.car.make} ${updatedBooking.car.model} has been submitted. Waiting for admin confirmation.`,
      booking: updatedBooking,
      pending_approval: true,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};

// @desc    Cancel booking by Admin/Staff
// @route   PUT /bookings/:id/admin-cancel
// @access  Private (Admin/Staff only)
export const adminCancelBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const adminId = req.user?.sub || req.user?.admin_id || req.user?.id;
    // Find the booking with all necessary details
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        car: { select: { car_id: true, make: true, model: true, year: true } },
        customer: {
          select: { customer_id: true, first_name: true, last_name: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if booking can be cancelled
    if (booking.booking_status === "Cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    if (booking.booking_status === "In Progress") {
      return res.status(400).json({
        error:
          "Cannot cancel an in-progress booking. Please return the vehicle first.",
      });
    }

    if (booking.booking_status === "Completed") {
      return res
        .status(400)
        .json({ error: "Cannot cancel a completed booking" });
    }

    // Update booking status to Cancelled
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        booking_status: "Cancelled",
        isCancel: false,
      },
      include: {
        car: { select: { make: true, model: true, year: true } },
        customer: { select: { first_name: true, last_name: true } },
      },
    });

    // Update car status back to 'Available' when booking is cancelled
    try {
      await prisma.car.update({
        where: { car_id: booking.car.car_id },
        data: { car_status: "Available" },
      });
    } catch (carUpdateError) {
    }

    // Create a transaction record for the cancellation
    try {
      await prisma.transaction.create({
        data: {
          booking_id: bookingId,
          customer_id: booking.customer.customer_id,
          car_id: booking.car.car_id,
          completion_date: null,
          cancellation_date: new Date(),
        },
      });
    } catch (transactionError) {
      // Don't fail the cancellation if transaction record creation fails
    }

    res.json({
      success: true,
      message: `Booking for ${updatedBooking.car.make} ${updatedBooking.car.model} has been cancelled`,
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to cancel booking",
      details: error.message,
    });
  }
};

// @desc    Confirm cancellation request (from CANCELLATION tab)
// @route   PUT /bookings/:id/confirm-cancellation
// @access  Private (Admin/Staff only)
export const confirmCancellationRequest = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const adminId = req.user?.sub || req.user?.admin_id || req.user?.id;
    // Find the booking with all necessary details
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        car: { select: { car_id: true, make: true, model: true, year: true } },
        customer: {
          select: { customer_id: true, first_name: true, last_name: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if booking has cancellation request
    if (!booking.isCancel) {
      return res
        .status(400)
        .json({ error: "No cancellation request found for this booking" });
    }

    // Check if booking is already cancelled
    if (booking.booking_status === "Cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    // Update booking status to Cancelled
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        booking_status: "Cancelled",
        isCancel: false,
      },
      include: {
        car: {
          select: { make: true, model: true, year: true, license_plate: true },
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
          },
        },
      },
    });

    // Update driver booking_status if driver was assigned
    if (updatedBooking.drivers_id) {
      try {
        await prisma.driver.update({
          where: { drivers_id: updatedBooking.drivers_id },
          data: { booking_status: 0 }, // 0 = no active booking
        });
      } catch (driverUpdateError) {
        // Don't fail the cancellation if driver status update fails
      }
    }

    // Update car status back to 'Available' when booking is cancelled
    try {
      await prisma.car.update({
        where: { car_id: booking.car.car_id },
        data: { car_status: "Available" },
      });
    } catch (carUpdateError) {
      // Don't fail the cancellation if car status update fails
    }

    // Send cancellation approved notification to customer
    try {
      await sendCancellationApprovedNotification(
        updatedBooking,
        {
          customer_id: updatedBooking.customer.customer_id,
          first_name: updatedBooking.customer.first_name,
          last_name: updatedBooking.customer.last_name,
          email: updatedBooking.customer.email,
          contact_no: updatedBooking.customer.contact_no,
        },
        {
          make: updatedBooking.car.make,
          model: updatedBooking.car.model,
          year: updatedBooking.car.year,
          license_plate: updatedBooking.car.license_plate,
        }
      );
    } catch (notificationError) {
      // Don't fail the cancellation if notification fails
    }

    // Create a transaction record for the cancellation with PH timezone
    try {
      // Get current time in PH timezone (UTC+8)
      const now = new Date();
      const phDate = new Date(now.getTime() + 8 * 60 * 60 * 1000);

      await prisma.transaction.create({
        data: {
          booking_id: bookingId,
          customer_id: booking.customer.customer_id,
          car_id: booking.car.car_id,
          completion_date: null,
          cancellation_date: phDate,
        },
      });
    } catch (transactionError) {
      // Don't fail the cancellation if transaction record creation fails
    }

    res.json({
      success: true,
      message: `Cancellation confirmed for ${updatedBooking.car.make} ${updatedBooking.car.model}`,
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to confirm cancellation",
      details: error.message,
    });
  }
};

// @desc    Reject cancellation request (set isCancel to false)
// @route   PUT /bookings/:id/reject-cancellation
// @access  Private (Admin/Staff only)
export const rejectCancellationRequest = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const adminId = req.user?.sub || req.user?.admin_id || req.user?.id;
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        car: { select: { make: true, model: true, year: true } },
        customer: { select: { first_name: true, last_name: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if booking has cancellation request
    if (!booking.isCancel) {
      return res
        .status(400)
        .json({ error: "No cancellation request found for this booking" });
    }

    // Set isCancel to false to reject the request
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        isCancel: false,
      },
      include: {
        car: {
          select: { make: true, model: true, year: true, license_plate: true },
        },
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
            isRecUpdate: true,
          },
        },
      },
    });

    // Send cancellation denied notification to customer
    try {
      await sendCancellationDeniedNotification(
        updatedBooking,
        {
          customer_id: updatedBooking.customer_id,
          first_name: updatedBooking.customer.first_name,
          last_name: updatedBooking.customer.last_name,
          email: updatedBooking.customer.email,
          contact_no: updatedBooking.customer.contact_no,
          isRecUpdate: updatedBooking.customer.isRecUpdate,
        },
        {
          make: updatedBooking.car.make,
          model: updatedBooking.car.model,
          year: updatedBooking.car.year,
          license_plate: updatedBooking.car.license_plate,
        }
      );
    } catch (notificationError) {
      // Don't fail the rejection if notification fails
    }

    res.json({
      success: true,
      message: `Cancellation request rejected for ${updatedBooking.car.make} ${updatedBooking.car.model}`,
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to reject cancellation",
      details: error.message,
    });
  }
};

// @desc    Extend customer's ongoing booking
// @route   PUT /bookings/:id/extend
// @access  Private (Customer - own bookings only)
export const extendMyBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;
    const { new_end_date, additional_days } = req.body;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
    }

    if (!new_end_date) {
      return res.status(400).json({ error: "New end date is required" });
    }

    // Find the booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            rent_price: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customer_id !== parseInt(customerId)) {
      return res
        .status(403)
        .json({ error: "You can only extend your own bookings" });
    }

    // Check if booking can be extended (must be ongoing or in progress)
    if (
      booking.booking_status !== "ongoing" &&
      booking.booking_status?.toLowerCase() !== "in progress"
    ) {
      return res.status(400).json({
        error: "Only ongoing/in progress bookings can be extended",
        current_status: booking.booking_status,
      });
    }

    if (booking.isExtend) {
      return res
        .status(400)
        .json({ error: "Extension request already pending admin approval" });
    }

    // Clean up any old approved but unpaid extensions before creating new request
    await prisma.extension.updateMany({
      where: {
        booking_id: bookingId,
        extension_status: "approved",
      },
      data: {
        extension_status: "Cancelled by Customer",
        rejection_reason: "Customer submitted a new extension request",
      },
    });

    // Calculate additional cost
    const originalEndDate = new Date(booking.end_date);
    const newEndDate = new Date(new_end_date);
    const additionalDays = Math.ceil(
      (newEndDate - originalEndDate) / (1000 * 60 * 60 * 24)
    );

    if (additionalDays <= 0) {
      return res
        .status(400)
        .json({ error: "New end date must be after the current end date" });
    }

    const additionalCost = additionalDays * (booking.car.rent_price || 0);
    const newTotalAmount = (booking.total_amount || 0) + additionalCost;
    const newBalance = (booking.balance || 0) + additionalCost;

    // Update booking: set isExtend flag, add additional cost to total_amount and balance
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        isExtend: true,
        new_end_date: newEndDate, // Store requested new end date
        total_amount: newTotalAmount, // Add additional cost to total amount
        balance: newBalance, // Add additional cost to balance
        payment_status: "Unpaid", // Set to Unpaid since there's new balance
      },
      include: {
        car: {
          select: { make: true, model: true, year: true, license_plate: true },
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
          },
        },
      },
    });

    // Create Extension record when customer requests extension
    await prisma.extension.create({
      data: {
        booking_id: bookingId,
        old_end_date: booking.end_date,
        new_end_date: newEndDate,
        approve_time: null, // Not yet approved
        extension_status: null, // Pending admin approval
      },
    });

    // Send admin notification for extension request
    try {
      await sendAdminExtensionRequestNotification(
        updatedBooking,
        {
          customer_id: updatedBooking.customer.customer_id,
          first_name: updatedBooking.customer.first_name,
          last_name: updatedBooking.customer.last_name,
          email: updatedBooking.customer.email,
          contact_no: updatedBooking.customer.contact_no,
        },
        {
          make: updatedBooking.car.make,
          model: updatedBooking.car.model,
          year: updatedBooking.car.year,
          license_plate: updatedBooking.car.license_plate,
        },
        additionalDays,
        additionalCost
      );
    } catch (notificationError) {
      // Don't fail the extension request if notification fails
    }

    res.json({
      success: true,
      message: `Extension request for ${additionalDays} days has been submitted. Waiting for admin confirmation.`,
      booking: updatedBooking,
      additional_cost: additionalCost,
      new_total: newTotalAmount,
      pending_approval: true,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to extend booking" });
  }
};

// @desc    Confirm extension request (Admin/Staff)
// @route   PUT /bookings/:id/confirm-extension
// @access  Private (Admin/Staff)
export const confirmExtensionRequest = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    // Find the booking with pending extension
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            license_plate: true,
            rent_price: true,
          },
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
            isRecUpdate: true,
          },
        },
        extensions: {
          where: {
            approve_time: null, // Find pending (unapproved) extension
          },
          orderBy: { extension_id: "desc" },
          take: 1,
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!booking.isExtend) {
      return res
        .status(400)
        .json({ error: "No pending extension request for this booking" });
    }

    if (!booking.new_end_date) {
      return res
        .status(400)
        .json({ error: "No new end date found for extension" });
    }

    // Find the pending extension record
    const pendingExtension = booking.extensions[0];
    if (!pendingExtension) {
      // No pending extension found - check if already approved
      const alreadyApproved = await prisma.extension.findFirst({
        where: {
          booking_id: bookingId,
          extension_status: "approved",
        },
        orderBy: { extension_id: "desc" },
      });

      if (alreadyApproved) {
        return res.status(400).json({
          error: "Extension already approved. Waiting for customer payment.",
        });
      }

      return res
        .status(404)
        .json({ error: "Pending extension record not found" });
    }

    // Calculate additional days and cost
    const originalEndDate = new Date(booking.end_date);
    const newEndDate = new Date(booking.new_end_date);
    const additionalDays = Math.ceil(
      (newEndDate - originalEndDate) / (1000 * 60 * 60 * 24)
    );
    const additionalCost = additionalDays * (booking.car.rent_price || 0);
    // Calculate new total amount and balance
    const newTotalAmount = (booking.total_amount || 0) + additionalCost;
    const newBalance = (booking.balance || 0) + additionalCost;

    // Get Philippine timezone date
    const now = new Date();
    const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    // UPDATE the existing extension record (don't create a new one!)
    await prisma.extension.update({
      where: { extension_id: pendingExtension.extension_id },
      data: {
        approve_time: phTime, // Timestamp when admin approved the extension
        extension_status: "approved", // Mark as approved, pending payment
      },
    });

    // IMPORTANT: Keep isExtend=true so booking stays in EXTENSION tab
    // DO NOT update end_date yet - only update after payment is confirmed
    // Update total_amount and balance to include extension cost
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        // DO NOT UPDATE end_date or dropoff_time yet - wait for payment confirmation
        // end_date: stays as original
        // new_end_date: stays as proposed new date
        isExtend: true, // KEEP TRUE so it stays in EXTENSION tab
        total_amount: newTotalAmount, // Add extension cost to total
        balance: newBalance, // Add extension cost to balance
        payment_status: "Unpaid", // Set to Unpaid since customer needs to pay extension
        extension_payment_deadline: null, // Clear extension payment deadline after approval
        isPay: false, // Reset isPay since customer hasn't paid extension fee yet
      },
    });
    // Send customer notification for extension approval
    try {
      await sendExtensionApprovedNotification(
        {
          ...updatedBooking,
          total_amount: newTotalAmount,
          balance: newBalance,
        },
        {
          customer_id: booking.customer.customer_id,
          first_name: booking.customer.first_name,
          last_name: booking.customer.last_name,
          email: booking.customer.email,
          contact_no: booking.customer.contact_no,
          isRecUpdate: booking.customer.isRecUpdate,
        },
        {
          make: booking.car.make,
          model: booking.car.model,
          year: booking.car.year,
          license_plate: booking.car.license_plate,
        },
        additionalDays,
        additionalCost
      );
    } catch (notificationError) {
      // Don't fail the confirmation if notification fails
    }

    res.json({
      success: true,
      message: "Extension request confirmed successfully",
      booking: updatedBooking,
      additional_cost: additionalCost,
      new_total_amount: newTotalAmount,
      new_balance: newBalance,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to confirm extension request" });
  }
};

// @desc    Reject extension request (Admin/Staff)
// @route   PUT /bookings/:id/reject-extension
// @access  Private (Admin/Staff)
export const rejectExtensionRequest = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            license_plate: true,
            rent_price: true,
          },
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
            isRecUpdate: true,
          },
        },
        extensions: {
          where: {
            approve_time: null, // Only pending extensions
          },
          orderBy: { extension_id: "desc" },
          take: 1,
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!booking.isExtend) {
      return res
        .status(400)
        .json({ error: "No pending extension request for this booking" });
    }

    if (!booking.new_end_date) {
      return res
        .status(400)
        .json({ error: "No new end date found for extension" });
    }

    // Calculate the additional cost that was added
    const originalEndDate = new Date(booking.end_date);
    const newEndDate = new Date(booking.new_end_date);
    const additionalDays = Math.ceil(
      (newEndDate - originalEndDate) / (1000 * 60 * 60 * 24)
    );
    const additionalCost = additionalDays * (booking.car.rent_price || 0);

    // Deduct the additional cost from total_amount and balance
    const restoredTotalAmount = (booking.total_amount || 0) - additionalCost;
    const restoredBalance = (booking.balance || 0) - additionalCost;

    // Determine payment status based on restored balance
    const paymentStatus = restoredBalance <= 0 ? "Paid" : "Unpaid";

    // Update Extension record (mark as rejected)
    const pendingExtension = booking.extensions[0];
    if (pendingExtension) {
      await prisma.extension.update({
        where: { extension_id: pendingExtension.extension_id },
        data: {
          extension_status: "Rejected",
          rejection_reason:
            req.body.reason || "Extension request rejected by admin",
        },
      });
    }

    // Update booking: clear new_end_date, set isExtend to false, restore total_amount and balance
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        new_end_date: null, // Clear new_end_date
        isExtend: false, // Clear extension flag
        total_amount: restoredTotalAmount, // Deduct additional cost
        balance: restoredBalance, // Deduct additional cost
        payment_status: paymentStatus, // Update payment status
        extension_payment_deadline: null, // Clear payment deadline
      },
    });

    // Send customer notification for extension rejection
    try {
      await sendExtensionRejectedNotification(
        updatedBooking,
        {
          customer_id: booking.customer.customer_id,
          first_name: booking.customer.first_name,
          last_name: booking.customer.last_name,
          email: booking.customer.email,
          contact_no: booking.customer.contact_no,
          isRecUpdate: booking.customer.isRecUpdate,
        },
        {
          make: booking.car.make,
          model: booking.car.model,
          year: booking.car.year,
          license_plate: booking.car.license_plate,
        },
        additionalDays,
        additionalCost
      );
    } catch (notificationError) {
      // Don't fail the rejection if notification fails
    }

    res.json({
      success: true,
      message: "Extension request rejected successfully",
      booking: updatedBooking,
      deducted_amount: additionalCost,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject extension request" });
  }
};

// @desc    Customer cancels their own pending extension request
// @route   POST /bookings/:id/cancel-extension
// @access  Private (Customer - own bookings only)
export const cancelExtensionRequest = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
    }

    // Find the booking with pending extension
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            license_plate: true,
            rent_price: true,
          },
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
            isRecUpdate: true,
          },
        },
        extensions: {
          where: {
            OR: [
              { approve_time: null }, // Unapproved extensions
              { extension_status: "approved" }, // Approved but unpaid extensions
            ],
          },
          orderBy: { extension_id: "desc" },
          take: 1,
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Verify customer owns this booking
    if (booking.customer_id !== parseInt(customerId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to cancel this extension" });
    }

    // Check if there's a pending extension
    if (!booking.isExtend) {
      return res
        .status(400)
        .json({ error: "No pending extension request to cancel" });
    }

    if (!booking.new_end_date) {
      return res.status(400).json({ error: "No pending extension found" });
    }

    const pendingExtension = booking.extensions[0];
    if (!pendingExtension) {
      return res
        .status(404)
        .json({ error: "Pending extension record not found" });
    }

    // Calculate the additional cost to revert
    const originalEndDate = new Date(booking.end_date);
    const newEndDate = new Date(booking.new_end_date);
    const additionalDays = Math.ceil(
      (newEndDate - originalEndDate) / (1000 * 60 * 60 * 24)
    );
    const additionalCost = additionalDays * (booking.car.rent_price || 0);

    // Restore original amounts
    const restoredTotalAmount = (booking.total_amount || 0) - additionalCost;
    const restoredBalance = (booking.balance || 0) - additionalCost;
    const paymentStatus = restoredBalance <= 0 ? "Paid" : "Unpaid";

    // Update Extension record (mark as cancelled by customer)
    await prisma.extension.update({
      where: { extension_id: pendingExtension.extension_id },
      data: {
        extension_status: "Cancelled by Customer",
        rejection_reason: "Customer cancelled the extension request",
      },
    });

    // Revert Booking to original state
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        new_end_date: null,
        isExtend: false,
        total_amount: restoredTotalAmount,
        balance: restoredBalance,
        payment_status: paymentStatus,
        extension_payment_deadline: null,
      },
    });
    res.json({
      success: true,
      message: "Extension request cancelled successfully",
      booking: {
        booking_id: updatedBooking.booking_id,
        end_date: updatedBooking.end_date,
        total_amount: restoredTotalAmount,
        balance: restoredBalance,
        payment_status: paymentStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel extension request" });
  }
};

// @desc    Update customer's own booking (for pending bookings only)
// @route   PUT /bookings/:id/update
// @access  Private (Customer - own bookings only)
export const updateMyBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
    }

    const {
      purpose,
      start_date,
      end_date,
      pickup_time,
      dropoff_time,
      pickup_loc,
      dropoff_loc,
      isSelfDriver,
      drivers_id,
      total_amount,
    } = req.body;

    // Find the booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { car: { select: { make: true, model: true, year: true } } },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customer_id !== parseInt(customerId)) {
      return res
        .status(403)
        .json({ error: "You can only update your own bookings" });
    }

    // Check if booking can be updated (must be pending)
    if (booking.booking_status !== "Pending") {
      return res.status(400).json({
        error: "Only pending bookings can be updated",
        current_status: booking.booking_status,
      });
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        purpose,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        // ✅ FIX: Store times with Philippine timezone context using ISO string
        pickup_time:
          pickup_time && start_date
            ? (() => {
                const [hours, minutes] = pickup_time.split(":").map(Number);
                // Get just the date part (YYYY-MM-DD) from start_date
                const dateStr = start_date.split("T")[0]; // Handles both "2025-10-17" and "2025-10-17T00:00:00"
                // Create ISO string with Philippine timezone offset (+08:00)
                // This explicitly states: "This time is in Philippine timezone"
                const isoString = `${dateStr}T${String(hours).padStart(
                  2,
                  "0"
                )}:${String(minutes).padStart(2, "0")}:00.000+08:00`;
                const result = new Date(isoString);
                return result;
              })()
            : undefined,
        dropoff_time:
          dropoff_time && end_date
            ? (() => {
                const [hours, minutes] = dropoff_time.split(":").map(Number);
                // Get just the date part (YYYY-MM-DD) from end_date
                const dateStr = end_date.split("T")[0]; // Handles both "2025-10-20" and "2025-10-20T00:00:00"
                // Create ISO string with Philippine timezone offset (+08:00)
                const isoString = `${dateStr}T${String(hours).padStart(
                  2,
                  "0"
                )}:${String(minutes).padStart(2, "0")}:00.000+08:00`;
                const result = new Date(isoString);
                return result;
              })()
            : undefined,
        pickup_loc,
        dropoff_loc,
        isSelfDriver: isSelfDriver ?? booking.isSelfDriver,
        drivers_id: isSelfDriver
          ? null
          : drivers_id
          ? parseInt(drivers_id)
          : booking.drivers_id,
        total_amount: total_amount || booking.total_amount,
      },
      include: {
        car: { select: { make: true, model: true, year: true } },
        driver: { select: { first_name: true, last_name: true } },
      },
    });

    res.json({
      success: true,
      message: `Booking for ${updatedBooking.car.make} ${updatedBooking.car.model} has been updated`,
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update booking" });
  }
};

// @desc    Create payment records for existing bookings without them
// @route   POST /bookings/create-missing-payments
// @access  Private (Admin)
export const createMissingPaymentRecords = async (req, res) => {
  try {
    // Find all bookings without payment records
    const bookingsWithoutPayments = await prisma.booking.findMany({
      where: {
        payments: {
          none: {},
        },
      },
      include: {
        car: { select: { make: true, model: true } },
      },
    });
    let createdCount = 0;
    for (const booking of bookingsWithoutPayments) {
      try {
        await prisma.payment.create({
          data: {
            booking_id: booking.booking_id,
            customer_id: booking.customer_id,
            description: "User Booked the Car",
            amount: 0, // No payment made yet
            balance: booking.total_amount || 0,
            payment_method: null,
            paid_date: null,
          },
        });
        createdCount++;
      } catch (error) {
      }
    }

    res.json({
      success: true,
      message: `Created ${createdCount} payment records out of ${bookingsWithoutPayments.length} bookings`,
      createdCount,
      totalBookings: bookingsWithoutPayments.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create missing payment records" });
  }
};

// Confirm booking - Logic based on isPay TRUE and booking status
export const confirmBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    // Get current booking with payments to calculate total paid
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        payments: {
          select: { amount: true },
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
          },
        },
        car: {
          select: {
            car_id: true,
            make: true,
            model: true,
            year: true,
            license_plate: true,
          },
        },
        driver: {
          select: {
            drivers_id: true,
            first_name: true,
            last_name: true,
            contact_no: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Calculate total amount paid
    const totalPaid =
      booking.payments?.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ) || 0;

    // Log current booking state for debugging
    // Normalize booking status comparison (case-insensitive)
    const normalizedStatus = booking.booking_status?.toLowerCase();

    let updatedBooking;
    let shouldSendConfirmation = false;

    // CASE A: isPay is TRUE and status is Pending - Single-click confirmation
    if (booking.isPay === true && normalizedStatus === "pending") {
      let updateData = {
        isPay: false, // Clear payment flag after confirmation
      };

      // Only confirm booking if total paid >= 1000, otherwise keep as Pending
      if (totalPaid >= 1000) {
        updateData.booking_status = "Confirmed";
        shouldSendConfirmation = true; // Send booking confirmation notification
      } else {
        updateData.booking_status = "Pending"; // Keep as Pending
      }

      // Check if balance is 0 or less and update payment_status to Paid
      if (booking.balance <= 0) {
        updateData.payment_status = "Paid";
      }

      updatedBooking = await prisma.booking.update({
        where: { booking_id: bookingId },
        data: updateData,
      });
    }
    // CASE B: isPay is TRUE and status is Confirmed - Additional payment on confirmed booking
    else if (booking.isPay === true && normalizedStatus === "confirmed") {
      let updateData = {
        isPay: false, // Clear payment flag after processing
      };

      // Check if balance is 0 or less and update payment_status to Paid
      if (booking.balance <= 0) {
        updateData.payment_status = "Paid";
      }

      updatedBooking = await prisma.booking.update({
        where: { booking_id: bookingId },
        data: updateData,
      });
    }
    // CASE C: isPay is TRUE and status is In Progress - Extension payment confirmation
    else if (booking.isPay === true && normalizedStatus === "in progress") {
      // Check if there's a pending extension (isExtend=true and new_end_date exists)
      if (!booking.isExtend || !booking.new_end_date) {
        return res.status(400).json({
          error: "No pending extension found for this booking",
        });
      }

      // Calculate new dropoff_time by preserving the time from old dropoff but using the new date
      let newDropoffTime = null;
      if (booking.dropoff_time) {
        const oldDropoff = new Date(booking.dropoff_time);
        const newEndDate = new Date(booking.new_end_date);

        // Create new dropoff time: new end date + old dropoff time
        newDropoffTime = new Date(
          newEndDate.getFullYear(),
          newEndDate.getMonth(),
          newEndDate.getDate(),
          oldDropoff.getHours(),
          oldDropoff.getMinutes(),
          oldDropoff.getSeconds(),
          oldDropoff.getMilliseconds()
        );
      }

      let updateData = {
        isPay: false, // Clear payment flag
        isExtend: false, // Clear extension flag - extension is now complete
        isExtended: true, // Mark as extended
        end_date: booking.new_end_date, // Apply new end date
        dropoff_time: newDropoffTime, // Update dropoff time
        new_end_date: null, // Clear new_end_date
      };

      // Check if balance is 0 or less and update payment_status to Paid
      if (booking.balance <= 0) {
        updateData.payment_status = "Paid";
      }

      // Update extension record to mark as completed (find the latest approved extension)
      const approvedExtension = await prisma.extension.findFirst({
        where: {
          booking_id: bookingId,
          extension_status: "approved",
        },
        orderBy: { extension_id: "desc" },
      });
      if (approvedExtension) {
        await prisma.extension.update({
          where: { extension_id: approvedExtension.extension_id },
          data: {
            extension_status: "completed",
          },
        });
      } else {
      }

      // Also mark any OTHER approved extensions as "completed" (cleanup duplicates)
      const otherApprovedExtensions = await prisma.extension.updateMany({
        where: {
          booking_id: bookingId,
          extension_status: "approved",
        },
        data: {
          extension_status: "completed",
        },
      });

      if (otherApprovedExtensions.count > 0) {
      }

      updatedBooking = await prisma.booking.update({
        where: { booking_id: bookingId },
        data: updateData,
      });
    }
    // CASE D: Invalid state
    else {
      return res.status(400).json({
        error: "Invalid booking state",
        message: `Cannot process this booking. Status: ${booking.booking_status}, isPay: ${booking.isPay}`,
        currentStatus: booking.booking_status,
        currentIsPay: booking.isPay,
      });
    }

    // Update driver booking_status if driver is assigned and booking was confirmed
    if (booking.drivers_id && updatedBooking.booking_status === "Confirmed") {
      try {
        await prisma.driver.update({
          where: { drivers_id: booking.drivers_id },
          data: { booking_status: 2 }, // 2 = booking confirmed but not released
        });
      } catch (driverUpdateError) {
        // Don't fail the confirmation if driver status update fails
      }

      // Send driver booking confirmed notification (SMS only)
      if (booking.driver) {
        try {
          await sendDriverBookingConfirmedNotification(
            updatedBooking,
            {
              drivers_id: booking.driver.drivers_id,
              first_name: booking.driver.first_name,
              last_name: booking.driver.last_name,
              contact_no: booking.driver.contact_no,
            },
            {
              first_name: booking.customer.first_name,
              last_name: booking.customer.last_name,
              contact_no: booking.customer.contact_no,
            },
            {
              make: booking.car.make,
              model: booking.car.model,
              year: booking.car.year,
              license_plate: booking.car.license_plate,
            }
          );
        } catch (driverNotificationError) {
          // Don't fail the confirmation if driver notification fails
        }
      }
    }

    // Send payment received notification (for GCash approval)
    // This happens when admin approves a GCash payment request
    try {
      // Get the latest payment for this booking
      const latestPayment = await prisma.payment.findFirst({
        where: { booking_id: bookingId },
        orderBy: { paid_date: "desc" },
      });

      if (latestPayment && latestPayment.payment_method === "GCash") {
        await sendPaymentReceivedNotification(
          latestPayment,
          {
            customer_id: booking.customer.customer_id,
            first_name: booking.customer.first_name,
            last_name: booking.customer.last_name,
            email: booking.customer.email,
            contact_no: booking.customer.contact_no,
          },
          {
            make: booking.car.make,
            model: booking.car.model,
            year: booking.car.year,
            license_plate: booking.car.license_plate,
          },
          { ...booking, balance: updatedBooking.balance },
          "gcash"
        );
        // Send admin notification for GCash payment approval
        await sendAdminPaymentCompletedNotification(
          latestPayment,
          {
            customer_id: booking.customer.customer_id,
            first_name: booking.customer.first_name,
            last_name: booking.customer.last_name,
            email: booking.customer.email,
            contact_no: booking.customer.contact_no,
          },
          {
            booking_id: booking.booking_id,
            start_date: booking.start_date,
            end_date: booking.end_date,
            total_amount: booking.total_amount,
            balance: updatedBooking.balance,
          },
          {
            make: booking.car.make,
            model: booking.car.model,
            year: booking.car.year,
            license_plate: booking.car.license_plate,
          },
          "gcash"
        );
      }
    } catch (notificationError) {
      // Don't fail the confirmation if notification fails
    }

    // Send booking confirmation notification if booking was just confirmed
    if (shouldSendConfirmation) {
      try {
        await sendBookingConfirmationNotification(
          { ...booking, ...updateData }, // Merge updated data with booking
          {
            customer_id: booking.customer.customer_id,
            first_name: booking.customer.first_name,
            last_name: booking.customer.last_name,
            email: booking.customer.email,
            contact_no: booking.customer.contact_no,
          },
          {
            make: booking.car.make,
            model: booking.car.model,
            year: booking.car.year,
            license_plate: booking.car.license_plate,
          }
        );
      } catch (notificationError) {
        // Don't fail the confirmation if notification fails
      }
    }

    // Determine the appropriate response message
    let responseMessage = "Payment accepted successfully";
    if (updatedBooking.booking_status === "Confirmed") {
      responseMessage = "Booking confirmed successfully";
    } else if (updatedBooking.booking_status === "Pending") {
      responseMessage = "Payment accepted successfully";
    }

    res.json({
      message: responseMessage,
      booking: updatedBooking,
      totalPaid: totalPaid,
      isConfirmed: updatedBooking.booking_status === "Confirmed",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to confirm booking",
      details: error.message,
    });
  }
};

// Update isPay status
export const updateIsPayStatus = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { isPay } = req.body;

    if (typeof isPay !== "boolean") {
      return res.status(400).json({ error: "isPay must be a boolean value" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: { isPay },
    });

    res.json({
      message: "isPay status updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update isPay status" });
  }
};
