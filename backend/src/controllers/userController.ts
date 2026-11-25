import { Response } from 'express';
import pool from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

// Get logged-in user's profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;

        const result = await pool.query(
            'SELECT id, name, email, phone, address, role, is_verified, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found!' });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('Get Profile Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update logged-in user's profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        const { name, phone, address } = req.body;

        const result = await pool.query(
            `UPDATE users 
             SET name = COALESCE($1, name), 
                 phone = COALESCE($2, phone), 
                 address = COALESCE($3, address) 
             WHERE id = $4 
             RETURNING id, name, email, phone, address, role, is_verified`,
            [name || null, phone || null, address || null, userId]
        );

        return res.status(200).json({
            message: 'Profile updated successfully!',
            user: result.rows[0],
        });
    } catch (err) {
        console.error('Update Profile Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete logged-in user's account
export const deleteProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, email',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found!' });
        }

        return res.status(200).json({
            message: 'Account deleted successfully!',
            deletedUser: result.rows[0],
        });
    } catch (err) {
        console.error('Delete Profile Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};