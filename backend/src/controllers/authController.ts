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

        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            `INSERT INTO users (name, email, password, phone, address, role, is_verified, verification_token) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING id, name, email, phone, address, role, is_verified, created_at`,
            [name, email, hashedPassword, phone || null, address || null, 'user', false, otp]
        );

        // Send OTP verification email
        await sendEmail(
            email,
            'KhelHub Email Verification OTP',
            `Hello ${name},\n\nYour OTP for KhelHub account verification is: ${otp}\n\nPlease verify your account to login.`
        );

        return res.status(201).json({
            message: 'User registered successfully! Please check your email for the verification OTP.',
            user: newUser.rows[0],
        });
    } catch (err) {
        console.error('Registration Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required!' });
        }

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found!' });
        }

        const user = userResult.rows[0];

        if (user.is_verified) {
            return res.status(400).json({ error: 'Email is already verified!' });
        }

        if (user.verification_token !== otp) {
            return res.status(400).json({ error: 'Invalid OTP code!' });
        }

        // Update user as verified and clear verification token
        await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE email = $1',
            [email]
        );

        return res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
    } catch (err) {
        console.error('Verification Error:', err);
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

        // Check if email is verified before logging in
        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email before logging in!' });
        }

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
            'Login Alert - KhelHub',
            `Hello ${user.name},\n\nA new login to your KhelHub account was detected.`
        );

        const { password: _, verification_token: __, ...userWithoutPassword } = user;
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