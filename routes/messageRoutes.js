const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/auth');

// All message routes require authentication
router.use(authMiddleware);

// GET /api/messages/user/:userId
// Users can only fetch their own messages (enforced by comparing token userId)
router.get('/user/:userId', async (req, res) => {
  // Ensure the authenticated user is requesting their own messages
  if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    let messages = await Message.find({ userId: req.params.userId }).sort({ createdAt: -1 });

    // Guest / email fallback: look up orders by email and fetch their messages
    const { email } = req.query;
    if (email) {
      const orders = await Order.find({ 'customer.email': email }).select('_id sessionId').lean();
      const extraUserIds = [...new Set(orders.map((o) => o.sessionId).filter(Boolean))];
      if (extraUserIds.length > 0) {
        const extraMessages = await Message.find({
          userId: { $in: extraUserIds },
          _id: { $nin: messages.map((m) => m._id) },
        }).sort({ createdAt: -1 });
        messages = [...messages, ...extraMessages].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
    }

    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/messages/:messageId/read
router.patch('/:messageId/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Only the owner or admin can mark as read
    if (message.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    message.isRead = true;
    await message.save();
    res.json(message);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/messages/user/:userId/read-all
router.patch('/user/:userId/read-all', async (req, res) => {
  if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await Message.updateMany({ userId: req.params.userId }, { isRead: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
