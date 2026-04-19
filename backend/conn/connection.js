const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async (retries = 5) => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error("MONGODB_URI is not defined — set it in environment variables");
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: "majority",
      });

      logger.info("MongoDB connected successfully");
      return;
    } catch (err) {
      logger.error({ err }, `MongoDB connection failed (attempt ${attempt}/${retries})`);

      if (attempt === retries) {
        logger.error("All MongoDB connection attempts failed. Exiting...");
        process.exit(1);
      }

      await new Promise(res => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;