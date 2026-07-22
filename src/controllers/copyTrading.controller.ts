import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import CopyTrader from '../models/CopyTrader';
import CopyTrade from '../models/CopyTrade';

export const getTraders = async (req: Request, res: Response): Promise<void> => {
  try {
    const traders = await CopyTrader.find({ isActive: true }).sort({ roi30d: -1 });
    res.json(traders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getTrader = async (req: Request, res: Response): Promise<void> => {
  try {
    const trader = await CopyTrader.findById(req.params.id);
    if (!trader) {
      res.status(404).json({ message: 'Trader not found' });
      return;
    }
    res.json(trader);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const copyTrader = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { symbol, side, market, amount, entryPrice } = req.body;

    const trader = await CopyTrader.findByIdAndUpdate(
      req.params.id,
      { $inc: { copiers: 1, totalFollowers: 1 } },
      { new: true }
    );
    if (!trader) {
      res.status(404).json({ message: 'Trader not found' });
      return;
    }

    // Create a CopyTrade record for the user
    const copyTrade = await CopyTrade.create({
      user: req.user?._id,
      trader: trader._id,
      traderName: trader.name,
      symbol: symbol || 'BTC/USD',
      side: side || 'long',
      market: market || 'crypto',
      amount: amount || 0,
      entryPrice: entryPrice || 0,
      status: 'open',
    });

    res.json({ message: `Now copying ${trader.name}`, trader, copyTrade });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getMyCopiedTrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trades = await CopyTrade.find({ user: req.user?._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
