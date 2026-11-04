import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to KhelHub TypeScript API Server!' });
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    try {
        const client = await pool.connect();
        console.log('Database connection verified via query test!');
        client.release();
    } catch (err) {
        console.error('Database connection failed:', err);
    }
});