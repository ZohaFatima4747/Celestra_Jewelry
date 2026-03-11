// conn/connection.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://Connect-form:contactform00o@cluster0.b9afhru.mongodb.net/website");
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1); 
    }
};

module.exports = connectDB;
