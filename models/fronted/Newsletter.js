const mongoose = require("mongoose");

const Newsletter = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  attachments: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Newsletter", Newsletter);
