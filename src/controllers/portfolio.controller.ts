import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Trade from '../models/Trade';
import Transaction from '../models/Transaction';

export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const trades = await Trade.find({ user: user._id, status: 'open' });
    const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const deposits = await Transaction.find({ user: user._id, type: 'deposit', status: 'completed' });
    const totalDeposited = deposits.reduce((acc, t) => acc + t.amount, 0);
    const pnlPercent = totalDeposited > 0 ? (totalPnl / totalDeposited) * 100 : 0;

    // Distribution is manually managed by the user
    const distribution = {
      stocks: 0,
      futures: 0,
      crypto: 0,
    };

    res.json({ balance: user.balance, pnlValue: totalPnl, pnlPercent, distribution });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getGrowthHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((month, i) => ({
      month,
      value: Math.floor(300 + Math.random() * 600 + i * 40),
    }));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await Transaction.find({ user: req.user?._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
