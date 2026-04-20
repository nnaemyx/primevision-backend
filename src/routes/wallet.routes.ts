import { Router } from 'express';
import { connectWallet, deposit, withdraw, getConnectedWallets } from '../controllers/wallet.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.post('/connect', connectWallet);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.get('/', getConnectedWallets);
router.delete('/:id', async (req, res) => {
  try {
    const Wallet = (await import('../models/Wallet')).default;
    await Wallet.findOneAndDelete({ _id: req.params.id, user: (req as any).user?._id });
    res.json({ message: 'Wallet disconnected' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
