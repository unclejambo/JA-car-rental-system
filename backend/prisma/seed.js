import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.admin.create({
    data: {
      first_name: 'Sarex',
      last_name: 'Goyex',
      contact_no: '0927654321',
      email: 'sarexgoyex@gmail.com',
      username: 'sarex1',
      password: 'securepassword123',
      user_type: 'superadmin',
    },
  });

  await prisma.driverLicense.create({
    data: {
      driver_license_no: 'DL123456',
      expiry_date: new Date('2030-12-31'),
      restrictions: 'None',
      dl_img_url: 'https://example.com/license.png',
      customers: {
        create: [
          {
            first_name: 'Greggy',
            last_name: 'Marayanz',
            email: 'greggy@example.com',
            username: 'greggy_marayanz',
            password: 'password123',
            fb_link: 'https://facebook.com/greggy',
            date_created: new Date(),
            status: 'active',
          },
        ],
      },
    },
  });

  await prisma.car.create({
    data: {
      car_img_url: 'https://example.com/car.png',
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
      mileage: 5000,
      license_plate: 'ABC123',
      no_of_seat: 5,
      rent_price: 2000,
      car_status: 'Available',
    },
  });

}

main()
  .then(() => {
    console.log('Database seeded!');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });