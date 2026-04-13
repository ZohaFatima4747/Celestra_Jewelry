const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  replied: { type: Boolean, default: false },
  repliedAt: { type: Date, default: null },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
