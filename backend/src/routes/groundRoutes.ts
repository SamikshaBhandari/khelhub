import { Router } from 'express';
import { getAllGrounds, getGroundById } from '../controllers/groundController.js';

const router = Router();

// GET /api/grounds
router.get('/', getAllGrounds);

// GET /api/grounds/:id 
router.get('/:id', getGroundById);

export default router;