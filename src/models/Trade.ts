import mongoose, { Document, Schema } from 'mongoose';

export interface ITrade extends Document {
  user: mongoose.Types.ObjectId;
  symbol: string;
  market: 'stocks' | 'futures' | 'crypto';
  type: 'market' | 'limit';
  side: 'long' | 'short';
  price: number;
  amount: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  lockingPeriod?: string;
  leverage?: number;
  status: 'open' | 'filled' | 'cancelled';
  executionPrice?: number;
  pnl?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true },
    market: { type: String, enum: ['stocks', 'futures', 'crypto'], required: true },
    type: { type: String, enum: ['market', 'limit'], default: 'market' },
    side: { type: String, enum: ['long', 'short'], required: true },
    price: { type: Number, required: true },
    amount: { type: Number, required: true },
    quantity: { type: Number, required: true },
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    lockingPeriod: { type: String },
    leverage: { type: Number, default: 1 },
    status: { type: String, enum: ['open', 'filled', 'cancelled'], default: 'open' },
    executionPrice: { type: Number },
    pnl: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ITrade>('Trade', TradeSchema);
