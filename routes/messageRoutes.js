const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Order = require('../models/Order');

// GET all messages for a user — also supports ?email= for guest fallback
router.get('/user/:userId', async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH mark a single message as read
router.patch('/:messageId/read', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { isRead: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH mark all messages as read for a user
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    await Message.updateMany({ userId: req.params.userId }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;