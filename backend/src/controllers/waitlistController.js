import prisma from '../config/prisma.js';
import { sendCarAvailabilityNotification } from '../utils/notificationService.js';

// @desc    Get waitlist entries for a car
// @route   GET /cars/:carId/waitlist
// @access  Private
export const getCarWaitlist = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);

    const waitlistEntries = await prisma.waitlist.findMany({
      where: { 
        car_id: carId,
        status: 'waiting'
      },
      include: {
        Customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    res.json(waitlistEntries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
};

// @desc    Add customer to waitlist
// @route   POST /cars/:carId/waitlist
// @access  Private (Customer)
export const joinWaitlist = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can join waitlist' });
    }

    // Check if customer already has an entry for this car
    const existingEntry = await prisma.waitlist.findFirst({
      where: {
        customer_id: parseInt(customerId),
        car_id: carId
      }
    });

    let waitlistEntry;

    if (existingEntry) {
      // If already waiting, reject
      if (existingEntry.status === 'waiting') {
        return res.status(400).json({ error: 'You are already on the waitlist for this car' });
      }

      // If previously notified, reactivate the entry
      if (existingEntry.status === 'notified') {
        waitlistEntry = await prisma.waitlist.update({
          where: { waitlist_id: existingEntry.waitlist_id },
          data: {
            status: 'waiting',
            notified_date: null,
            notification_method: null,
            notification_success: null
          },
          include: {
            Customer: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                contact_no: true,
                isRecUpdate: true
              }
            },
            Car: {
              select: {
                make: true,
                model: true,
                year: true
              }
            }
          }
        });
      }
    } else {
      // Create new waitlist entry for notifications
      waitlistEntry = await prisma.waitlist.create({
        data: {
          customer_id: parseInt(customerId),
          car_id: carId,
          status: 'waiting'
        },
        include: {
          Customer: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              contact_no: true,
              isRecUpdate: true
            }
          },
          Car: {
            select: {
              make: true,
              model: true,
              year: true
            }
          }
        }
      });
    }

    const isReactivated = existingEntry && existingEntry.status === 'notified';

    return res.status(201).json({
      success: true,
      message: `You will be notified when the ${waitlistEntry.Car.make} ${waitlistEntry.Car.model} becomes available.`,
      waitlist_entry: waitlistEntry,
      reactivated: isReactivated
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
};
// @desc    Remove customer from waitlist
// @route   DELETE /waitlist/:waitlistId
// @access  Private (Customer - own entries only)
export const leaveWaitlist = async (req, res) => {
  try {
    const waitlistId = parseInt(req.params.waitlistId);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    // Find the waitlist entry
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { waitlist_id: waitlistId }
    });

    if (!waitlistEntry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    // Check if customer owns this waitlist entry (or is admin)
    if (waitlistEntry.customer_id !== parseInt(customerId) && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You can only remove your own waitlist entries' });
    }

    // Remove the entry
    await prisma.waitlist.delete({
      where: { waitlist_id: waitlistId }
    });

    res.json({ 
      success: true, 
      message: 'Successfully removed from waitlist' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave waitlist' });
  }
};

// @desc    Get customer's waitlist entries
// @route   GET /customers/me/waitlist
// @access  Private (Customer)
export const getMyWaitlistEntries = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    const waitlistEntries = await prisma.waitlist.findMany({
      where: {
        customer_id: parseInt(customerId),
        status: 'waiting'
      },
      include: {
        Car: {
          select: {
            make: true,
            model: true,
            year: true,
            license_plate: true,
            car_status: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(waitlistEntries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch waitlist entries' });
  }
};

// @desc    Notify customers on waitlist when car becomes available
// @route   Used internally by car controller
// @access  Internal
export const notifyWaitlistOnCarAvailable = async (carId) => {
  try {
    // Get all waiting customers for this car who haven't been notified yet
    const waitingCustomers = await prisma.waitlist.findMany({
      where: {
        car_id: carId,
        status: 'waiting',
        notified_date: null
      },
      include: {
        Customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            contact_no: true,
            email: true,
            isRecUpdate: true
          }
        },
        Car: {
          select: {
            car_id: true,
            make: true,
            model: true,
            year: true,
            car_status: true
          }
        }
      },
      orderBy: {
        created_at: 'asc' // First come, first served
      }
    });

    if (waitingCustomers.length === 0) {
      return { success: true, notified: 0 };
    }
    const results = {
      total: waitingCustomers.length,
      notified: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    // Send notifications to all waiting customers
    for (const entry of waitingCustomers) {
      const { Customer: customer, Car: car } = entry;

      // Skip if customer has notifications disabled
      if (!customer.isRecUpdate || customer.isRecUpdate === 0) {
        results.skipped++;
        results.details.push({
          customer_id: customer.customer_id,
          status: 'skipped',
          reason: 'notifications_disabled'
        });
        continue;
      }

      // Send notification
      const notificationResult = await sendCarAvailabilityNotification(customer, car);

      // Update waitlist entry
      try {
        await prisma.waitlist.update({
          where: { waitlist_id: entry.waitlist_id },
          data: {
            status: 'notified',
            notified_date: new Date(),
            notification_method: notificationResult.method || 'none',
            notification_success: notificationResult.success
          }
        });

        if (notificationResult.success) {
          results.notified++;
          results.details.push({
            customer_id: customer.customer_id,
            status: 'success',
            method: notificationResult.method
          });
        } else {
          results.failed++;
          results.details.push({
            customer_id: customer.customer_id,
            status: 'failed',
            error: notificationResult.error
          });
        }
      } catch (updateError) {
        results.failed++;
        results.details.push({
          customer_id: customer.customer_id,
          status: 'failed',
          error: 'database_update_failed'
        });
      }
    }
    return {
      success: true,
      ...results
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      total: 0,
      notified: 0,
      failed: 0,
      skipped: 0
    };
  }
};