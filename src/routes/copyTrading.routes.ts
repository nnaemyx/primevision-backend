import { Router } from 'express';
import { getTraders, getTrader, copyTrader } from '../controllers/copyTrading.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getTraders);
router.get('/:id', getTrader);
router.post('/copy/:id', protect, copyTrader);

export default router;
