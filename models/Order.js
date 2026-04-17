const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  sessionId: { type: String },
  orderType: { type: String, enum: ['online', 'manual'], default: 'online' },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional for manual orders
      name: String,
      price: Number,
      costPrice: { type: Number, default: 0 }, // cost price per unit (manual orders)
      qty: { type: Number, default: 1 },
      selectedSize: { type: String, default: null },
      selectedColor: { type: String, default: null },
    }
  ],
  total: { type: Number, required: true },
  totalCost: { type: Number, default: 0 },  // sum(costPrice × qty)
  profit:    { type: Number, default: 0 },  // total - totalCost
  customer: {
    name:     { type: String, required: true },
    email:    { type: String, default: '' },
    phone:    { type: String, default: '' },
    province: { type: String, default: '' },
    city:     { type: String, default: '' },
    address:  { type: String, default: '' },
  },
  status: { type: String, default: 'pending COD' }, // pending COD, shipped, delivered, cancelled, completed
  createdAt: { type: Date, default: Date.now }
});

// Indexes for common query patterns
OrderSchema.index({ sessionId: 1, createdAt: -1 });
OrderSchema.index({ "customer.email": 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
