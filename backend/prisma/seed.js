import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();

// Helper functions
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomString = (length = 10) => Math.random().toString(36).substring(2, length + 2);
const randomPhone = () => '09' + Math.floor(10000000 + Math.random() * 90000000);
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Clear existing data
  console.log('🧹 Clearing existing data...');
  const models = ['Transaction', 'Release', 'Maintenance', 'Payment', 'Refund', 
                 'Extension', 'Booking', 'Car', 'Driver', 'Customer', 'DriverLicense', 'Admin'];

  for (const model of models) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${model}" CASCADE;`);
      console.log(`✅ Cleared ${model} table`);
    } catch (error) {
      console.warn(`⚠️  Couldn't clear ${model} table:`, error.message);
    }
  }

  // Create Admin
  console.log('👨‍💼 Creating admin user...');
  const admin = await prisma.admin.create({
    data: {
      first_name: 'Admin',
      last_name: 'User',
      contact_no: '09123456789',
      email: 'admin@jacars.com',
      username: 'admin',
      password: await hash('admin123', 10),
      user_type: 'superadmin',
    },
  });

  // Create Driver Licenses
  console.log('📝 Creating driver licenses...');
  const licenses = [];
  for (let i = 1; i <= 10; i++) {
    const license = await prisma.driverLicense.create({
      data: {
        driver_license_no: `DL${10000000 + i}`,
        expiry_date: randomDate(new Date(), new Date(2030, 11, 31)),
        restrictions: Math.random() > 0.8 ? 'Glasses required' : 'None',
        dl_img_url: `/licenses/license-${i}.jpg`,
      },
    });
    licenses.push(license);
  }

  // Create Customers
  console.log('👥 Creating customers...');
  const customers = [];
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jennifer'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];

  for (let i = 0; i < 8; i++) {
    const customer = await prisma.customer.create({
      data: {
        first_name: firstNames[i % firstNames.length],
        last_name: lastNames[i % lastNames.length],
        address: `${i + 1} Main St, City`,
        contact_no: randomPhone(),
        email: `customer${i + 1}@example.com`,
        username: `customer${i + 1}`,
        password: await hash('password123', 10),
        status: 'active',
        driver_license_no: licenses[i].driver_license_no,
        date_created: randomDate(new Date(2023, 0, 1), new Date()),
      },
    });
    customers.push(customer);
  }

  // Create Drivers
  console.log('🚗 Creating drivers...');
  const drivers = [];
  for (let i = 0; i < 5; i++) {
    const driver = await prisma.driver.create({
      data: {
        first_name: `Driver${i + 1}`,
        last_name: 'Doe',
        address: `${i + 100} Driver St, City`,
        contact_no: randomPhone(),
        email: `driver${i + 1}@example.com`,
        username: `driver${i + 1}`,
        password: await hash('driver123', 10),
        driver_license_no: licenses[i + 5].driver_license_no,
      },
    });
    drivers.push(driver);
  }

  // Create Cars
  console.log('🚘 Creating cars...');
  const cars = [
    { make: 'Nissan', model: 'Terra', type: 'SUV', year: 2020, mileage: 17000, seats: 7, price: 3000, status: 'Available' },
    { make: 'Mitsubishi', model: 'Mirage', type: 'Sedan', year: 2023, mileage: 26990, seats: 5, price: 1800, status: 'Maintenance' },
    { make: 'Nissan', model: 'Navarra', type: 'Pickup', year: 2017, mileage: 18000, seats: 5, price: 2800, status: 'Available' },
    { make: 'Kia', model: 'Rio', type: 'Sedan', year: 2014, mileage: 20000, seats: 5, price: 1500, status: 'Available' },
    { make: 'Toyota', model: 'Innova', type: 'MPV', year: 2021, mileage: 12000, seats: 7, price: 2500, status: 'Available' },
  ];

  const createdCars = [];
  for (const [index, car] of cars.entries()) {
    const createdCar = await prisma.car.create({
      data: {
        car_img_url: `/images/car-${index + 1}.jpg`,
        make: car.make,
        model: car.model,
        year: car.year,
        mileage: car.mileage,
        license_plate: `${car.make.substring(0, 3).toUpperCase()}-${1000 + index}`,
        no_of_seat: car.seats,
        rent_price: car.price,
        car_status: car.status,
      },
    });
    createdCars.push(createdCar);
  }

  // Create Bookings
  console.log('📅 Creating bookings...');
  const bookingStatuses = ['Confirmed', 'Completed', 'Cancelled', 'In Progress'];
  const paymentStatuses = ['Paid', 'Pending', 'Refunded'];
  
  for (let i = 0; i < 15; i++) {
    const startDate = randomDate(new Date(), new Date(2024, 11, 31));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 7) + 1);
    
    const isSelfDriver = Math.random() > 0.5;
    const bookingStatus = randomElement(bookingStatuses);
    
    await prisma.booking.create({
      data: {
        customer_id: randomElement(customers).customer_id,
        car_id: randomElement(createdCars).car_id,
        booking_date: new Date(),
        purpose: `Trip to ${['Baguio', 'Tagaytay', 'Subic', 'Batangas', 'La Union'][i % 5]}`,
        start_date: startDate,
        end_date: endDate,
        pickup_time: startDate,
        pickup_loc: 'Main Office',
        dropoff_time: endDate,
        dropoff_loc: 'Main Office',
        isSelfDriver,
        isExtend: false,
        isCancel: bookingStatus === 'Cancelled',
        total_amount: Math.floor(Math.random() * 10000) + 5000,
        payment_status: bookingStatus === 'Cancelled' ? 'Refunded' : 'Paid',
        booking_status: bookingStatus,
        drivers_id: isSelfDriver ? null : randomElement(drivers).drivers_id,
        admin_id: admin.admin_id,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });