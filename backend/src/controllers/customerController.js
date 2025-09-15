import prisma from '../config/prisma.js';



// @desc    Get all customers
// @route   GET /customers
// @access  Public
export const getCustomers = async (req, res) => {
    try {
        const users = await prisma.customer.findMany();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};


// @desc    Get a customer by ID
// @route   GET /customers/:id
// @access  Public
export const getCustomerById = async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const customer = await prisma.customer.findUnique({ where: { customer_id: customerId } });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};


// @desc    Create a new customer
// @route   POST /customers
// @access  Private/Admin
export const createCustomer = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            address,
            contact_no,
            email,
            username,
            password,
            fb_link,
            date_created,
            status,
            driver_license_no,      // -> This must be an exisiting driver_license in the system (FK)
        } = req.body;

        // basic validation
        if (!first_name || !last_name || !email || !username || !password) {
            return res.status(400).json({ error: 'first_name, last_name, email, username and password are required' });
        }

        const newCustomer = await prisma.customer.create({
            data: {
                first_name,
                last_name,
                address,
                contact_no,
                email,
                username,
                password,
                fb_link,
                date_created,
                status,
                driver_license_no
            },
        });

        // remove password from response
        const { password: _pw, ...safeCustomer } = newCustomer;

        res.status(201).json(safeCustomer);
    } catch (error) {
        // handle unique constraint (e.g. username or email) from Prisma
        if (error?.code === 'P2002') {
            return res.status(409).json({ error: 'Record already exists (unique constraint)' });
        }
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        await prisma.customer.delete({
            where: { customer_id: customerId },
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const {
            first_name,
            last_name,
            address,
            contact_no,
            email,
            username,
            password,
            fb_link,
            date_created,
            status,
            driver_license_no,      // -> This must be an exisiting driver_license in the system (FK)
        } = req.body;

        const updatedCustomer = await prisma.customer.update({
            where: { customer_id: customerId },
            data: {
                first_name,
                last_name,
                address,
                contact_no,
                email,
                username,
                password,
                fb_link,
                date_created,
                status,
                driver_license_no,
            },
        });

        // remove password from response
        const { password: _pw, ...safeCustomer } = updatedCustomer;

        res.json(safeCustomer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
};
