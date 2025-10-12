import prisma from "../config/prisma.js";

export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true, year: true } },
        payments: { select: { amount: true } },
      },
    });

    // Update balances in database and shape response
    const shaped = await Promise.all(
      bookings.map(async ({ customer, car, payments, ...rest }) => {
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

        return {
          ...rest,
          balance: remainingBalance, // Use the calculated balance
          customer_name: `${customer?.first_name ?? ""} ${
            customer?.last_name ?? ""
          }`.trim(),
          car_model: [car?.make, car?.model].filter(Boolean).join(" "),
          total_paid: totalPaid,
          remaining_balance: remainingBalance,
        };
      })
    );

    res.json(shaped);
  } catch (error) {
    console.error("Error fetching bookings:", error);
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
    console.error("Error fetching booking:", error);
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

    console.log("Creating booking request with data:", req.body);

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
        pickup_time: pickup_time ? new Date(pickup_time) : new Date(start_date),
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

    console.log("Booking created successfully:", newBooking.booking_id);

    res.status(201).json({
      message: "Booking request submitted successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking request:", error);
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

    // Handle time fields - combine date with time for DateTime fields
    const pickupTimeStr = pickup_time || pickupTime || "09:00";
    const dropoffTimeStr = dropoff_time || dropoffTime || "17:00";

    // Create DateTime objects by combining date and time
    const pickupDateTime = new Date(startDateTime);
    const [pickupHour, pickupMinute] = pickupTimeStr.split(":");
    pickupDateTime.setHours(parseInt(pickupHour), parseInt(pickupMinute), 0, 0);

    const dropoffDateTime = new Date(endDateTime);
    const [dropoffHour, dropoffMinute] = dropoffTimeStr.split(":");
    dropoffDateTime.setHours(
      parseInt(dropoffHour),
      parseInt(dropoffMinute),
      0,
      0
    );

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
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true, year: true } },
      },
    });

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
      console.error("Error creating payment record:", paymentError);
      // Don't fail the booking creation if payment record fails
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);

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
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    await prisma.booking.delete({ where: { booking_id: bookingId } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};

// @desc    Get customer's own bookings
// @route   GET /bookings/my-bookings/list
// @access  Private (Customer)
export const getMyBookings = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
    }

    const bookings = await prisma.booking.findMany({
      where: { customer_id: parseInt(customerId) },
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
      orderBy: { booking_date: "desc" },
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

    res.json(shaped);
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
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
      return res.status(400).json({ error: "Cancellation request already pending admin approval" });
    }

    if (booking.booking_status === "ongoing" || booking.booking_status === "in progress") {
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
        car: { select: { make: true, model: true, year: true } },
        customer: { select: { first_name: true, last_name: true } },
      },
    });

    res.json({
      success: true,
      message: `Cancellation request for ${updatedBooking.car.make} ${updatedBooking.car.model} has been submitted. Waiting for admin confirmation.`,
      booking: updatedBooking,
      pending_approval: true,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
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

    console.log('Admin cancelling booking:', {
      bookingId,
      adminId,
      userRole: req.user?.role
    });

    // Find the booking with all necessary details
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        car: { select: { car_id: true, make: true, model: true, year: true } },
        customer: { select: { customer_id: true, first_name: true, last_name: true } }
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
        error: "Cannot cancel an in-progress booking. Please return the vehicle first." 
      });
    }

    if (booking.booking_status === "Completed") {
      return res.status(400).json({ error: "Cannot cancel a completed booking" });
    }

    // Update booking status to Cancelled
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        booking_status: "Cancelled",
        isCancel: true,
      },
      include: {
        car: { select: { make: true, model: true, year: true } },
        customer: { select: { first_name: true, last_name: true } }
      },
    });

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
      console.log(`Transaction record created for cancelled booking ${bookingId}`);
    } catch (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't fail the cancellation if transaction record creation fails
    }

    res.json({
      success: true,
      message: `Booking for ${updatedBooking.car.make} ${updatedBooking.car.model} has been cancelled`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ 
      error: "Failed to cancel booking",
      details: error.message 
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
    if (booking.booking_status !== "ongoing" && booking.booking_status?.toLowerCase() !== "in progress") {
      return res.status(400).json({
        error: "Only ongoing/in progress bookings can be extended",
        current_status: booking.booking_status,
      });
    }

    if (booking.isExtend) {
      return res.status(400).json({ error: "Extension request already pending admin approval" });
    }

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

    // Set isExtend flag to true - waiting for admin confirmation
    // Do NOT update end_date and total_amount yet
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        isExtend: true,
        new_end_date: newEndDate, // Store requested new end date
        // end_date and total_amount remain unchanged until admin confirms
      },
      include: {
        car: { select: { make: true, model: true, year: true } },
        customer: { select: { first_name: true, last_name: true } },
      },
    });

    res.json({
      success: true,
      message: `Extension request for ${additionalDays} days has been submitted. Waiting for admin confirmation.`,
      booking: updatedBooking,
      additional_cost: additionalCost,
      new_total: newTotalAmount,
      pending_approval: true,
    });
  } catch (error) {
    console.error("Error extending booking:", error);
    res.status(500).json({ error: "Failed to extend booking" });
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
    if (booking.booking_status !== "pending") {
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
        pickup_time: pickup_time
          ? new Date(`1970-01-01T${pickup_time}:00`)
          : undefined,
        dropoff_time: dropoff_time
          ? new Date(`1970-01-01T${dropoff_time}:00`)
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
    console.error("Error updating booking:", error);
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

    console.log(
      `Found ${bookingsWithoutPayments.length} bookings without payment records`
    );

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
        console.log(`Created payment record for booking ${booking.booking_id}`);
      } catch (error) {
        console.error(
          `Failed to create payment for booking ${booking.booking_id}:`,
          error
        );
      }
    }

    res.json({
      success: true,
      message: `Created ${createdCount} payment records out of ${bookingsWithoutPayments.length} bookings`,
      createdCount,
      totalBookings: bookingsWithoutPayments.length,
    });
  } catch (error) {
    console.error("Error creating missing payment records:", error);
    res.status(500).json({ error: "Failed to create missing payment records" });
  }
};

