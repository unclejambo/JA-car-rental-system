import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('JA Car Rental Backend is running!');
});

// Placeholder: Get GPS info for a car by ID
app.get('/cars/:id/gps', async (req, res) => {
  const carId = parseInt(req.params.id, 10);
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) return res.status(404).json({ error: 'Car not found' });
  // TODO: Integrate with GPS API using car.gpsDeviceId
  res.json({ gpsDeviceId: car.gpsDeviceId, message: 'GPS integration coming soon!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
