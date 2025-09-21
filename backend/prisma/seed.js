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
  await prisma.release.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.extension.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.driverLicense.deleteMany();
  await prisma.car.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.admin.deleteMany();

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

  // Create Bookings (store created bookings)
  console.log('📅 Creating bookings...');
  const bookingStatuses = ['Confirmed', 'Completed', 'Cancelled', 'In Progress'];
  const paymentStatuses = ['Paid', 'Pending', 'Refunded'];
  const createdBookings = [];
  
  for (let i = 0; i < 15; i++) {
    const startDate = randomDate(new Date(), new Date(2024, 11, 31));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 7) + 1);
    
    const isSelfDriver = Math.random() > 0.5;
    const bookingStatus = randomElement(bookingStatuses);
    const totalAmount = Math.floor(Math.random() * 10000) + 5000;
    const paymentStatus = bookingStatus === 'Cancelled' ? 'Refunded' : (Math.random() > 0.2 ? 'Paid' : 'Pending');
    const assignedDriver = isSelfDriver ? null : randomElement(drivers).drivers_id;
    
    const createdBooking = await prisma.booking.create({
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
        total_amount: totalAmount,
        payment_status: paymentStatus,
        booking_status: bookingStatus,
        drivers_id: assignedDriver,
        admin_id: admin.admin_id,
      },
    });
    createdBookings.push(createdBooking);
  }

  // Create Payments, Refunds, Transactions, Extensions, Releases, Maintenances
  console.log('💳 Creating payments, refunds, transactions, extensions and releases...');

  const payments = [];
  const refunds = [];
  const transactions = [];
  const extensions = [];
  const releases = [];
  const maintenances = [];

  for (const booking of createdBookings) {
    // create a transaction for each booking
    const tx = await prisma.transaction.create({
      data: {
        booking_id: booking.booking_id,
        customer_id: booking.customer_id,
        car_id: booking.car_id,
        completion_date: booking.booking_status === 'Completed' ? randomDate(booking.end_date, new Date()) : null,
        cancellation_date: booking.booking_status === 'Cancelled' ? randomDate(booking.booking_date, booking.end_date) : null,
      },
    });
    transactions.push(tx);

    // payments: create at least one payment for Paid or Pending bookings
    if (booking.payment_status === 'Paid' || booking.payment_status === 'Pending') {
      const paidAmount = booking.payment_status === 'Paid' ? booking.total_amount : Math.floor(booking.total_amount / 2);
      const payment = await prisma.payment.create({
        data: {
          booking_id: booking.booking_id,
          customer_id: booking.customer_id,
          description: `Payment for booking ${booking.booking_id}`,
          payment_method: randomElement(['GCash','Cash','Card']),
          gcash_no: Math.random() > 0.5 ? randomPhone() : null,
          reference_no: `REF-${randomString(6)}`,
          amount: paidAmount,
          paid_date: new Date(),
        },
      });
      payments.push(payment);
    }

    // refunds for some cancelled or refunded bookings
    if (booking.booking_status === 'Cancelled' || booking.payment_status === 'Refunded') {
      const refund = await prisma.refund.create({
        data: {
          booking_id: booking.booking_id,
          customer_id: booking.customer_id,
          refund_method: 'GCash',
          gcash_no: randomPhone(),
          reference_no: `REF-R-${randomString(6)}`,
          refund_amount: Math.floor(booking.total_amount * (Math.random() * 0.9 + 0.1)),
          refund_date: new Date(),
        },
      });
      refunds.push(refund);
    }

    // extensions: randomly add for about ~20% of bookings
    if (Math.random() < 0.2) {
      const extDate = randomDate(booking.end_date, new Date(booking.end_date.getTime() + 5 * 24 * 60 * 60 * 1000));
      const ext = await prisma.extension.create({
        data: {
          booking_id: booking.booking_id,
          extension_date: extDate,
          payment_status: Math.random() > 0.5 ? 'Paid' : 'Pending',
          status: Math.random() > 0.3 ? 'approved' : 'pending',
        },
      });
      extensions.push(ext);
    }

    // releases: only if drivers_id exists (i.e., driver assigned)
    if (booking.drivers_id) {
      const rel = await prisma.release.create({
        data: {
          booking_id: booking.booking_id,
          drivers_id: booking.drivers_id,
          valid_id_img1: `/releases/vid1-${booking.booking_id}.jpg`,
          valid_id_img2: `/releases/vid2-${booking.booking_id}.jpg`,
          agreement_form: `/releases/agreement-${booking.booking_id}.pdf`,
          equipment: 'GPS, Charger',
          gas_level: Math.random() > 0.5 ? 'Full' : 'Half',
          others: 'N/A',
        },
      });
      releases.push(rel);
    }
  }

  // maintenances: add a few maintenance records for existing cars
  console.log('🛠️  Creating maintenance records for some cars...');
  for (const car of createdCars.slice(0, 3)) {
    const m = await prisma.maintenance.create({
      data: {
        car_id: car.car_id,
        maintenance_start_date: randomDate(new Date(2023, 0, 1), new Date()),
        maintenance_end_date: randomDate(new Date(), new Date(2025, 11, 31)),
        description: randomElement(['Oil change', 'Brake pads', 'Tire replacement', 'Engine check']),
        maintenance_cost: Math.floor(Math.random() * 5000) + 500,
        maintenance_shop_name: randomElement(['QuickFix Auto', 'Super Mechanics', 'AutoCare Center']),
      },
    });
    maintenances.push(m);
  }

  console.log('✅ Database seeded successfully! Summary counts:');
  const counts = {
    admins: await prisma.admin.count(),
    customers: await prisma.customer.count(),
    drivers: await prisma.driver.count(),
    driverLicenses: await prisma.driverLicense.count(),
    cars: await prisma.car.count(),
    bookings: await prisma.booking.count(),
    payments: await prisma.payment.count(),
    refunds: await prisma.refund.count(),
    transactions: await prisma.transaction.count(),
    extensions: await prisma.extension.count(),
    releases: await prisma.release.count(),
    maintenances: await prisma.maintenance.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });