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
  if (String(req.user.id) !== String(req.params.userId) && req.user.role !== 'admin') {
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

    // Direct ownership check (string comparison to handle ObjectId vs string)
    const isDirectOwner = String(message.userId) === String(req.user.id);

    if (!isDirectOwner && req.user.role !== 'admin') {
      // Fallback: check if this message belongs to a guest session linked to the user's email
      // (covers the case where a user placed an order as guest before registering)
      let isEmailOwner = false;
      if (req.user.email) {
        const order = await Order.findOne({
          sessionId: message.userId,
          'customer.email': req.user.email,
        }).lean();
        isEmailOwner = !!order;
      }

      if (!isEmailOwner) {
        return res.status(403).json({ error: 'Forbidden' });
      }
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
  if (String(req.user.id) !== String(req.params.userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Collect all userIds to mark read: the user's own ID + any guest session IDs
    // linked to their email (same logic as the GET fetch)
    const userIds = [req.params.userId];

    if (req.user.email) {
      const orders = await Order.find({ 'customer.email': req.user.email })
        .select('sessionId').lean();
      const guestIds = [...new Set(orders.map((o) => o.sessionId).filter(Boolean))];
      userIds.push(...guestIds);
    }

    await Message.updateMany({ userId: { $in: userIds } }, { isRead: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
