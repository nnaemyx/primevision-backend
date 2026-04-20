import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import portfolioRoutes from './routes/portfolio.routes';
import tradeRoutes from './routes/trade.routes';
import walletRoutes from './routes/wallet.routes';
import copyTradingRoutes from './routes/copyTrading.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests, please try again later.' });
app.use('/api', limiter);

// Chat endpoints
app.post('/api/chat/message', async (req, res) => {
  try {
    const { name, email, message, userId } = req.body;
    const ChatMessage = (await import('./models/ChatMessage')).default;
    const resend = (await import('./config/resend')).default;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@crestlinetrades.com';

    // Save to DB
    const chat = await ChatMessage.create({ name, email, message, user: userId || undefined });

    // Notify admin by email
    await resend.emails.send({
      from: 'CrestlineTrades Chat <noreply@crestlinetrades.com>',
      to: adminEmail,
      subject: `💬 New Support Message from ${name}`,
      html: `<div style="font-family:sans-serif;background:#0e0e52;color:#fff;padding:24px;border-radius:12px">
        <h3 style="color:#e9d758">New Chat Message</h3>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Message:</strong></p>
        <div style="background:#150578;padding:16px;border-radius:8px">${message}</div>
        <p style="margin-top:16px"><a href="${process.env.FRONTEND_URL}/admin/chat" style="color:#e9d758">View in Admin Dashboard</a></p>
        <p style="color:#cdcacc;font-size:12px">Reply directly to user at: ${email}</p>
      </div>`,
    }).catch(() => {}); // non-blocking

    res.json({ ok: true, id: chat._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Admin: get all chat messages
app.get('/api/admin/chats', async (req, res) => {
  try {
    const ChatMessage = (await import('./models/ChatMessage')).default;
    const chats = await ChatMessage.find().sort({ createdAt: -1 }).limit(200);
    res.json(chats);
  } catch {
    res.status(500).json({ message: 'Error fetching chats' });
  }
});

// Admin: reply to a chat message
app.post('/api/admin/chats/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    const ChatMessage = (await import('./models/ChatMessage')).default;
    const resend = (await import('./config/resend')).default;

    const chat = await ChatMessage.findById(req.params.id);
    if (!chat) { res.status(404).json({ message: 'Chat not found' }); return; }

    chat.reply = reply;
    chat.repliedAt = new Date();
    chat.isRead = true;
    await chat.save();

    // Send reply email to user
    await resend.emails.send({
      from: 'CrestlineTrades Support <noreply@crestlinetrades.com>',
      to: chat.email,
      subject: 'Reply from CrestlineTrades Support',
      html: `<div style="font-family:sans-serif;background:#0e0e52;color:#fff;padding:24px;border-radius:12px">
        <h3 style="color:#e9d758">Support Reply</h3>
        <p>Hi ${chat.name},</p>
        <p style="color:#cdcacc">Your message:</p>
        <div style="background:#150578;padding:12px;border-radius:8px;color:#cdcacc;margin-bottom:16px">${chat.message}</div>
        <p style="color:#cdcacc">Our response:</p>
        <div style="background:#150578;padding:16px;border-radius:8px">${reply}</div>
        <hr style="border-color:#150578;margin:20px 0"/>
        <p style="color:#cdcacc;font-size:12px">CrestlineTrades Support Team</p>
      </div>`,
    });

    res.json(chat);
  } catch {
    res.status(500).json({ message: 'Failed to reply' });
  }
});

// Admin: mark chat as read
app.patch('/api/admin/chats/:id/read', async (req, res) => {
  try {
    const ChatMessage = (await import('./models/ChatMessage')).default;
    const chat = await ChatMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json(chat);
  } catch {
    res.status(500).json({ message: 'Error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/copy-trading', copyTradingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CrestlineTrades API running on port ${PORT}`));

export default app;
