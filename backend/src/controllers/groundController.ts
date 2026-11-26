import { Request, Response } from 'express';
import pool from '../config/db.js';

//Sabai available grounds herne
export const getAllGrounds = async (req: Request, res: Response): Promise<any> => {
    try {
        // URL bata ?sport_type=Futsal ya ?search=Itahari jasto query parameters linchha
        const { sport_type, search } = req.query;

        // Suru ko base query: available matra dekhaune
        let query = 'SELECT * FROM grounds WHERE is_available = TRUE';
        const values: any[] = [];
        let paramIndex = 1;

        // Sport type filter diya cha bhane query ma thapne 
        if (sport_type && String(sport_type).trim() !== '') {
            query += ` AND LOWER(sport_type) = LOWER($${paramIndex++})`;
            values.push(String(sport_type).trim());
        }

        // Ground ko naam ya location ma search gareko cha bhane query ma thapne
        if (search && String(search).trim() !== '') {
            query += ` AND (LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(location) LIKE LOWER($${paramIndex}))`;
            values.push(`%${String(search).trim()}%`);
            paramIndex++;
        }

        // ID anusar milayera data taanne
        query += ' ORDER BY id ASC';

        const result = await pool.query(query, values);
        return res.status(200).json({ grounds: result.rows });
    } catch (err) {
        console.error('Get All Grounds Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

//Kunai euta ground ko full detail (facilities, rules, price, timing) ID bata herne
export const getGroundById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const groundId = Number(id);

        // ID number ho ki hoina check garchha
        if (!Number.isInteger(groundId) || groundId <= 0) {
            return res.status(400).json({ error: 'Invalid ground ID!' });
        }

        const result = await pool.query('SELECT * FROM grounds WHERE id = $1', [groundId]);

        // Tyo ID ko ground chaina bhane 404 Not Found
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ground not found!' });
        }

        // Ground ko sabai details 
        return res.status(200).json({ ground: result.rows[0] });
    } catch (err) {
        console.error('Get Ground By ID Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};