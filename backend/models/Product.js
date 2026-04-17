const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price:       { type: Number, required: true, min: 0 },
    costPrice:   { type: Number, default: 0, min: 0 },  // purchase/cost price for profit calculation
    images:      { type: [String], default: [] },
    category:    { type: String, default: "", lowercase: true, trim: true },
    stock:       { type: Number, default: 0, min: 0 },
    sizes:       { type: [String], default: [] },
    colors:      { type: [String], default: [] },
    tags:        { type: [String], default: [] },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    numReviews:  { type: Number, default: 0, min: 0 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for fast category + price queries
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ name: "text", description: "text", tags: "text" });

module.exports =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
