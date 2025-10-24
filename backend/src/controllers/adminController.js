import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

// @desc    Get all admins
// @route   GET /admins
// @access  Public
export const getAdmins = async (req, res) => {
    try {
        const admins = await prisma.admin.findMany({
            orderBy: { admin_id: 'asc' },
        });
        const sanitized = admins.map(({ password, ...a }) => ({ ...a, id: a.admin_id }));
        res.json(sanitized);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
// @desc    Get an admin by ID
// @route   GET /admins/:id
// @access  Public
export const getAdminById = async (req, res) => {
    const { id } = req.params;
    try {
        const admin = await prisma.admin.findUnique({
            where: { admin_id: Number(id) },
        });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        const { password, ...safe } = admin;
        res.json(safe);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Create a new admin
// @route   POST /admins
// @access  Private/Admin
export const createAdmin = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            address,
            contact_no,
            email,
            username,
            password,
            user_type,
            isActive,
        } = req.body;

        if (!first_name || !last_name || !email || !username || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existing = await prisma.admin.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existing) {
            return res.status(409).json({ message: 'Admin already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                first_name,
                last_name,
                address,
                contact_no,
                email,
                username,
                password: hashed,
                user_type: user_type || 'staff',
                isActive: typeof isActive === 'boolean' ? isActive : true,
            },
        });
        const { password: _pw, ...safe } = admin;
        res.status(201).json(safe);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateAdmin = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const existing = await prisma.admin.findUnique({ where: { admin_id: id } });
        if (!existing) return res.status(404).json({ message: 'Admin not found' });

        const allowed = ['first_name','last_name','address','contact_no','email','username','password','user_type','isActive'];
        const data = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) data[key] = req.body[key];
        }
        if (data.password) data.password = await bcrypt.hash(data.password, 10);

        const updated = await prisma.admin.update({ where: { admin_id: id }, data });
        const { password: _pw, ...safe } = updated;
        res.json(safe);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteAdmin = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.admin.delete({ where: { admin_id: id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};