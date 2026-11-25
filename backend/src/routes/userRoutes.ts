import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { getProfile, updateProfile, deleteProfile } from '../controllers/userController.js';


const router = Router();

router.get('/profile', authenticateUser, getProfile);
router.put('/profile', authenticateUser, updateProfile);
router.delete('/profile', authenticateUser, deleteProfile);

export default router;