import { Router } from 'express';
import { getTraders, getTrader, copyTrader, getMyCopiedTrades } from '../controllers/copyTrading.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getTraders);
router.get('/my-copies', protect, getMyCopiedTrades);
router.get('/:id', getTrader);
router.post('/copy/:id', protect, copyTrader);

export default router;

