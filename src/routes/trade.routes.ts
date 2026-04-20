import { Router } from 'express';
import { executeTrade, getOpenOrders, getFilledOrders, getTradeHistory, cancelOrder } from '../controllers/trade.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.post('/execute', executeTrade);
router.get('/open', getOpenOrders);
router.get('/filled', getFilledOrders);
router.get('/history', getTradeHistory);
router.delete('/:id', cancelOrder);

export default router;
