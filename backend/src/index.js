import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('JA Car Rental Backend is running!');
});

// PLACEHOLDERRRRRRR: Get GPS info for a car by ID
app.get('/cars/:id/gps', async (req, res) => {
  const carId = parseInt(req.params.id, 10);
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) return res.status(404).json({ error: 'Car not found' });
  // TODO: Integrate with GPS API using car.gpsDeviceId
  res.json({ gpsDeviceId: car.gpsDeviceId, message: 'GPS integration coming soon!' });
});

// GET /api/cars - fetch all cars
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await prisma.car.findMany();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// POST /api/cars - add a new car
app.post('/api/cars', async (req, res) => {
  try {
    const { make, model, year, license_plate, no_of_seat, rent_price, car_status, car_img_url, mileage } = req.body;
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
        mileage
      }
    });
    res.status(201).json(newCar);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({ error: 'Failed to create car' });
  }
});

// DELETE /api/cars/:car_id - delete a car
app.delete('/api/cars/:car_id', async (req, res) => {
  const { car_id } = req.params;
  try {
    await prisma.car.delete({
      where: { car_id: parseInt(car_id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting car with id ${car_id}:`, error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
});

// PUT /api/cars/:car_id - update a car
app.put('/api/cars/:car_id', async (req, res) => {
  try {
    const car_id = parseInt(req.params.car_id);
    const { make, model, year, license_plate, no_of_seat, rent_price, car_status, car_img_url, mileage } = req.body;
    const updatedCar = await prisma.car.update({
      where: { car_id: car_id },
      data: {
        make,
        model,
        year,
        license_plate,
        no_of_seat,
        rent_price,
        car_status,
        car_img_url,
        mileage
      }
    });
    res.json(updatedCar);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
});

// DELETE /api/cars/:car_id - delete a car
app.delete('/api/cars/:car_id', async (req, res) => {
  try {
    const car_id = parseInt(req.params.car_id);
    await prisma.car.delete({ where: { id: car_id } });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
