import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.get('/me', getProfile);
router.put('/me', updateProfile);

export default router;
