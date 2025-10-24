import prisma from '../config/prisma.js';

// @desc    Get all maintenance records (for analytics)
// @route   GET /maintenance
// @access  Private/Admin
export const getAllMaintenanceRecords = async (req, res) => {
  try {
    const maintenanceRecords = await prisma.maintenance.findMany({
      orderBy: { maintenance_start_date: 'desc' },
    });
    res.json(maintenanceRecords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
};

// @desc    Get all maintenance records for a car
// @route   GET /cars/:carId/maintenance
// @access  Private/Admin
export const getMaintenanceRecords = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const maintenanceRecords = await prisma.maintenance.findMany({
      where: { car_id: carId },
    });
    res.json(maintenanceRecords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
};

// @desc    Create a maintenance record
// @route   POST /cars/:carId/maintenance
// @access  Private/Admin
export const createMaintenanceRecord = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const {
      start_date,
      end_date,
      description,
      shop_assigned,
      maintenance_fee,
    } = req.body;

    const start = start_date ? new Date(start_date) : null;
    const end = end_date ? new Date(end_date) : null;
    if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid start or end date' });
    }

    const cost = maintenance_fee === '' || maintenance_fee == null
      ? null
      : parseInt(maintenance_fee, 10);

    const newMaintenanceRecord = await prisma.maintenance.create({
      data: {
        car_id: carId,
        maintenance_start_date: start,
        maintenance_end_date: end,
        description,
        maintenance_shop_name: shop_assigned,
        maintenance_cost: Number.isNaN(cost) ? null : cost,
      },
    });

    res.status(201).json(newMaintenanceRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create maintenance record' });
  }
};

// @desc    Update a maintenance record
// @route   PUT /maintenance/:id
// @access  Private/Admin
export const updateMaintenanceRecord = async (req, res) => {
  try {
    const maintenanceId = parseInt(req.params.id);
    const { end_date, description, maintenance_cost, maintenance_shop_name } = req.body;

    // Build update data object with only provided fields
    const updateData = {};

    if (end_date) {
      const end = new Date(end_date);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid end date' });
      }
      updateData.maintenance_end_date = end;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (maintenance_cost !== undefined && maintenance_cost !== '') {
      updateData.maintenance_cost = parseInt(maintenance_cost);
    }

    if (maintenance_shop_name !== undefined) {
      updateData.maintenance_shop_name = maintenance_shop_name;
    }

    const updatedMaintenanceRecord = await prisma.maintenance.update({
      where: { maintenance_id: maintenanceId },
      data: updateData,
    });

    res.json(updatedMaintenanceRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update maintenance record' });
  }
};