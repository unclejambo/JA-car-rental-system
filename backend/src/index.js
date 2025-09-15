import express from 'express';
import cors from 'cors';
import carRoutes from './routes/carRoutes.js';
import customerRoutes from './routes/customerRoute.js';
import bookingRoutes from './routes/bookingRoute.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('JA Car Rental Backend is running!');
});

// API Routes
app.use('/cars', carRoutes);
app.use('/customers', customerRoutes);
app.use('/bookings', bookingRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
