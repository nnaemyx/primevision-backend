import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  user?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  message: string;
  reply?: string;
  repliedAt?: Date;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    reply: { type: String },
    repliedAt: { type: Date },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
