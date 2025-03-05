// models/favouriteConsultantModel.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema for favouriteConsultant
const favouriteConsultantSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "consultants",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Export the model
module.exports = mongoose.model("FavouriteConsultant", favouriteConsultantSchema);