// Confirm booking - Logic based on isPay TRUE and booking status
export const confirmBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Log current booking state for debugging
    console.log('Confirming booking:', {
      bookingId,
      currentStatus: booking.booking_status,
      currentIsPay: booking.isPay,
      isPay_type: typeof booking.isPay
    });

    // Normalize booking status comparison (case-insensitive)
    const normalizedStatus = booking.booking_status?.toLowerCase();
    
    // Check if isPay is TRUE (required for both cases)
    if (booking.isPay !== true) {
      return res.status(400).json({ 
        error: 'Cannot confirm booking',
        message: 'isPay must be TRUE to confirm booking',
        currentIsPay: booking.isPay
      });
    }

    let updateData = {
      isPay: false  // Always set isPay to false
    };
    
    // Case 1: isPay is TRUE and status is Pending -> Change to Confirmed and isPay to FALSE
    if (normalizedStatus === 'pending') {
      updateData.booking_status = 'Confirmed';
      console.log('Action: Pending -> Confirmed, isPay -> false');
    } 
    // Case 2: isPay is TRUE and status is Confirmed -> Just set isPay to FALSE
    else if (normalizedStatus === 'confirmed') {
      console.log('Action: isPay -> false (status remains Confirmed)');
    }
    
    // Check if balance is 0 or less and update payment_status to Paid
    if (booking.balance <= 0) {
      updateData.payment_status = 'Paid';
      console.log('Balance is 0 or less - Setting payment_status to Paid');
    } 
    // Invalid state
    else {
      console.log('Invalid state for confirmation:', {
        normalizedStatus,
        isPay: booking.isPay
      });
      return res.status(400).json({ 
        error: 'Invalid booking state for confirmation',
        message: `Cannot confirm booking with status "${booking.booking_status}". Expected status "Pending" or "Confirmed" with isPay TRUE.`,
        currentStatus: booking.booking_status,
        currentIsPay: booking.isPay
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: updateData
    });

    console.log('Booking confirmed successfully:', {
      bookingId,
      newStatus: updatedBooking.booking_status,
      newIsPay: updatedBooking.isPay
    });

    res.json({
      message: 'Booking confirmed successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ 
      error: 'Failed to confirm booking',
      details: error.message 
    });
  }
};

// Update isPay status
export const updateIsPayStatus = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { isPay } = req.body;

    if (typeof isPay !== 'boolean') {
      return res.status(400).json({ error: 'isPay must be a boolean value' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: bookingId },
      data: { isPay }
    });

    res.json({
      message: 'isPay status updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error updating isPay status:', error);
    res.status(500).json({ error: 'Failed to update isPay status' });
  }
};
