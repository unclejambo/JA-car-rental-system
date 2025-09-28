import prisma from '../config/prisma.js';

// @desc    Get all cars
// @route   GET /cars
// @access  Public
export const getCars = async (req, res) => {
  try {
    console.log('getCars endpoint called');
    const cars = await prisma.car.findMany();
    console.log('Found cars:', cars.length);
    if (cars.length > 0) {
      console.log('Sample car data:', cars[0]);
    }
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
};

// @desc    Get GPS info for a car
// @route   GET cars/:id/gps
// @access  Public
export const getCarGps = async (req, res) => {
  const carId = parseInt(req.params.id, 10);
  try {
    const car = await prisma.car.findUnique({ where: { car_id: carId } });
    if (!car) return res.status(404).json({ error: 'Car not found' });
    
    res.json({
      gpsDeviceId: car.gpsDeviceId,
      message: 'GPS integration coming soon!',
    });
  } catch (error) {
    console.error('Error fetching car GPS:', error);
    res.status(500).json({ error: 'Failed to fetch car GPS' });
  }
};

// @desc    Create a car
// @route   POST /cars
// @access  Private/Admin
export const createCar = async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      license_plate,
      no_of_seat,
      rent_price,
      car_status,
      car_img_url,
      mileage,
    } = req.body;

    const newCar = await prisma.car.create({
      data: {
        make,
        model,
        year,
        license_plate,
        no_of_seat,
        rent_price,
        car_status,
        car_img_url,
        mileage,
      },
    });
    res.status(201).json(newCar);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({ error: 'Failed to create car' });
  }
};

// @desc    Update a car
// @route   PUT /cars/:id
// @access  Private/Admin
export const updateCar = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const { ...carData } = req.body;

    // Normalize numeric fields: if empty string, omit; else parse to int
    const normalized = { ...carData };
    const normalizeIntField = (obj, key) => {
      if (obj[key] === '') {
        delete obj[key];
      } else if (obj[key] != null) {
        const parsed = parseInt(obj[key], 10);
        if (!Number.isNaN(parsed)) obj[key] = parsed;
        else delete obj[key];
      }
    };

    normalizeIntField(normalized, 'year');
    normalizeIntField(normalized, 'mileage');
    normalizeIntField(normalized, 'no_of_seat');
    normalizeIntField(normalized, 'rent_price');

    if (req.file) {
      normalized.car_img_url = `/uploads/${req.file.filename}`;
    }

    // Whitelist allowed columns only
    const allowed = [
      'make',
      'model',
      'year',
      'license_plate',
      'no_of_seat',
      'rent_price',
      'car_status',
      'car_img_url',
      'mileage',
    ];
    const data = Object.fromEntries(
      Object.entries(normalized).filter(([k, v]) => allowed.includes(k))
    );

    console.log('UpdateCar received body:', req.body);
    console.log('UpdateCar normalized data:', data);

    const updatedCar = await prisma.car.update({
      where: { car_id: carId },
      data,
    });

    res.json(updatedCar);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
};

// @desc    Delete a car
// @route   DELETE /cars/:id
// @access  Private/Admin
export const deleteCar = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    await prisma.car.delete({
      where: { car_id: carId },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
};
