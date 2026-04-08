const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  items: [
    {
      product: {
        type: Object, 
        required: true
      },
      qty: { type: Number, default: 1 },
      selectedSize: { type: String, default: null },
      selectedColor: { type: String, default: null },
    }
  ],
  total: { type: Number, default: 0 },
  status: { type: String, default: "pending" }
}, { timestamps: true });

module.exports = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
