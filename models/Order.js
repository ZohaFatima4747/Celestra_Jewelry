const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  sessionId: { type: String },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: String,
      price: Number,
      qty: { type: Number, default: 1 }
    }
  ],
  total: { type: Number, required: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  status: { type: String, default: 'pending' }, // pending, completed, cancelled
  stripePayment: { 
    paymentIntentId: String,
    receipt_url: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
