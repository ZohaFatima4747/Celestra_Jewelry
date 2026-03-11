const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    token: { type: String, required: true },
    refreshToken: { type: String, required: true },
    loginAt: { type: Date, default: Date.now },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true }
});

module.exports = mongoose.model('Login', loginSchema);