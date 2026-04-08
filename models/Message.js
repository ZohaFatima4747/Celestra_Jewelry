const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type: { 
    type: String, 
    enum: ['order_placed', 'order_cancelled', 'status_update'], 
    default: 'order_placed' 
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);