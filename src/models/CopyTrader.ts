import mongoose, { Document, Schema } from 'mongoose';

export interface ICopyTrader extends Document {
  name: string;
  avatar: string;
  bio: string;
  copiers: number;
  roi30d: number;
  roi2y: number;
  totalProfit: number;
  winRatio: number;
  avgRiskScore: number;
  profitableWeeks: number;
  rating: number;
  totalGains: number;
  totalLoss: number;
  totalFollowers: number;
  minAccountThreshold: number;
  currentPositions: number;
  activeSince: string;
  isActive: boolean;
  performanceData: Array<{ month: string; value: number }>;
  topTrades: Array<{ symbol: string; profit: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const CopyTraderSchema = new Schema<ICopyTrader>(
  {
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    copiers: { type: Number, default: 0 },
    roi30d: { type: Number, default: 0 },
    roi2y: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    winRatio: { type: Number, default: 0 },
    avgRiskScore: { type: Number, default: 0 },
    profitableWeeks: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    totalGains: { type: Number, default: 0 },
    totalLoss: { type: Number, default: 0 },
    totalFollowers: { type: Number, default: 0 },
    minAccountThreshold: { type: Number, default: 0 },
    currentPositions: { type: Number, default: 0 },
    activeSince: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    performanceData: [{ month: String, value: Number }],
    topTrades: [{ symbol: String, profit: Number }],
  },
  { timestamps: true }
);

export default mongoose.model<ICopyTrader>('CopyTrader', CopyTraderSchema);
