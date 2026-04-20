import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import CopyTrader from '../models/CopyTrader';

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
    const trader = await CopyTrader.findByIdAndUpdate(
      req.params.id,
      { $inc: { copiers: 1, totalFollowers: 1 } },
      { new: true }
    );
    if (!trader) {
      res.status(404).json({ message: 'Trader not found' });
      return;
    }
    res.json({ message: `Now copying ${trader.name}`, trader });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
