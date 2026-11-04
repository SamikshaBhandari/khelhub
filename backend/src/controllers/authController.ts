import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendEmail } from '../utils/sendEmail.js';

export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required fields!' });
        }

        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'This email is already registered!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            `INSERT INTO users (name, email, password, phone, address, role) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, name, email, phone, address, role, created_at`,
            [name, email, hashedPassword, phone || null, address || null, 'user']
        );

        // Send registration confirmation email
        await sendEmail(
            email,
            'Welcome to KhelHub!',
            `Hello ${name},\n\nYour KhelHub account has been successfully registered. Welcome aboard!\n\nThank you!`
        );

        return res.status(201).json({
            message: 'User registered successfully!',
            user: newUser.rows[0],
        });
    } catch (err) {
        console.error('Registration Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required!' });
        }

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password!' });
        }

        const user = userResult.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password!' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '1d' }
        );

        // Send login alert email
        await sendEmail(
            user.email,
            'Login Alert - KhelHub ',
            `Hello ${user.name},\n\nA new login to your KhelHub account was detected.`
        );

        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({
            message: 'Login successful!',
            token,
            user: userWithoutPassword,
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};