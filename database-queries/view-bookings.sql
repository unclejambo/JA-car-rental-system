-- Query to see all bookings with customer and car details
SELECT 
  b.booking_id,
  b.booking_date,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email as customer_email,
  car.make || ' ' || car.model || ' (' || car.year || ')' as car_details,
  car.license_plate,
  b.start_date,
  b.end_date,
  b.pickup_time,
  b.dropoff_time,
  b.pickup_loc,
  b.dropoff_loc,
  b.total_amount,
  b.booking_status,
  b.payment_status,
  b.isSelfDriver,
  b.purpose,
  b.isDeliver,
  b.deliver_loc,
  d.first_name || ' ' || d.last_name as driver_name
FROM "Booking" b
LEFT JOIN "Customer" c ON b.customer_id = c.customer_id
LEFT JOIN "Car" car ON b.car_id = car.car_id
LEFT JOIN "Driver" d ON b.drivers_id = d.drivers_id
ORDER BY b.booking_date DESC;

-- Query to see recent bookings (last 30 days)
SELECT 
  booking_id,
  booking_date,
  start_date,
  end_date,
  total_amount,
  booking_status,
  payment_status
FROM "Booking" 
WHERE booking_date >= NOW() - INTERVAL '30 days'
ORDER BY booking_date DESC;

-- Query to see bookings for a specific customer (replace with actual customer_id)
SELECT * FROM "Booking" WHERE customer_id = 1 ORDER BY booking_date DESC;