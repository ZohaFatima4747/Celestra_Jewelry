const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
        default: null,
    },
    phone: {
        type: String,
        default: null,
    },
    province: {
        type: String,
        default: null,
    },
    city: {
        type: String,
        default: null,
    },
    address: {
        type: String,
        default: null,
    },
    isGuest: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    }
});

module.exports = mongoose.model('Contact', contactSchema);
